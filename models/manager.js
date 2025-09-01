const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurant",
    required: true,
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  assigned_at: {
    type: Date,
    default: Date.now,
  },
  vat: { 
    type: Number, 
    default: 25
  },

});

const Manager = mongoose.model("managers", managerSchema);
module.exports = Manager;
