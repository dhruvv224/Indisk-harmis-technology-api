const Terminal = require('../models/Terminal');

// POST: Save terminal ID
const saveTerminalId = async (req, res) => {
  try {
    const { terminal_id } = req.body;
    if (!terminal_id) {
      return res.status(400).json({
        status: false,
        message: 'terminal_id is required'
      });
    }
    let terminal = await Terminal.findOne({ terminal_id });
    if (!terminal) {
      terminal = new Terminal({ terminal_id });
      await terminal.save();
    }
    return res.status(200).json({
      status: true,
      message: 'Terminal ID saved successfully',
      terminal_id
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// GET: Return terminal ID
const getTerminalId = async (req, res) => {
  try {
    const terminal = await Terminal.findOne();
    if (!terminal) {
      return res.status(404).json({
        status: false,
        message: 'No terminal ID found'
      });
    }
    return res.status(200).json({
      status: true,
      terminal_id: terminal.terminal_id
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: 'Server Error',
      error: err.message
    });
  }
};
const Table = require("../models/Table");
const mongoose = require("mongoose");
const Manager = require("../models/manager");
const OrderModel = require("../models/Order");
const StaffData = require("../models/staff");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

module.exports = {
  saveTerminalId,
  getTerminalId
};
