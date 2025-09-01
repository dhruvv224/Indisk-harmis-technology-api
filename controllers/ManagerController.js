const UserAuth = require("../models/authLogin");
const ManagerModel = require("../models/manager");

const getManager = async (req, res) => {
  try {
    const managers = await UserAuth.find({ role: "manager" });
    res.json({ success: true, message: "Managers fetched", data: managers });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: err.message });
  }
};
const managerSaveVat = async (req, res) => {
  try {
    const { vat, manager_id } = req.body;
    if (!vat || !manager_id) {
      return res.status(400).json({
        success: false,
        message: "Manager id and VAT is required",
      });
    }
    const managers = await ManagerModel.findOneAndUpdate({ user_id: manager_id },{ $set: { vat } },{ new: true });
    res.json({ success: true, message: "Vat updated", data: managers });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: err.message });
  }
};
const managerGetVat = async (req, res) => {
  try {
    const { manager_id } = req.body;
    if (!manager_id) {
      return res.status(400).json({
        success: false,
        message: "Manager id is required",
      });
    }
    const managers = await ManagerModel.findOne({ user_id: manager_id });
    res.json({ success: true, message: "Vat fetched", data: managers });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: err.message });
  }
};

const createStaffManager = async (req, res) => {
  try {
    const {
      manager_id,
      owner_id,
      username,
      email,
      password,
      phone,
      status,
      address,
    } = req.body;

    const emailExits = await UserAuth.findOne({ email });
    if (emailExits) {
      return res.json({
        success: false,
        message: "Email already exists",
        error: err.message,
      });
    }

    const phoneExits = await UserAuth.findOne({ phone });
    if (phoneExits) {
      return res.json({
        success: false,
        message: "Phone number already exists",
        error: err.message,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: err.message });
  }
};

module.exports = { getManager, createStaffManager,managerSaveVat,managerGetVat };
