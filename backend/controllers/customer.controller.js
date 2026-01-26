import Customer from '../models/Customer.model.js';

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check for duplicate mobile
    const existingMobile = await Customer.findOne({ mobile: req.body.mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this mobile number already exists'
      });
    }

    // Check for duplicate GST if provided
    if (req.body.gstNumber) {
      const existingGST = await Customer.findOne({ gstNumber: req.body.gstNumber });
      if (existingGST) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this GST number already exists'
        });
      }
    }

    // Auto-fill shipping address if same as billing
    if (req.body.isShippingSameAsBilling) {
      req.body.shippingAddressLine1 = req.body.billingAddressLine1;
      req.body.shippingAddressLine2 = req.body.billingAddressLine2;
      req.body.shippingCity = req.body.billingCity;
      req.body.shippingState = req.body.billingState;
      req.body.shippingCountry = req.body.billingCountry;
      req.body.shippingPincode = req.body.billingPincode;
    }

    const customerData = {
      ...req.body,
      createdBy: userId
    };

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create customer'
    });
  }
};

// Get All Customers
export const getAllCustomers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers'
    });
  }
};

// Get Customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customer'
    });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check for duplicate mobile (excluding current customer)
    if (req.body.mobile && req.body.mobile !== customer.mobile) {
      const existingMobile = await Customer.findOne({ 
        mobile: req.body.mobile,
        _id: { $ne: req.params.id }
      });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this mobile number already exists'
        });
      }
    }

    // Check for duplicate GST (excluding current customer)
    if (req.body.gstNumber && req.body.gstNumber !== customer.gstNumber) {
      const existingGST = await Customer.findOne({ 
        gstNumber: req.body.gstNumber,
        _id: { $ne: req.params.id }
      });
      if (existingGST) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this GST number already exists'
        });
      }
    }

    // Prevent GST number change if invoices exist (business rule)
    // This would require checking Invoice/Order models - implement as needed

    // Auto-fill shipping address if same as billing
    if (req.body.isShippingSameAsBilling) {
      req.body.shippingAddressLine1 = req.body.billingAddressLine1;
      req.body.shippingAddressLine2 = req.body.billingAddressLine2;
      req.body.shippingCity = req.body.billingCity;
      req.body.shippingState = req.body.billingState;
      req.body.shippingCountry = req.body.billingCountry;
      req.body.shippingPincode = req.body.billingPincode;
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer'
    });
  }
};

// Update Customer Status
export const updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Active', 'Inactive', 'Blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer status updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update customer status'
    });
  }
};

// Delete Customer (Admin only)
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has associated orders/invoices
    // This would require checking Order/Invoice models - implement as needed
    // For now, we'll allow deletion but you can add checks later

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete customer'
    });
  }
};

// Get Active Customers (for dropdowns)
export const getActiveCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'Active' })
      .select('customerId customerName mobile email billingCity billingState gstNumber gstType')
      .sort({ customerName: 1 });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active customers'
    });
  }
};
