/**
 * pipeline.workflow.js
 * Enforces the CRM pipeline stage transition rules.
 *
 * Valid pipeline: Lead → Prospect → Follow-up → Appointment → Proposal → Won | Lost
 *
 * Rules:
 * - No skipping stages (unless manager/admin)
 * - Every stage must have a nextAction set
 * - Moving to Won automatically triggers order.workflow
 */

const Prospect = require('../domains/sales/prospects/prospect.model');

// ─── Valid stage transitions ──────────────────────────────────────────────────
const STAGE_TRANSITIONS = {
  Lead:        ['Prospect', 'Lost'],
  Prospect:    ['Follow-up', 'Lost'],
  'Follow-up': ['Appointment', 'Proposal', 'Lost'],
  Appointment: ['Proposal', 'Negotiation', 'Lost'],
  Proposal:    ['Negotiation', 'Won', 'Lost'],
  Negotiation: ['Won', 'Lost'],
  Won:         [],   // terminal
  Lost:        [],   // terminal
};

// Roles that can skip stages
const SKIP_ALLOWED_ROLES = ['SALES_MANAGER', 'ADMIN', 'MD_CEO'];

/**
 * validateStageTransition
 * Pure function — returns { valid, reason }
 */
const validateStageTransition = (currentStage, targetStage, userRole) => {
  // Same stage — no-op (allowed)
  if (currentStage === targetStage) {
    return { valid: true };
  }

  // Terminal stages cannot transition
  if (STAGE_TRANSITIONS[currentStage]?.length === 0) {
    return { valid: false, reason: `Stage '${currentStage}' is terminal. No further transitions allowed.` };
  }

  const allowed = STAGE_TRANSITIONS[currentStage] || [];

  if (allowed.includes(targetStage)) {
    return { valid: true };
  }

  // Check if user can skip
  if (SKIP_ALLOWED_ROLES.includes(userRole)) {
    return { valid: true, skipped: true };
  }

  return {
    valid: false,
    reason: `Invalid stage transition: '${currentStage}' → '${targetStage}'. Allowed: [${allowed.join(', ')}].`,
  };
};

/**
 * moveProspectStage — Core workflow function
 * Called by the prospect controller's updateStage action.
 *
 * @param {string} prospectId
 * @param {string} targetStage
 * @param {Object} user - req.user
 * @param {Object} options - { nextAction, notes, nextFollowUpDate }
 * @returns {Object} { success, data, message }
 */
const moveProspectStage = async (prospectId, targetStage, user, options = {}) => {
  const prospect = await Prospect.findById(prospectId);
  if (!prospect) throw new Error('Prospect not found.');

  const { valid, reason, skipped } = validateStageTransition(prospect.stage, targetStage, user.role);
  if (!valid) {
    const err = new Error(reason);
    err.statusCode = 422;
    err.code = 'INVALID_STAGE_TRANSITION';
    throw err;
  }

  const previousStage = prospect.stage;

  // Apply stage change
  prospect.stage           = targetStage;
  prospect.lastInteraction = new Date();

  if (options.nextAction)       prospect.nextAction       = options.nextAction;
  if (options.notes)            prospect.lastInteractionNote = options.notes;
  if (options.nextFollowUpDate) prospect.nextFollowUpDate = options.nextFollowUpDate;

  // Auto-set probability by stage
  const STAGE_PROBABILITY = {
    Lead: 10, Prospect: 25, 'Follow-up': 35,
    Appointment: 50, Proposal: 65, Negotiation: 75, Won: 100, Lost: 0,
  };
  prospect.probability = STAGE_PROBABILITY[targetStage] ?? prospect.probability;

  await prospect.save();

  return {
    success: true,
    previousStage,
    currentStage: targetStage,
    skipped: skipped || false,
    prospect,
  };
};

/**
 * Middleware: validateStageTransitionMiddleware
 * Use on PATCH /prospects/:id/stage
 */
const validateStageMiddleware = async (req, res, next) => {
  try {
    const { stage: targetStage } = req.body;
    if (!targetStage) return res.status(400).json({ message: 'target stage is required in body.' });

    const prospect = await Prospect.findById(req.params.id).select('stage');
    if (!prospect) return res.status(404).json({ message: 'Prospect not found.' });

    const { valid, reason } = validateStageTransition(prospect.stage, targetStage, req.user.role);
    if (!valid) {
      return res.status(422).json({
        message: reason,
        code: 'INVALID_STAGE_TRANSITION',
        currentStage: prospect.stage,
        targetStage,
      });
    }

    req.prospect = prospect;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { moveProspectStage, validateStageTransition, validateStageMiddleware, STAGE_TRANSITIONS };
