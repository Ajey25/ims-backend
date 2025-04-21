const CustomerMaster = require("../models/CustomerMaster");
const jwt = require("jsonwebtoken");

exports.getCustomers = async (req, res) => {
  try {
    const customers = await CustomerMaster.findAll();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await CustomerMaster.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCustomer = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.createdBy = decoded.username;

    const { customerName, email, mobile, gst, pan, address, isActive } =
      req.body;

    const newCustomer = await CustomerMaster.create({
      customerName,
      email,
      mobile,
      gst,
      pan,
      address,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: decoded.username,
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.createdBy = decoded.username;

    const { customerName, email, mobile, gst, pan, address, isActive } =
      req.body;

    const customer = await CustomerMaster.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.update({
      customerName,
      email,
      mobile,
      gst,
      pan,
      address,
      isActive,
      createdBy: decoded.username,
    });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await CustomerMaster.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({
      message: `Customer ${customer.isActive ? "activated" : "deactivated"}`,
      customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const rowsDeleted = await CustomerMaster.destroy({
      where: { id: req.params.id },
    });

    if (!rowsDeleted) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
