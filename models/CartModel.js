const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  special_instruction:{
    type: String
  },
  topup:[{
    type: mongoose.Schema.Types.ObjectId,
  }],
  modifier:[{
    type: mongoose.Schema.Types.ObjectId,
  }],
  varient:[{
    type: mongoose.Schema.Types.ObjectId,
  }],
  discount:{
    type: mongoose.Schema.Types.ObjectId,
  }
});

const CartSchema = new mongoose.Schema({
  user_id: {
    type: String,
    unique: false,
    required: true,
  },
  table_no: {
    type: Number,
    default: 0,
  },
  items: [CartItemSchema],
});

module.exports = mongoose.model("Cart", CartSchema);
