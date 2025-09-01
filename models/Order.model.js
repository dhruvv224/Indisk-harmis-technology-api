const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  order: {
    type: Object,
    required: true,
  },
  day: {
    type: String,
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  //transactionId: order.transactionId,
  // session: order.sessionId,
  // cardData: order.cardData,
  transactionId: {
    type: String,
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  cardData: {
    type: Object,
    required: true,
  },
  keyVersion: {
    type: String,
    default: "1",
  },
  signature: {
    type: String,
    required: true,
  },
  certificateData: {
    type: String,
    required: true,
  },
});

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
