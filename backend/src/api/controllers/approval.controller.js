const Approval = require('../../domains/hr/approval.model');
const User = require('../../domains/users/user.model');
const Notification = require('../../domains/hr/notification.model');
const { createAuditLog } = require('../../guards/audit.helper');

// ── GET /api/approvals (Admin/MD only) ───────────────────────────
exports.getApprovals = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const skip = (page - 1) * limit;
    const [approvals, total] = await Promise.all([
      Approval.find(filter)
        .populate('targetEmployee', 'name email role department status')
        .populate('initiatedBy', 'name role')
        .populate('reviewedBy', 'name role')
        .sort('-createdAt')
        .skip(skip).limit(Number(limit)),
      Approval.countDocuments(filter),
    ]);
    res.json({ approvals, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/approvals/:id/approve (Admin/MD only) ──────────────
exports.approveRequest = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id).populate('targetEmployee initiatedBy');
    if (!approval) return res.status(404).json({ message: 'Approval request not found.' });
    if (approval.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot approve. Current status: ${approval.status}` });
    }

    approval.status = 'APPROVED';
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    approval.adminNotes = req.body.notes || '';
    await approval.save();

    // Apply the change based on approval type
    if (approval.type === 'EMPLOYEE_CREATION') {
      await User.findByIdAndUpdate(approval.targetEmployee._id, {
        status: 'ACTIVE',
        approvedBy: req.user._id,
        approvedAt: new Date(),
      });
      await createAuditLog({
        action: 'EMPLOYEE_APPROVED', performedBy: req.user,
        targetEmployee: approval.targetEmployee,
        newValue: { status: 'ACTIVE' }, req, relatedApproval: approval._id,
      });
    } else if (approval.type === 'ROLE_CHANGE') {
      await User.findByIdAndUpdate(approval.targetEmployee._id, {
        role: approval.newValue.role, lastModifiedBy: req.user._id,
      });
      await createAuditLog({
        action: 'ROLE_CHANGED', performedBy: req.user,
        targetEmployee: approval.targetEmployee,
        previousValue: approval.previousValue, newValue: approval.newValue,
        req, relatedApproval: approval._id,
      });
    }

    // Notify HR who initiated
    await Notification.create({
      recipient: approval.initiatedBy._id,
      type: 'APPROVAL_GRANTED',
      title: 'Approval Granted',
      message: `Your request for ${approval.targetEmployee.name} (${approval.type}) has been approved by ${req.user.name}.`,
      priority: 'HIGH',
      relatedEntity: { entityType: 'Approval', entityId: approval._id },
    });

    res.json({ message: 'Request approved successfully.', approval });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/approvals/:id/reject (Admin/MD only) ───────────────
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required.' });

    const approval = await Approval.findById(req.params.id).populate('targetEmployee initiatedBy');
    if (!approval) return res.status(404).json({ message: 'Approval request not found.' });
    if (approval.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot reject. Current status: ${approval.status}` });
    }

    approval.status = 'REJECTED';
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    approval.adminNotes = reason;
    await approval.save();

    await createAuditLog({
      action: 'EMPLOYEE_REJECTED', performedBy: req.user,
      targetEmployee: approval.targetEmployee,
      notes: reason, req, relatedApproval: approval._id,
    });

    await Notification.create({
      recipient: approval.initiatedBy._id,
      type: 'APPROVAL_REJECTED',
      title: 'Request Rejected',
      message: `Your request for ${approval.targetEmployee.name} was rejected. Reason: ${reason}`,
      priority: 'HIGH',
      relatedEntity: { entityType: 'Approval', entityId: approval._id },
    });

    res.json({ message: 'Request rejected.', approval });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/approvals/:id/revise (Admin/MD only) ───────────────
// Sends back to HR with instructions to fix and resubmit
exports.reviseRequest = async (req, res) => {
  try {
    const { instructions } = req.body;
    if (!instructions) return res.status(400).json({ message: 'Revision instructions are required.' });

    const approval = await Approval.findById(req.params.id).populate('targetEmployee initiatedBy');
    if (!approval) return res.status(404).json({ message: 'Approval request not found.' });
    if (approval.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot revise. Current status: ${approval.status}` });
    }

    approval.status = 'REVISED';
    approval.reviewedBy = req.user._id;
    approval.reviewedAt = new Date();
    approval.revisionInstructions = instructions;
    await approval.save();

    await Notification.create({
      recipient: approval.initiatedBy._id,
      type: 'APPROVAL_REVISED',
      title: 'Request Sent Back for Revision',
      message: `Your request for ${approval.targetEmployee.name} needs revision: ${instructions}`,
      priority: 'HIGH',
      relatedEntity: { entityType: 'Approval', entityId: approval._id },
    });

    res.json({ message: 'Request sent back for revision.', approval });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/approvals/:id/resubmit (HR) ────────────────────────
exports.resubmitRequest = async (req, res) => {
  try {
    const originalApproval = await Approval.findById(req.params.id);
    if (!originalApproval) return res.status(404).json({ message: 'Original approval not found.' });
    if (originalApproval.status !== 'REVISED') {
      return res.status(400).json({ message: 'Can only resubmit REVISED requests.' });
    }

    const newApproval = await Approval.create({
      type: originalApproval.type,
      targetEmployee: originalApproval.targetEmployee,
      initiatedBy: req.user._id,
      status: 'PENDING',
      previousValue: originalApproval.previousValue,
      newValue: { ...originalApproval.newValue, ...(req.body.updatedData || {}) },
      hrNotes: req.body.hrNotes || 'Resubmitted after revision',
      parentApproval: originalApproval._id,
      submissionCount: originalApproval.submissionCount + 1,
    });

    const admins = await User.find({ role: { $in: ['ADMIN', 'MD_CEO'] }, status: 'ACTIVE' }).select('_id');
    await Notification.insertMany(admins.map(a => ({
      recipient: a._id, type: 'APPROVAL_REQUESTED',
      title: 'Revised Request Resubmitted',
      message: `HR resubmitted a revised request (attempt #${newApproval.submissionCount}).`,
      priority: 'HIGH',
      relatedEntity: { entityType: 'Approval', entityId: newApproval._id },
    })));

    res.status(201).json({ message: 'Request resubmitted for approval.', approval: newApproval });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
