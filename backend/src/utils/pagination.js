const paginate = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  let sort = {};
  if (query.sort) {
    const order = query.order === 'asc' ? 1 : -1;
    sort[query.sort] = order;
  } else {
    sort = { createdAt: -1 }; // Default sort
  }

  return { page, limit, skip, sort };
};

const formatPaginatedResponse = (data, totalRecords, page, limit) => {
  return {
    data,
    page,
    limit,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit)
  };
};

module.exports = { paginate, formatPaginatedResponse };
