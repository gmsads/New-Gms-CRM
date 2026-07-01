/**
 * phone.service.js
 * Centralized Phone Number Normalization Service
 * Responsibilities:
 *  - Remove spaces, brackets, dashes, and trailing characters
 *  - Convert numbers to international E.164 format (e.g., +919876543210)
 *  - Auto-prepend default country code (configurable via DEFAULT_COUNTRY_CODE, defaults to +91)
 *  - Reject invalid numbers and normalize duplicate formats
 */

class PhoneService {
  constructor() {
    this.defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '+91';
  }

  /**
   * Normalizes a phone string into E.164 format (+[country_code][subscriber_number]).
   * @param {string|number} rawPhone - The input phone number string.
   * @param {string} [customCountryCode] - Optional override country code (e.g., '+1').
   * @returns {string|null} - Normalized E.164 phone string (e.g., '+919876543210') or null if invalid.
   */
  normalize(rawPhone, customCountryCode = null) {
    if (!rawPhone) return null;

    // Convert to string and trim
    let cleaned = String(rawPhone).trim();

    // Remove brackets, dashes, spaces, and formatting symbols except a leading '+'
    const hasLeadingPlus = cleaned.startsWith('+');
    cleaned = cleaned.replace(/[^\d]/g, '');

    if (!cleaned || cleaned.length < 7 || cleaned.length > 15) {
      return null; // Invalid international subscriber length according to ITU-T E.164
    }

    // Determine country code prefix
    const countryPrefix = customCountryCode || this.defaultCountryCode;
    const cleanPrefix = countryPrefix.replace(/[^\d]/g, '');

    // Case 1: Standard 10-digit number (e.g., India/USA local format) -> Prepend default country code
    if (cleaned.length === 10 && !hasLeadingPlus) {
      return `+${cleanPrefix}${cleaned}`;
    }

    // Case 2: Number already starts with 0 or 00 (e.g., 09876543210 or 00919876543210)
    if (cleaned.startsWith('00') && cleaned.length > 10) {
      return `+${cleaned.substring(2)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `+${cleanPrefix}${cleaned.substring(1)}`;
    }

    // Case 3: Number includes country code without '+' (e.g., 919876543210 where 91 is country code)
    if (cleaned.length === (10 + cleanPrefix.length) && cleaned.startsWith(cleanPrefix)) {
      return `+${cleaned}`;
    }

    // Case 4: Had leading plus originally or valid international length >= 11
    if (hasLeadingPlus || cleaned.length >= 11) {
      return `+${cleaned}`;
    }

    return null;
  }

  /**
   * Validates and returns structured result.
   * @param {string|number} rawPhone 
   * @returns {{ isValid: boolean, normalized: string|null, error: string|null }}
   */
  validateAndNormalize(rawPhone) {
    const normalized = this.normalize(rawPhone);
    if (!normalized) {
      return {
        isValid: false,
        normalized: null,
        error: `Invalid phone number format: "${rawPhone}". Must be a valid 10-15 digit E.164 number.`
      };
    }
    return {
      isValid: true,
      normalized,
      error: null
    };
  }
}

module.exports = new PhoneService();
