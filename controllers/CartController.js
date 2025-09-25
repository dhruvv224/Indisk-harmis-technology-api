const UserAuth = require("../models/authLogin");
const FoodItemSchema = require("../models/FoodItem");
const OrderModel = require("../models/Order");
const StaffModel = require("../models/staff");
const ManagerModel = require("../models/manager");
const { createVivaOrder } = require("../utils/vivaWallet");
const Cart = require("../models/CartModel");
const dayjs = require('dayjs');
const relativeTime = require("dayjs/plugin/relativeTime");
const moment = require("moment");
const ObjectId = require("mongoose").Types.ObjectId;
const Table = require("../models/Table");
const FoodItem = require("../models/FoodItem");
const axios = require('axios');

dayjs.extend(relativeTime);


const getCart = async (req, res) => {
  try {
    const { user_id, table_no } = req.body;

    if (!user_id || table_no == null) {
      return res.status(400).json({
        success: false,
        message: "user_id and table_no is required",
      });
    }

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cart = await Cart.findOne({ user_id, table_no }).populate("items.product_id");
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        cart: [],
      });
    }

    const activeOrder = await OrderModel.findOne({
      user: user_id,
      table_no,
      status: { $in: ["Preparing", "Prepared"] },
    });

    const cartDetails = cart.items.map((item) => {
      const food = item.product_id;

      // Helper to match IDs to full objects
      const matchObjects = (ids = [], collection = []) =>
        ids
          .map((id) =>
            collection.find((obj) => obj._id?.toString() === id.toString())
          )
          .filter(Boolean);

      // Match objects from FoodItem
      const matchedTopups = matchObjects(item.topup, food.topup || []);
      const matchedModifiers = matchObjects(item.modifier, food.modifier || []);
      const matchedVarients = matchObjects(item.varient, food.varient || []);
      const matchedDiscount =
        item.discount && food.discount
          ? food.discount.find(
              (d) => d._id?.toString() === item.discount.toString()
            )
          : null;
      let basePrice = food.base_price || 0;

      const varientPrice = matchedVarients.reduce((sum, v) => sum + (v.price || 0), 0);
      const modifierPrice = matchedModifiers.reduce((sum, m) => sum + (m.price || 0), 0);
      const topupPrice = matchedTopups.reduce((sum, t) => sum + (t.price || 0), 0);

      let priceWithAddons = basePrice + varientPrice + modifierPrice + topupPrice;

      // Apply discount if available
      if (matchedDiscount?.isEnable && matchedDiscount?.percentage) {
        const discountAmount = (matchedDiscount.percentage / 100) * priceWithAddons;
        priceWithAddons -= discountAmount;
      }

      priceWithAddons = +priceWithAddons.toFixed(2);
      const totalPrice = priceWithAddons * item.quantity;

      return {
        food_item_id: food._id,
        image: food.image,
        product_name: food.name,
        price_per_unit: priceWithAddons,
        quantity: item.quantity,
        total_price: +totalPrice.toFixed(2),
        // topup:food.topup || [],
        // modifier: food.modifier || [],
        // varient: food.varient || [],
        // discount: food.discount || [],
        additional_price: {
          topup: matchedTopups,
          modifier: matchedModifiers,
          varient: matchedVarients,
          discount: matchedDiscount,
        },
        special_instruction: item.special_instruction || "",
        is_ordered:
          activeOrder &&
          activeOrder.items.find(
            ({ food_item }) => food_item.toString() === food._id.toString()
          )
            ? true
            : false,
      };
    });

    const subtotal = cartDetails.reduce((acc, item) => acc + item.total_price, 0);
    const totalQuantity = cartDetails.reduce((acc, item) => acc + item.quantity, 0);
    const gstAmount = +(subtotal * 0.05).toFixed(2);
    const grandTotal = +(subtotal + gstAmount).toFixed(2);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart: cartDetails,
      total_quantity: totalQuantity,
      subtotal,
      gst_5_percent: gstAmount,
      total_with_gst: grandTotal,
    });
  } catch (err) {
    console.error("Error in getCart:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    
    let { user_id, product_id, quantity, table_no,special_instruction, topup, modifier, varient, discount } = req.body;

    if (!user_id || !product_id || !quantity || table_no == null) {
      return res.status(400).json({
        success: false,
        message: "user_id, product_id, table_no and valid quantity are required",
      });
    }

    quantity = parseInt(quantity) || 1;
    if (quantity < 1) quantity = 1;

    // const user = await UserAuth.findById(user_id);
    // if (!user) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "User not found" });
    // }

    const food = await FoodItemSchema.findById(product_id);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: `Food item ${product_id} not found`,
      });
    }


    let cart = await Cart.findOne({ user_id, table_no });

    if (!cart) {
      cart = new Cart({
        user_id,
        table_no,
        items: [{ product_id: product_id, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product_id.toString() === product_id
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].special_instruction = special_instruction || "";
        cart.items[itemIndex].topup = topup || [];
        cart.items[itemIndex].modifier = modifier || [];
        cart.items[itemIndex].varient = varient || [];
        discount ? cart.items[itemIndex].discount = discount : '';
      } else {
        cart.items.push({ product_id, quantity,special_instruction, topup, modifier, varient, discount });
      }
    }
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully!",
    });
  } catch (err) {
    console.error("Error in addToCart:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { user_id, product_id, type, table_no } = req.body;

    if (!user_id || !product_id || !["increase", "decrease"].includes(type) || table_no == null) {
      return res.status(400).json({
        success: false,
        message:
          "user_id, product_id, table_no and valid type ('increase' or 'decrease') are required",
      });
    }

    const cart = await Cart.findOne({ user_id, table_no }).populate("items.product_id");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for user" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product_id._id.toString() === product_id
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    if (type === "increase") {
      cart.items[itemIndex].quantity += 1;
    } else if (type === "decrease") {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } else {
        cart.items.splice(itemIndex, 1);
      }
    }

    await cart.save();

    await cart.populate("items.product_id");

    const cartDetails = cart.items.map((item) => {
      const product = item.product_id;
      return {
        food_item_id: product._id,
        image: product.image,
        product_name: product.name,
        price: product.base_price,
        quantity: item.quantity,
        total_price: product.base_price * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      message: `Quantity ${type === "increase" ? "increased" : "decreased"}!`,
    });
  } catch (err) {
    console.error("Error in updateQuantity:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { user_id, product_id, table_no } = req.body;

    if (!user_id || !product_id || table_no == null) {
      return res.status(400).json({
        success: false,
        message: "user_id, table_no and product_id are required",
      });
    }

    const cart = await Cart.findOne({ user_id, table_no });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for user and table" });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== product_id
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const { user_id, table_no } = req.body;

    if (!user_id || table_no == null) {
      return res.status(400).json({
        success: false,
        message: "user_id and table_no is required",
      });
    }

    const cart = await Cart.findOne({ user_id, table_no });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user",
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully!",
      cart: user_id.cart,
    });
  } catch (err) {
    console.error("Error in clearCart:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { user_id, table_no } = req.body;

    if (!user_id || table_no == null) {
      return res.status(400).json({
        success: false,
        message: "user_id and table_no are required",
      });
    }

    const cart = await Cart.findOne({ user_id, table_no }).populate("items.product_id");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }
    let staffInfo = await StaffModel.findOne({ _id:user_id });
    let managerInfo = await ManagerModel.findOne({ user_id: staffInfo?.manager_id });
    if (!staffInfo || !managerInfo) {
      return res.status(404).json({
        success: false,
        message: "Table or manager not found",
      });
    }
    let vat = managerInfo.vat || 0;
    let subtotalAmountRaw = 0;
    const items = [];

    for (const item of cart.items) {
      const food = item.product_id;
      const matchObjects = (ids = [], collection = []) =>
        ids
          .map((id) => collection.find((obj) => obj._id?.toString() === id.toString()))
          .filter(Boolean);

      const matchedTopups = matchObjects(item.topup, food.topup || []);
      const matchedModifiers = matchObjects(item.modifier, food.modifier || []);
      const matchedVarients = matchObjects(item.varient, food.varient || []);

      const matchedDiscount =
        item.discount && food.discount
          ? food.discount.find((d) => d._id?.toString() === item.discount.toString())
          : null;

      const basePrice = food.base_price || 0;
      const varientPrice = matchedVarients.reduce((sum, v) => sum + (v.price || 0), 0);
      const modifierPrice = matchedModifiers.reduce((sum, m) => sum + (m.price || 0), 0);
      const topupPrice = matchedTopups.reduce((sum, t) => sum + (t.price || 0), 0);
      let itemPrice = basePrice + varientPrice + modifierPrice + topupPrice;

      if (matchedDiscount?.isEnable && matchedDiscount?.percentage) {
        const discountAmount = (matchedDiscount.percentage / 100) * itemPrice;
        itemPrice -= discountAmount;
      }

      itemPrice = +itemPrice.toFixed(2);
      const totalItemPrice = itemPrice * item.quantity;
      subtotalAmountRaw += totalItemPrice;
      items.push({
        food_item: food._id,
        quantity: item.quantity,
        base_price:item.base_price || basePrice,
        special_instruction: item.special_instruction || "",
        discount: matchedDiscount || {},
        varient: matchedVarients.map((v) => ({
          varientName: v.varientName,
          price: v.price,
        })),
        modifier: matchedModifiers.map((m) => ({
          modifierName: m.modifierName,
          price: m.price,
        })),
        topup: matchedTopups.map((t) => ({
          topupName: t.topupName,
          price: t.price,
        })),
      });
    }

    const vatAmount = +(subtotalAmountRaw * (vat / 100)).toFixed(2);
    const totalAmountRaw = +(subtotalAmountRaw + vatAmount).toFixed(2);

    let order;
    let isNewOrder = false;

    let activeOrder = await OrderModel.findOne({
      table_no,
      status: { $in: ["Preparing", "Prepared"] },
    });

    if (table_no != 0 && activeOrder) {
      activeOrder.items = activeOrder.items.concat(items);
      activeOrder.sub_total += subtotalAmountRaw;
      activeOrder.total_amount += totalAmountRaw;
      activeOrder.vat += vatAmount;
      activeOrder.vatPercentage = vat;
      activeOrder.manager_id =  staffInfo?.manager_id;
      await activeOrder.save();
      order = activeOrder;
    } else {
      const orderData = {
        user: user_id,
        table_no,
        items,
        payment_type: "cash",
        payment_status: "pending",
        status: "Preparing",
        order_date: new Date(),
        sub_total: subtotalAmountRaw,
        total_amount: totalAmountRaw,
        vat: vatAmount,
        vatPercentage: vat,
        manager_id: staffInfo?.manager_id
      };
      order = await OrderModel.create(orderData);
      isNewOrder = true;
    }

    cart.items = [];
    await cart.save();

      // For demonstration, payment_status is set to 'success'.
      // In real payment integration, set this based on actual payment result.
      return res.status(200).json({
        success: true,
        message: isNewOrder
          ? "Order placed successfully"
          : "Order updated successfully",
        order,
        payment_status: "success" // or "failed" if payment fails
      });
  } catch (err) {
    console.error("placeOrder error:", err);
  return res.status(500).json({ success: false, message: err.message, payment_status: "failed" });
  }
};

const getKitchenOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({
      status: { $in: ["Pending", "Preparing"] },
    })
      .populate("user", "username email role") // Populate user info
      .populate("items.food_item") // Populate food items
      .sort({ order_date: -1 }); // Latest first

    return res.status(200).json({
      success: true,
      message: "Kitchen orders fetched successfully",
      orders,
    });
  } catch (err) {
    console.error("getKitchenOrders error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { order_id, status } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({
        success: false,
        message: "order_id and status are required",
      });
    }

    const validStatuses = ["Prepared", "Preparing", "Completed", "Cancelled","Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await OrderModel.findById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
const getTableBill = async (req, res) => {
  try {
    let { table_no, order_id } = req.body;
    let query = {};
    if(table_no == "Take away order"){
      if(!order_id){
        return res.status(400).json({
          success: false,
          message: "order_id are required",
        });
      }
      query._id = order_id;
    }else{
      if (!table_no) {
        return res.status(400).json({
          success: false,
          message: "table_no are required",
        });
      }
      query = {table_no, payment_status :{$ne:"paid"}}
    }
    

    const orders = await OrderModel.find(query).populate({
        path: "items.food_item",
        select: "name base_price", // add other fields if needed
      });


    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    let items = [];
    let total_items = 0;
    let total_sub_total = 0;
    let total_vat = 0;
    let total_amount = 0;
    

    orders.forEach((order) => {
      order_id = order?._id || "";
      order.items.forEach((item) => {
        const basePrice = item.food_item?.base_price || 0;
        const quantity = item.quantity;

        // Variant, Modifier, Topup Total Add-on Prices
        const variantTotal = (item.varient || []).reduce((sum, v) => sum + (v.price || 0), 0);
        const modifierTotal = (item.modifier || []).reduce((sum, m) => sum + (m.price || 0), 0);
        const topupTotal = (item.topup || []).reduce((sum, t) => sum + (t.price || 0), 0);

        // Discount
        const discountPercent = item.discount?.isEnable ? item.discount.percentage || 0 : 0;
        const discountAmount = ((basePrice + variantTotal + modifierTotal + topupTotal) * discountPercent) / 100;

        // Final Price Per Quantity
        const finalUnitPrice = basePrice + variantTotal + modifierTotal + topupTotal - discountAmount;
        const totalPrice = finalUnitPrice * quantity;

        // Push detailed bill item
        items.push({
          food_item: item.food_item.name,
          quantity,
          base_price: basePrice,
          variant_price: variantTotal,
          modifier_price: modifierTotal,
          topup_price: topupTotal,
          discount_percent: discountPercent,
          unit_price_after_discount: finalUnitPrice,
          total_price: totalPrice,
        });

        total_items += quantity;
        total_sub_total += totalPrice;
      });

      total_vat += order.vat || 0;
      total_amount += order.total_amount || (total_sub_total + total_vat);
    });



    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      items,
      order_id,
      summary: {
        total_items,
        sub_total: +total_sub_total.toFixed(2),
        vat: +total_vat.toFixed(2),
        total_amount: +total_amount.toFixed(2),
        vatPercentage: orders[0].vatPercentage || 0,
      }

    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
const updatePaymentStatus = async (req, res) => {
  try {
    const { table_no, order_id, status, payment_type } = req.body;
    let query = {};
    if(table_no == "Take away order"){
      if(!order_id){
        return res.status(400).json({
          success: false,
          message: "order_id are required",
        });
      }
      query._id = order_id;
    }else{
      if (!table_no) {
        return res.status(400).json({
          success: false,
          message: "table_no are required",
        });
      }
      query.table_no = table_no;
    }
    if(!status) {
      return res.status(400).json({
        success: false,
        message: "status are required",
      });
    }

    const validStatuses = ["pending", "paid", "failed"];
    const validTypes = ["online", "cash", "viva","viva-terminal"];
    if (!validStatuses.includes(status) || !validTypes.includes(payment_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await OrderModel.find(query);
    if (!order || order.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    await OrderModel.updateMany(
      query,
      {
        $set: {
          payment_status: status,
          payment_type: payment_type,
        },
      }
    );
    res.status(200).json({
      success: true,
      message: "Order payment status updated successfully",
      order,
    });
  } catch (err) {
    console.error("updatePaymentStatus error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const vivaPayment = async (req, res) => {
  try {
    const { table_no, order_id } = req.body;
    let query = {};
    if(table_no == "Take away order"){
      if(!order_id){
        return res.status(400).json({
          success: false,
          message: "order_id are required",
        });
      }
      query._id = order_id;
    }else{
      if (!table_no) {
        return res.status(400).json({
          success: false,
          message: "table_no are required",
        });
      }
      query.table_no = table_no;
      query.status = { $in: ["Delivered"] };
    }
    const activeOrder = await OrderModel.find(query);

    if(!activeOrder || activeOrder.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No delivered orders found for this table",
      });
    }
    let totalAmountSum = activeOrder.reduce((sum, order) => {
      return sum + (order.total_amount || 0);
    }, 0);
    const totalAmount = Math.round(totalAmountSum * 100);
    const description = "Restaurant Order";
    const reference = `ORDER-${Date.now()}`;

    const vivaOrder = await createVivaOrder(
      totalAmount,
      description,
      reference
    );

    await OrderModel.updateMany(query,{ $set: { viva_order_code: vivaOrder.orderCode } });

    return res.status(200).json({
      success: true,
      message: "Redirect to Viva Wallet for payment",
      checkoutUrl: vivaOrder.checkoutUrl,
      orderCode: vivaOrder.orderCode,
    });
  } catch (err) {
    console.error("vivaPayment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
const vivaPaymentWebhookGET = async (req, res) => {
  //dev
  // const merchantId = '0f3bc01c-088e-49d4-b816-835a887176be';
  // const apiKey = 'tNs+pK';
  // const resp = await axios.get('https://demo.vivapayments.com/api/messages/config/token', {
  //prod
  const merchantId = 'af54a436-1e4c-440c-8ed6-76b3646b174f';
  const apiKey = '1U7D3K05W2n8jcSi947f14P88rd58T';
  const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');
  const resp = await axios.get('https://vivapayments.com/api/messages/config/token', {
    headers: { 'Authorization': `Basic ${credentials}` }
  });
  let verificationKey = resp.data.Key;
  res.status(200).json({ key: verificationKey });
}
const vivaPaymentWebhookPOST = async (req, res) => {
  console.log("vivaPaymentWebhook received at:", new Date().toISOString());
  console.log("vivaPaymentWebhook headers:", req.headers);
  console.log("vivaPaymentWebhook body:", req.body);
  
  try {
    // Add your webhook processing logic here
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
}
const vivaTerminalPayment = async (req, res) => {
  const { terminal_id, table_no, order_id } = req.body;
  //dev
  // const clientId = "u9a9gb29r757s77o913q0h0m5qa3sbvhu63egkk26qnj6.apps.vivapayments.com";
  // const clientSecret = "O7T4UCChv5m7t4vopD8CH80N8g203R";
  // const baseUrl = 'https://demo-api.vivapayments.com'; // Use live URL in production
  // const credBaseUrl = 'https://demo-accounts.vivapayments.com'; // Use live URL in production
  //prod
  const clientId = "uelnqo7vjxzdwy3g85kznh7as1pwv6mx7bxv6296m91w1.apps.vivapayments.com";
  const clientSecret = "5N892jw3se92za1XcDM8XLvH9sU30N";
  const baseUrl = 'https://api.vivapayments.com'; // Use live URL in production
  const credBaseUrl = 'https://accounts.vivapayments.com'; // Use live URL in production
  
  try {
    let query = {};
    if(table_no == "Take away order"){
      if(!order_id){
        return res.status(400).json({
          success: false,
          message: "order_id are required",
        });
      }
      query._id = order_id;
    }else{
      if (!table_no) {
        return res.status(400).json({
          success: false,
          message: "table_no are required",
        });
      }
      query.table_no = table_no;
      query.status = { $in: ["Delivered"] };
    }
    const activeOrder = await OrderModel.find(query);
const allOrders=await OrderModel.find({});
console.log(allOrders,"::::all orders here")
    if(!activeOrder || activeOrder.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No delivered orders found for this table",
      });
    }
    // let totalAmountSum = activeOrder.reduce((sum, order) => {
    //   return sum + (order.total_amount || 0);
    // }, 0);
    let totalAmountSum = 1;
    const totalAmount = Math.round(totalAmountSum * 100);
    const data = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;

    // Step 1: Get access token
    const tokenResponse = await axios.post(`${credBaseUrl}/connect/token`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    // console.log("Amount (cents):", totalAmount);
    console.log("Terminal ID:", terminal_id);
    console.log("Reference:", `trx_${Date.now()}`);
    console.log("Access Token:", accessToken);
    const randomString = generateRandomString();

    const transactionResponse = await axios.post(
      `${baseUrl}/ecr/v1/transactions:sale`,
      {
        sessionId: randomString,
        terminalId: terminal_id,
        cashRegisterId: terminal_id,
        amount:totalAmount,
        currencyCode: "208",
        merchantReference: "sales",
        preauth: false,
        maxInstalments: 0,                                                                          
        tipAmount: 0,
        showTransactionResult: true,

      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (transactionResponse.status === 200) {
      console.log(":::ressponse is here <<<<", transactionResponse);
      // Ensure transactionResponse.data is logged as a string for visibility
      try {
        console.log("Transaction Response:", JSON.stringify(transactionResponse.data, null, 2));
      } catch (e) {
        console.log("Transaction Response:", transactionResponse.data);
      }
      const actionId = transactionResponse.data.actionId;
      console.log("Transaction started. Action ID:", actionId);
      console.log('Request For Payment Successful to Viva Payments terminal.');
      return res.json({
        message: 'Transaction started successfully!',
        data: transactionResponse.data,
        checkoutUrl: "",
        orderCode: "",
        payment_status: "success"
      });
    } else {
      console.log('Error making payment, status is not 200.');
      console.log(transactionResponse.data);
      return res.status(400).json({
        message: 'Transaction failed',
        error: transactionResponse.data,
        payment_status: "failed"
      });
    }

  } catch (error) {
    console.error(error.response?.data || error.message);
    console.log(JSON.stringify(error));
    
    return res.status(500).json({
      message: 'Transaction failed',
      error: error.response?.data || error.message
    });
  }
};
function generateRandomString(length = 16) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
const getOrderHistory = async (req, res) => {
  try {
    const { user_id } = req.body;

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const orders = await OrderModel.find({
      user: user_id,
    }).populate({
      path: "items.food_item",
      select: "-prices_by_quantity -category -discount -varient -modifier -topup" // removes these from populated food_item
    })
      .select("-payment_type") // removes from the order root
      .sort({ order_date: -1 });

    const formattedOrders = orders.map((order) => {
      const formattedItems = order.items.map((item) => ({
        food_item: item.food_item,
        quantity: item.quantity,
        special_instruction: item.special_instruction || "",
        discount: item.discount?.isEnable
          ? {
              percentage: item.discount.percentage,
              description: item.discount.description,
            }
          : null,
        varient: item.varient?.length
          ? item.varient.map((v) => ({
              varientName: v.varientName,
              price: v.price,
            }))
          : [],
        modifier: item.modifier?.length
          ? item.modifier.map((m) => ({
              modifierName: m.modifierName,
              price: m.price,
            }))
          : [],
        topup: item.topup?.length
          ? item.topup.map((t) => ({
              topupName: t.topupName,
              price: t.price,
            }))
          : [],
      }));
      return {
        ...order.toObject(),
        order_date_from_now: dayjs(order.order_date).fromNow(),
        items: formattedItems,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: formattedOrders,
    });
  } catch (err) {
    console.error("getOrderHistory error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const getTakeawayList = async (req, res) => {
  try {
    const { user_id } = req.body;

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const orders = await OrderModel.find({
      user: user_id,
      status: { $in: ["Delivered"] },
      table_no: 0
    }).populate({
      path: "items.food_item",
      select: "-prices_by_quantity -category -discount -varient -modifier -topup" // removes these from populated food_item
    })
      .select("-payment_type") // removes from the order root
      .sort({ order_date: -1 });
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      order_date_from_now: dayjs(order.order_date).fromNow()
    }));

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: formattedOrders,
    });
  } catch (err) {
    console.error("getOrderHistory error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const salesGraph = async (req, res) => {
  try {
    const { owner_id, graphType, timePeriod } = req.body;
    if (!owner_id || !graphType || !timePeriod) {
      return res.status(400).json({
        success: false,
        message: "owner_id, graphType and timePeriod are required",
      });
    }
    let managers = await ManagerModel.find({assigned_by: owner_id},'user_id');
    if (!managers || managers.length === 0) {
      return res.status(404).json({ success: false, message: "No managers found for this owner" });
    }
    const managerIds = managers.map((m) => m.user_id);
    
    // Prepare date filter
    let matchCondition = {
      manager_id: { $in: managerIds },
      payment_status: "paid"
    };

    if (graphType === "Sales Summary") {
      if (timePeriod === "monthly") {
        matchCondition.order_date = { $gte: moment().subtract(30, "days").toDate() };
      } else if (timePeriod === "yearly") {
        matchCondition.order_date = { $gte: moment().subtract(1, "year").toDate() };
      }
      const dateFormat = timePeriod === "yearly" ? "%Y-%m" : "%Y-%m-%d";
      const data = await OrderModel.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: "$order_date" } },
            total: { $sum: "$total_amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return res.json({ success: true, message: "Sales Summary", data });
    }
    if (graphType === "Sales by Item") {
      const data = await OrderModel.aggregate([
        { $match: matchCondition },
        { $unwind: "$items" },

        // Calculate item-level price sum
        {
          $addFields: {
            "items.varientTotal": {
              $sum: {
                $map: {
                  input: "$items.varient",
                  as: "v",
                  in: { $ifNull: ["$$v.price", 0] },
                },
              },
            },
            "items.modifierTotal": {
              $sum: {
                $map: {
                  input: "$items.modifier",
                  as: "m",
                  in: { $ifNull: ["$$m.price", 0] },
                },
              },
            },
            "items.topupTotal": {
              $sum: {
                $map: {
                  input: "$items.topup",
                  as: "t",
                  in: { $ifNull: ["$$t.price", 0] },
                },
              },
            },
            "items.basePrice": {
              $ifNull: ["$items.base_price", 0],
            },
          },
        },

        // Calculate total before and after discount
        {
          $addFields: {
            "items.totalBeforeDiscount": {
              $multiply: [
                {
                  $add: [
                    "$items.basePrice",
                    "$items.varientTotal",
                    "$items.modifierTotal",
                    "$items.topupTotal",
                  ],
                },
                "$items.quantity",
              ],
            },
            "items.discountAmount": {
              $cond: [
                "$items.discount.isEnable",
                {
                  $multiply: [
                    {
                      $divide: ["$items.discount.percentage", 100],
                    },
                    {
                      $multiply: [
                        {
                          $add: [
                            "$items.basePrice",
                            "$items.varientTotal",
                            "$items.modifierTotal",
                            "$items.topupTotal",
                          ],
                        },
                        "$items.quantity",
                      ],
                    },
                  ],
                },
                0,
              ],
            },
          },
        },

        // Final net item total
        {
          $addFields: {
            "items.finalTotal": {
              $subtract: ["$items.totalBeforeDiscount", "$items.discountAmount"],
            },
          },
        },

        // Group by food_item
        {
          $group: {
            _id: "$items.food_item",
            total_quantity: { $sum: "$items.quantity" },
            total_revenue: { $sum: "$items.finalTotal" },
          },
        },

        // Lookup item name
        {
          $lookup: {
            from: "fooditems",
            localField: "_id",
            foreignField: "_id",
            as: "item",
          },
        },
        { $unwind: "$item" },

        // Final projection
        {
          $project: {
            _id: "$item.name",
            count: "$total_quantity",
            total: { $round: ["$total_revenue", 2] },
          },
        },

        { $sort: { total: -1 } },
      ]);
      return res.json({ success: true, message: "Sales by Item", data });
    }

    if (graphType === "Sales by Category") {
      const data = await OrderModel.aggregate([
        { $match: matchCondition },
        { $unwind: "$items" },

        // Lookup food item to get category
        {
          $lookup: {
            from: "fooditems",
            localField: "items.food_item",
            foreignField: "_id",
            as: "foodItem",
          },
        },
        { $unwind: "$foodItem" },

        // Compute totals including base_price
        {
          $addFields: {
            basePrice: { $ifNull: ["$items.base_price", 0] },
            varientTotal: {
              $sum: {
                $map: {
                  input: "$items.varient",
                  as: "v",
                  in: { $ifNull: ["$$v.price", 0] }
                }
              }
            },
            modifierTotal: {
              $sum: {
                $map: {
                  input: "$items.modifier",
                  as: "m",
                  in: { $ifNull: ["$$m.price", 0] }
                }
              }
            },
            topupTotal: {
              $sum: {
                $map: {
                  input: "$items.topup",
                  as: "t",
                  in: { $ifNull: ["$$t.price", 0] }
                }
              }
            }
          }
        },

        // Total before discount
        {
          $addFields: {
            totalBeforeDiscount: {
              $multiply: [
                {
                  $add: [
                    "$basePrice",
                    "$varientTotal",
                    "$modifierTotal",
                    "$topupTotal"
                  ]
                },
                "$items.quantity"
              ]
            }
          }
        },

        // Discount if any
        {
          $addFields: {
            discountAmount: {
              $cond: [
                "$items.discount.isEnable",
                {
                  $multiply: [
                    {
                      $divide: ["$items.discount.percentage", 100]
                    },
                    {
                      $multiply: [
                        {
                          $add: [
                            "$basePrice",
                            "$varientTotal",
                            "$modifierTotal",
                            "$topupTotal"
                          ]
                        },
                        "$items.quantity"
                      ]
                    }
                  ]
                },
                0
              ]
            }
          }
        },

        // Final amount after discount
        {
          $addFields: {
            finalTotal: {
              $subtract: ["$totalBeforeDiscount", "$discountAmount"]
            }
          }
        },

        // Group by category
        {
          $group: {
            _id: "$foodItem.category",
            count: { $sum: "$items.quantity" },
            total: { $sum: "$finalTotal" }
          }
        },

        // Lookup category name
        {
          $lookup: {
            from: "foodcategories",
            localField: "_id",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },

        {
          $project: {
            _id: "$category.name",
            count: 1,
            total: { $round: ["$total", 2] }
          }
        },

        { $sort: { total: -1 } }
      ]);

      return res.json({ success: true, message: "Sales by Category", data });
    }


    return res.status(400).json({ success: false, message: "Invalid graphType" });

  } catch (err) {
    console.error("salesGraph error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const salesCount = async (req, res) => {
  try {
    const { owner_id } = req.body;
    if (!owner_id) {
      return res.status(400).json({
        success: false,
        message: "owner_id are required",
      });
    }
    
    let managers = await ManagerModel.find({assigned_by: owner_id},'user_id');
    if (!managers || managers.length === 0) {
      return res.status(404).json({ success: false, message: "No managers found for this owner" });
    }
    const managerIds = managers.map((m) => m.user_id);
    const orders = await OrderModel.find({
      manager_id: { $in: managerIds },
      payment_status: "paid",
    }).lean();

    let grossSales = 0;
    let totalDiscount = 0;

    for (const order of orders) {
      grossSales += order.total_amount || 0;
      
      
      for (const item of order.items || []) {
        const quantity = item.quantity || 1;
        const varientTotal = (item.varient || []).reduce((sum, v) => sum + (v.price || 0), 0);
        const modifierTotal = (item.modifier || []).reduce((sum, m) => sum + (m.price || 0), 0);
        const topupTotal = (item.topup || []).reduce((sum, t) => sum + (t.price || 0), 0);
  
        const itemBasePrice = varientTotal + modifierTotal + topupTotal + (item.base_price || 0);
        const itemTotalPrice = itemBasePrice * quantity;

        let discountAmount = 0;
        if (item.discount?.isEnable && item.discount.percentage) {
          discountAmount = (itemTotalPrice * item.discount.percentage) / 100;
        }
        totalDiscount += discountAmount;
      }
    }

    const netSales = grossSales - totalDiscount;
    const grossProfit = netSales; // update this if cost price info is available
    const refunds = 0; // placeholder

    return res.status(200).json({
      success: true,
      message: "Sales summary",
      data: {
        grossSales: grossSales.toFixed(2),
        refunds: refunds.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        netSales: netSales.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
      },
    });

  } catch (err) {
    console.error("salesCount error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const salesCountManager = async (req, res) => {
  try {
    const { manager_id } = req.body;
    if (!manager_id) {
      return res.status(400).json({
        success: false,
        message: "manager_id are required",
      });
    }
    
    const orders = await OrderModel.find({
      manager_id: manager_id,
      payment_status: "paid",
    }).lean();

    let grossSales = 0;
    let totalDiscount = 0;

    for (const order of orders) {
      grossSales += order.total_amount || 0;
      
      
      for (const item of order.items || []) {
        const quantity = item.quantity || 1;
        const varientTotal = (item.varient || []).reduce((sum, v) => sum + (v.price || 0), 0);
        const modifierTotal = (item.modifier || []).reduce((sum, m) => sum + (m.price || 0), 0);
        const topupTotal = (item.topup || []).reduce((sum, t) => sum + (t.price || 0), 0);
  
        const itemBasePrice = varientTotal + modifierTotal + topupTotal + (item.base_price || 0);
        const itemTotalPrice = itemBasePrice * quantity;

        let discountAmount = 0;
        if (item.discount?.isEnable && item.discount.percentage) {
          discountAmount = (itemTotalPrice * item.discount.percentage) / 100;
        }
        totalDiscount += discountAmount;
      }
    }

    const netSales = grossSales - totalDiscount;
    const grossProfit = netSales; // update this if cost price info is available
    let foodies = await FoodItem.find({created_by:manager_id},'name');
    const ids = foodies.map(item => item._id);
    const foodiesNames = foodies.map(item => item.name);
    const foodiesCount = await OrderModel.aggregate([
      {
        $match: {
          "items.food_item": { $in: ids },
          payment_status: "paid",
        }
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.food_item": { $in: ids }
        }
      },
      {
        $group: {
          _id: "$items.food_item",
          total_quantity: { $sum: "$items.quantity" }
        }
      },
      {
        $lookup: {
          from: "fooditems",
          localField: "_id",
          foreignField: "_id",
          as: "foodItem"
        }
      },
      { $unwind: "$foodItem" },
      {
        $project: {
          _id: 0,
          food_id: "$foodItem._id",
          name: "$foodItem.name",
          total_quantity: 1
        }
      },
      { $sort: { total_quantity: -1 } }
    ]);


    return res.status(200).json({
      success: true,
      message: "Sales summary",
      foodies:foodiesNames,
      foodiesCount,
      data: {
        grossSales: grossSales.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        netSales: netSales.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        
      },
    });

  } catch (err) {
    console.error("salesCount error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const kitchenStaffOrderList = async (req, res) => {
  try {
    const { user_id } = req.body;

    const user = await StaffModel.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const orders = await OrderModel.find({
      manager_id: user?.manager_id,
      status:"Prepared"
    }).populate({
      path: "items.food_item",
      select: "-prices_by_quantity -category -discount -varient -modifier -topup" // removes these from populated food_item
    })
      .select("-payment_type") // removes from the order root
      .sort({ order_date: -1 });

    const formattedOrders = orders.map((order) => {
      const formattedItems = order.items.map((item) => ({
        food_item: item.food_item,
        quantity: item.quantity,
        special_instruction: item.special_instruction || "",
        discount: item.discount?.isEnable
          ? {
              percentage: item.discount.percentage,
              description: item.discount.description,
            }
          : null,
        varient: item.varient?.length
          ? item.varient.map((v) => ({
              varientName: v.varientName,
              price: v.price,
            }))
          : [],
        modifier: item.modifier?.length
          ? item.modifier.map((m) => ({
              modifierName: m.modifierName,
              price: m.price,
            }))
          : [],
        topup: item.topup?.length
          ? item.topup.map((t) => ({
              topupName: t.topupName,
              price: t.price,
            }))
          : [],
      }));
      return {
        ...order.toObject(),
        order_date_from_now: dayjs(order.order_date).fromNow(),
        items: formattedItems,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: formattedOrders,
    });
  } catch (err) {
    console.error("kitchenStaffOrderList error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const salesGraphManager = async (req, res) => {
  try {
    const { manager_id, timePeriod } = req.body;
    if (!manager_id || !timePeriod) {
      return res.status(400).json({
        success: false,
        message: "manager_id and timePeriod are required",
      });
    }
    // Prepare date filter
    let matchCondition = {
      manager_id: new ObjectId(manager_id),
      payment_status: "paid"
    };
    if (timePeriod === "monthly") {
      matchCondition.order_date = { $gte: moment().subtract(30, "days").toDate() };
    } else if (timePeriod === "yearly") {
      matchCondition.order_date = { $gte: moment().subtract(1, "year").toDate() };
    }
    const dateFormat = timePeriod === "yearly" ? "%Y-%m" : "%Y-%m-%d";
    const data = await OrderModel.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$order_date" } },
          total: { $sum: "$total_amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.json({ success: true, message: "Sales Summary", data });
  } catch (err) {
    console.error("salesGraph error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  placeOrder,
  getOrderHistory,
  getKitchenOrders,
  updateOrderStatus,
  vivaPayment,
  updatePaymentStatus,
  getTableBill,
  getTakeawayList,
  salesGraph,
  salesGraphManager,
  salesCount,
  salesCountManager,
  kitchenStaffOrderList,
  vivaTerminalPayment,
  vivaPaymentWebhookGET,
  vivaPaymentWebhookPOST
};
