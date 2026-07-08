const Lead = require('../models/lead.model');
const LeadActivity = require('../models/leadActivity.model');
const LeadCall = require('../models/leadCall.model');
const LeadFollowup = require('../models/leadFollowup.model');
const Prospect = require('../../sales/prospects/prospect.model');

/**
 * LeadService
 * Core domain service for Lead Management & Tele Sales.
 */
class LeadService {
  /**
   * generateLeadNumber
   */
  async generateLeadNumber() {
    const count = await Lead.countDocuments({});
    return `LD-${10001 + count}`;
  }

  /**
   * createLead
   */
  async createLead(data, actor) {
    const mongoose = require('mongoose');
    const cleanData = { ...data };
    if (!mongoose.isValidObjectId(cleanData.campaign)) cleanData.campaign = null;
    if (!mongoose.isValidObjectId(cleanData.assignedEmployee)) cleanData.assignedEmployee = actor._id;

    const leadNumber = await this.generateLeadNumber();
    
    // Check duplicates
    const existing = await Lead.findOne({
      $or: [
        { phone: cleanData.phone },
        { email: cleanData.email ? cleanData.email.toLowerCase().trim() : 'nonexistent@example.com' }
      ],
      isDeleted: { $ne: true }
    });

    if (existing) {
      const err = new Error(`Lead with phone ${cleanData.phone} or email already exists (${existing.leadNumber}).`);
      err.status = 400;
      throw err;
    }

    const newLead = await Lead.create({
      ...cleanData,
      leadNumber,
      createdBy: actor._id,
      assignedEmployee: cleanData.assignedEmployee || actor._id,
      assignedDate: new Date(),
      currentStatus: data.currentStatus || 'New',
      timeline: [{
        type: 'CREATED',
        title: 'Lead Created Manually',
        description: `Created by ${actor.name}`,
        performedBy: actor._id,
        performedByName: actor.name
      }]
    });

    await LeadActivity.create({
      leadId: newLead._id,
      performedBy: actor._id,
      performedByName: actor.name,
      activityType: 'CREATED',
      description: `Created lead ${newLead.leadNumber}`
    });

    return newLead;
  }

  /**
   * listLeads (Supports Lead Pool & My Leads tabs)
   */
  async listLeads({ filter = {}, page = 1, limit = 20, sort = { createdAt: -1 }, search = '' }) {
    const query = { ...filter, isDeleted: { $ne: true } };

    if (search) {
      query.$or = [
        { contactPerson: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedEmployee', 'name email')
        .populate('campaign', 'name pipeline')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Lead.countDocuments(query)
    ]);

    return {
      leads,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  /**
   * previewBulkImport
   * Validates rows and detects duplicates before committing.
   */
  async previewBulkImport(rows) {
    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];

    // Extract all phones and emails to batch scan Mongo
    const phones = rows.map(r => (r.phone || r.Phone || '').toString().trim()).filter(Boolean);
    const emails = rows.map(r => (r.email || r.Email || '').toString().toLowerCase().trim()).filter(Boolean);

    const existingDocs = await Lead.find({
      $or: [
        { phone: { $in: phones } },
        { email: { $in: emails } }
      ],
      isDeleted: { $ne: true }
    }).select('phone email companyName leadNumber').lean();

    const dupPhoneMap = new Map(existingDocs.map(d => [d.phone, d]));
    const dupEmailMap = new Map(existingDocs.map(d => [d.email, d]));

    rows.forEach((row, idx) => {
      const contactPerson = (row.contactPerson || row['Contact Person'] || row.name || '').toString().trim();
      const phone = (row.phone || row.Phone || row.mobile || '').toString().trim();
      const email = (row.email || row.Email || '').toString().toLowerCase().trim();
      const companyName = (row.companyName || row.Company || row['Company Name'] || '').toString().trim();

      if (!contactPerson || !phone) {
        invalidRows.push({ rowIndex: idx + 1, row, reason: 'Missing required field: Contact Person or Phone' });
        return;
      }

      const matchedDup = dupPhoneMap.get(phone) || (email ? dupEmailMap.get(email) : null);
      if (matchedDup) {
        duplicateRows.push({
          rowIndex: idx + 1,
          row: { ...row, contactPerson, phone, email, companyName },
          existingLeadNumber: matchedDup.leadNumber,
          conflictField: dupPhoneMap.has(phone) ? 'Phone' : 'Email'
        });
      } else {
        validRows.push({
          contactPerson,
          phone,
          alternatePhone: (row.alternatePhone || row['Alternate Phone'] || '').toString().trim(),
          email,
          companyName,
          city: (row.city || row.City || '').toString().trim(),
          state: (row.state || row.State || '').toString().trim(),
          businessCategory: (row.businessCategory || row.Category || '').toString().trim(),
          source: row.source || 'Excel',
          mappedEmployee: (row.mappedEmployee || row['Assigned To'] || row.employee || '').toString().trim()
        });
      }
    });

    return {
      totalUploaded: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicateRows.length,
      validRows,
      invalidRows,
      duplicateRows
    };
  }

  /**
   * commitBulkImport
   * Commits valid records with duplicate resolution (Skip, Replace, Merge).
   */
  async commitBulkImport({ validRows, duplicateRows = [], resolution = 'Skip', campaignId = null, actor }) {
    let importedCount = 0;
    let replacedCount = 0;
    let mergedCount = 0;
    const insertedLeadIds = [];

    // 1. Insert valid non-duplicate rows
    if (validRows && validRows.length > 0) {
      const baseNum = await Lead.countDocuments({});
      const docsToInsert = validRows.map((r, idx) => ({
        ...r,
        leadNumber: `LD-${10001 + baseNum + idx}`,
        campaign: campaignId,
        createdBy: actor._id,
        timeline: [{
          type: 'IMPORTED',
          title: 'Imported via Excel/CSV',
          description: `Uploaded by ${actor.name}`,
          performedBy: actor._id,
          performedByName: actor.name
        }]
      }));

      const inserted = await Lead.insertMany(docsToInsert, { ordered: false });
      importedCount += inserted.length;
      inserted.forEach(d => insertedLeadIds.push(d._id));
    }

    // 2. Handle duplicate resolutions
    if (duplicateRows && duplicateRows.length > 0 && resolution !== 'Skip') {
      for (const dup of duplicateRows) {
        const existing = await Lead.findOne({ leadNumber: dup.existingLeadNumber });
        if (!existing) continue;

        if (resolution === 'Replace') {
          existing.contactPerson = dup.row.contactPerson || existing.contactPerson;
          existing.companyName = dup.row.companyName || existing.companyName;
          existing.email = dup.row.email || existing.email;
          existing.city = dup.row.city || existing.city;
          existing.timeline.push({
            type: 'IMPORTED',
            title: 'Record Replaced on Import',
            description: `Replaced by import from ${actor.name}`,
            performedBy: actor._id,
            performedByName: actor.name
          });
          await existing.save();
          replacedCount++;
          insertedLeadIds.push(existing._id);
        } else if (resolution === 'Merge') {
          // Fill blanks only
          if (!existing.companyName && dup.row.companyName) existing.companyName = dup.row.companyName;
          if (!existing.email && dup.row.email) existing.email = dup.row.email;
          if (!existing.city && dup.row.city) existing.city = dup.row.city;
          existing.timeline.push({
            type: 'IMPORTED',
            title: 'Record Merged on Import',
            description: `Merged missing fields from import by ${actor.name}`,
            performedBy: actor._id,
            performedByName: actor.name
          });
          await existing.save();
          mergedCount++;
          insertedLeadIds.push(existing._id);
        }
      }
    }

    return {
      success: true,
      importedCount,
      replacedCount,
      mergedCount,
      skippedCount: resolution === 'Skip' ? duplicateRows.length : 0,
      leadIds: insertedLeadIds
    };
  }

  /**
   * convertToProspect
   * Converts Qualified Lead into existing Prospect CRM model without breaking flow.
   */
  async convertToProspect(leadId, actor) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found.');
    if (lead.currentStatus === 'Converted') throw new Error('Lead is already converted to a Prospect.');

    // Check if Prospect with same phone already exists
    let prospect = await Prospect.findOne({ phone: lead.phone });
    if (!prospect) {
      prospect = await Prospect.create({
        name: lead.contactPerson,
        phone: lead.phone,
        email: lead.email || undefined,
        company: lead.companyName || undefined,
        source: 'Other',
        stage: 'Prospect',
        priority: lead.priority === 'Urgent' ? 'Hot' : (lead.priority === 'High' ? 'Warm' : 'Cold'),
        status: 'In-progress',
        assignedTo: lead.assignedEmployee || actor._id,
        createdBy: actor._id,
        remarks: lead.lastRemark || `Converted from Lead ${lead.leadNumber}`
      });
    }

    lead.currentStatus = 'Converted';
    lead.convertedToProspectId = prospect._id;
    lead.convertedAt = new Date();
    lead.timeline.push({
      type: 'CONVERTED',
      title: 'Converted to Prospect',
      description: `Bridge to Prospect CRM flow initiated by ${actor.name}`,
      performedBy: actor._id,
      performedByName: actor.name
    });
    await lead.save();

    await LeadActivity.create({
      leadId: lead._id,
      performedBy: actor._id,
      performedByName: actor.name,
      activityType: 'CONVERTED',
      description: `Converted lead ${lead.leadNumber} to Prospect ${prospect._id}`
    });

    return { success: true, lead, prospect };
  }
}

module.exports = new LeadService();
