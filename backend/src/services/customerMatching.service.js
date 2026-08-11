const Prospect = require('../domains/sales/prospects/prospect.model');
const Client = require('../domains/sales/client.model');

/**
 * Normalizes text for comparison (lowercase, trims, removes special characters)
 */
const normalizeStr = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

/**
 * Normalizes mobile number (removes +91, spaces, dashes)
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length > 10 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned.slice(-10); // get last 10 digits
};

class CustomerMatchingService {
  /**
   * Expose normalizePhone for external use to prevent duplicating logic
   */
  normalizePhone(phone) {
    return normalizePhone(phone);
  }

  /**
   * Find matching client or prospect based on provided data
   * @param {Object} data 
   * @param {String} data.phone
   * @param {String} data.email
   * @param {String} data.gstNumber
   * @param {String} data.company
   * @param {String} data.billingAddress
   * @returns {Object} { exactMatch: true/false, client: Document|null, prospect: Document|null, matchReason: String }
   */
  async findMatch(data) {
    const phone = normalizePhone(data.phone || data.mobile);
    const altPhone = normalizePhone(data.alternateMobile);
    const email = data.email ? data.email.toLowerCase().trim() : null;
    const gstNumber = data.gstNumber ? data.gstNumber.toUpperCase().trim() : null;
    const companyNorm = normalizeStr(data.company || data.businessName);
    const cityNorm = data.billingAddress && data.billingAddress.city ? normalizeStr(data.billingAddress.city) : 
                     (data.location ? normalizeStr(data.location) : null);

    // Helper to query both Client and Prospect
    const queryBoth = async (query) => {
      // Prioritize clients over prospects
      const client = await Client.findOne(query).sort({ createdAt: -1 });
      if (client) return { match: client, type: 'client' };
      
      const prospect = await Prospect.findOne(query).sort({ createdAt: -1 });
      if (prospect) return { match: prospect, type: 'prospect' };
      
      return null;
    };

    // 1. GST Match (Strongest)
    if (gstNumber && gstNumber !== 'UNREGISTERED' && gstNumber.length === 15) {
      const result = await queryBoth({ gstNumber });
      if (result) {
        return this._formatResponse(result, 'Exact GST Match');
      }
    }

    // 2. Mobile Number Match
    if (phone && phone.length === 10) {
      // check primary and alternate
      const result = await queryBoth({ 
        $or: [
          { phone: { $regex: new RegExp(phone + '$') } },
          { alternateMobile: { $regex: new RegExp(phone + '$') } }
        ]
      });
      if (result) {
        return this._formatResponse(result, 'Exact Mobile Match');
      }
    }

    // Alt Mobile Match
    if (altPhone && altPhone.length === 10) {
      const result = await queryBoth({ 
        $or: [
          { phone: { $regex: new RegExp(altPhone + '$') } },
          { alternateMobile: { $regex: new RegExp(altPhone + '$') } }
        ]
      });
      if (result) {
        return this._formatResponse(result, 'Exact Alternate Mobile Match');
      }
    }

    // 3. Email Match
    if (email) {
      const result = await queryBoth({ email });
      if (result) {
        return this._formatResponse(result, 'Exact Email Match');
      }
    }

    // 4. Company + Mobile Match
    if (companyNorm && phone) {
      // Need a bit more manual checking for company normalization, or regex search
      // Using regex for simple 'like' match
      const companyRegex = new RegExp(companyNorm.split('').join('.*?'), 'i');
      const result = await queryBoth({
        company: { $regex: companyRegex },
        $or: [
          { phone: { $regex: new RegExp(phone + '$') } },
          { alternateMobile: { $regex: new RegExp(phone + '$') } }
        ]
      });
      if (result) {
        return this._formatResponse(result, 'Company + Mobile Match');
      }
    }

    // 5. Company + City Match (Weaker, but possible)
    if (companyNorm && cityNorm) {
      // Since city could be in billingAddress.city or location
      const companyRegex = new RegExp(companyNorm.split('').join('.*?'), 'i');
      const cityRegex = new RegExp(cityNorm.split('').join('.*?'), 'i');
      
      const result = await queryBoth({
        company: { $regex: companyRegex },
        $or: [
          { 'billingAddress.city': { $regex: cityRegex } },
          { location: { $regex: cityRegex } },
          { address: { $regex: cityRegex } }
        ]
      });
      if (result) {
        return this._formatResponse(result, 'Company + City Match');
      }
    }

    return {
      exactMatch: false,
      client: null,
      prospect: null,
      matchReason: 'No match found'
    };
  }

  _formatResponse(result, reason) {
    return {
      exactMatch: true,
      client: result.type === 'client' ? result.match : null,
      prospect: result.type === 'prospect' ? result.match : null,
      matchReason: reason
    };
  }

  /**
   * Helper to merge duplicate records if needed, or simply deduplicate data before save.
   */
  async ensureUniqueCustomer(data, userId) {
    const match = await this.findMatch(data);
    
    if (match.exactMatch) {
      return {
        isNew: false,
        client: match.client,
        prospect: match.prospect,
        reason: match.matchReason
      };
    }

    // If no match, create a new Prospect (Clients are usually created ONLY after an Order)
    const newProspect = new Prospect({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    
    await newProspect.save();

    return {
      isNew: true,
      prospect: newProspect,
      client: null,
      reason: 'Created new prospect'
    };
  }
}

module.exports = new CustomerMatchingService();
