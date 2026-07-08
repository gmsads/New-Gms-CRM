// backend/src/utils/softDelete.plugin.js

module.exports = function softDeletePlugin(schema, options) {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User', default: null },
    restoredAt: { type: Date, default: null },
    restoredBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User', default: null }
  });

  // Exclude deleted documents from standard queries
  const typesFindQueryMiddleware = [
    'count',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndUpdate',
    'update',
    'updateOne',
    'updateMany'
  ];

  const excludeDeleted = function(next) {
    // Only exclude if isDeleted is not explicitly requested in the query
    if (this.getQuery && this.getQuery().isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    if (typeof next === 'function') {
      next();
    }
  };

  typesFindQueryMiddleware.forEach((type) => {
    schema.pre(type, excludeDeleted);
  });

  // Exclude from aggregations
  schema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    if (typeof next === 'function') next();
  });

  // Soft delete method
  schema.methods.softDelete = async function(userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return await this.save();
  };

  // Restore method
  schema.methods.restore = async function(userId) {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    this.restoredAt = new Date();
    this.restoredBy = userId;
    return await this.save();
  };
};
