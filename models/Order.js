const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  table_no: {
    type: Number,
    required: true,
  },
  items: [
    {
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
      base_price: {
        type: Number,
        required: true,
        default: 0,
      },
      special_instruction:{
        type: String
      },
      discount:
      {
         isEnable: {
            type: Boolean,
         },
         percentage: {
            type: Number,
         },
         description: {
            type: String,
         }
      },
      varient: [
        {
          varientName: { type: String },
          price: { type: Number },
        },
      ],
      modifier: [
        {
            modifierName: { type: String },
            price: { type: Number },
        },
      ],
      topup: [
        {
            topupName: { type: String },
            price: { type: Number },
        }
      ]
    },
  ],
  payment_type: {
    type: String,
    enum: ["online", "cash", "viva","viva-terminal"],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Prepared", "Completed", "Cancelled", "Delivered"],
    default: "Preparing",
  },
  order_date: {
    type: Date,
    default: Date.now,
  },
  total_amount: { type: Number },
  viva_order_code: {
    type: String,
  },
  vat: { type: Number },
  vatPercentage: { type: Number },
  sub_total: { type: Number },
});

module.exports = mongoose.model("Order", OrderSchema);
