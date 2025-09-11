const mongoose = require('mongoose');

const TerminalSchema = new mongoose.Schema({
  terminal_id: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Terminal', TerminalSchema);
