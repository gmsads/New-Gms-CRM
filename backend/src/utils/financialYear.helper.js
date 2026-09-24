const getFinancialYear = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 1 = Feb, 2 = Mar, 3 = Apr

  // Indian Financial Year: April 1 to March 31
  if (month >= 3) {
    // April to December -> currentYear to nextYear
    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
  } else {
    // January to March -> prevYear to currentYear
    return `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`;
  }
};

module.exports = {
  getFinancialYear
};
