const OrderModel = require("../models/Order");

// POST: Add or update tip amount for an order
const addTipToOrder = async (req, res) => {
  try {
    const { orderId, tipAmount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: false,
        message: "orderId is required",
      });
    }

    // Find the order by ID
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    // Update tip_amount only if provided
    if (tipAmount !== undefined) {
      order.tip_amount = tipAmount;
      await order.save();
    }

    return res.status(200).json({
      status: true,
      message: "Tip amount updated successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

module.exports = { addTipToOrder };
