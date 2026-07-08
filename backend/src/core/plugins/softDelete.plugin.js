module.exports = function softDeletePlugin(schema, options) {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }
  });

  schema.add({
    branch: { type: String, index: true } // Multi-Branch Data Isolation support
  });

  const typesFindQueryMiddleware = [
    'countDocuments',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndUpdate',
    'update',
    'updateOne',
    'updateMany'
  ];

  const excludeDeleted = function (next) {
    // If includeDeleted is not explicitly set to true in the query options, exclude deleted docs
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
    if (typeof next === 'function') next();
  };

  typesFindQueryMiddleware.forEach((type) => {
    schema.pre(type, excludeDeleted);
  });

  schema.methods.softDelete = function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (userId) this.deletedBy = userId;
    return this.save();
  };

  schema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };
};
