/**
 * Normalizes a phone number for unified search and comparison.
 * Strips all non-numeric characters.
 * Defaults to adding '91' country code if exactly 10 digits are provided.
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned || null;
}

/**
 * Normalizes a business/company name for disambiguation matching.
 * Converts to lowercase, removes punctuation, extra spaces, and common legal suffixes.
 */
function normalizeCompanyName(name) {
  if (!name) return null;
  let normalized = String(name).toLowerCase();
  // Remove common punctuation
  normalized = normalized.replace(/[.,'"]/g, '');
  // Remove common legal suffixes
  normalized = normalized.replace(/\b(pvt|ltd|limited|private|llp|inc|corp)\b/g, '');
  // Replace multiple spaces with a single space and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized || null;
}

module.exports = {
  normalizePhone,
  normalizeCompanyName
};
