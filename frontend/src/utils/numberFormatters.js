/**
 * Formats a numeric value into concise Indian currency notation (k, L, Cr).
 * Examples:
 *  10230 -> ₹10.23k
 *  156000 -> ₹1.56L
 *  12500000 -> ₹1.25Cr
 */
export const formatINRConcise = (value, prefix = '₹') => {
  const num = Number(value) || 0;
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 10000000) {
    const formatted = (absNum / 10000000).toFixed(2).replace(/\.?0+$/, '');
    return `${sign}${prefix}${formatted}Cr`;
  }
  if (absNum >= 100000) {
    const formatted = (absNum / 100000).toFixed(2).replace(/\.?0+$/, '');
    return `${sign}${prefix}${formatted}L`;
  }
  if (absNum >= 1000) {
    const formatted = (absNum / 1000).toFixed(2).replace(/\.?0+$/, '');
    return `${sign}${prefix}${formatted}k`;
  }
  return `${sign}${prefix}${absNum.toLocaleString('en-IN')}`;
};

/**
 * Formats a raw number without currency prefix into concise notation (k, L, Cr).
 * Examples:
 *  10230 -> 10.23k
 *  156000 -> 1.56L
 *  12500000 -> 1.25Cr
 */
export const formatNumConcise = (value) => {
  return formatINRConcise(value, '');
};
