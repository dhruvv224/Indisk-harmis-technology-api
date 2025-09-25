const mongoose = require('mongoose');

const TerminalSchema = new mongoose.Schema({
  terminal_id: {
    type: String,
    required: true,
  },
  manager_id: {
    type:String,
    ref: 'Manager',
    required: true,
    unique: false, // one terminal per manager
  }
}, { timestamps: true });

module.exports = mongoose.model('Terminal', TerminalSchema);
