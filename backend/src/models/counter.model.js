const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: {
    type: String, // e.g. 'quotation', 'invoice', 'order'
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 1000
  }
});

module.exports = mongoose.model('Counter', counterSchema);
