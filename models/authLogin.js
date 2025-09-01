const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  food_item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const UserAuthSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["owner", "manager", "waiter", "kitchen-staff"],
    required: true,
  },
  username: String,
  image: String,
  gender: { type: String, enum: ["male", "female", "other"] },
  cart: [CartItemSchema],
  createdAt: { type: Date, default: Date.now },
});

const UserAuth = mongoose.model("login", UserAuthSchema);

module.exports = UserAuth;
