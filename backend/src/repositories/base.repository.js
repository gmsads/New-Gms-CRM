class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async find(filter = {}, options = {}) {
    let query = this.model.find(filter);
    if (options.populate) query = query.populate(options.populate);
    if (options.sort) query = query.sort(options.sort);
    if (options.lean) query = query.lean();
    return await query;
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);
    if (options.populate) query = query.populate(options.populate);
    return await query;
  }

  async findOne(filter, options = {}) {
    let query = this.model.findOne(filter);
    if (options.populate) query = query.populate(options.populate);
    return await query;
  }

  async updateById(id, data, options = { new: true }) {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async countDocuments(filter = {}) {
    return await this.model.countDocuments(filter);
  }
}

module.exports = BaseRepository;
