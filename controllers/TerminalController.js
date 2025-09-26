const Terminal = require('../models/Terminal');

// POST: Save terminal ID for a manager (only if it doesn't exist)
const saveTerminalId = async (req, res) => {
  try {
    const { terminal_id, manager_id } = req.body;

    if (!terminal_id || !manager_id) {
      return res.status(400).json({
        status: false,
        message: 'terminal_id and manager_id are required'
      });
    }

    // Update if exists, otherwise insert new
    const terminal = await Terminal.findOneAndUpdate(
      { manager_id }, // filter
      { terminal_id }, // update
      { new: true, upsert: true } // return updated doc, create if not found
    );

    return res.status(200).json({
      status: true,
      message: 'Terminal ID saved/updated successfully',
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


// GET: Return terminal ID for a manager
const getTerminalId = async (req, res) => {
  try {
    const { manager_id } = req.query;
    if (!manager_id) {
      return res.status(400).json({
        status: false,
        message: 'manager_id is required'
      });
    }

    // Fetch terminal for this manager
    const terminal = await Terminal.findOne({ manager_id });
    console.log(terminal, ":::");
    if (!terminal) {
      return res.status(404).json({
        status: false,
        message: 'No terminal ID found for this manager'
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

module.exports = {
  saveTerminalId,
  getTerminalId
};
