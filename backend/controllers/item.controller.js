import Item from '../models/Item.model.js';

// Create item
export const createItem = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const itemData = {
      ...req.body,
      createdBy: userId
    };
    
    // Validate itemName
    if (!itemData.itemName || !itemData.itemName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }
    
    // Validate GST percent
    if (itemData.gstPercent < 0 || itemData.gstPercent > 28) {
      return res.status(400).json({
        success: false,
        message: 'GST percent must be between 0 and 28'
      });
    }
    
    // Validate selling price
    if (itemData.sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be negative'
      });
    }
    
    // Auto-disable inventory tracking for Service items
    if (itemData.itemType === 'Service') {
      itemData.trackInventory = false;
    }
    
    const item = new Item(itemData);
    await item.save();
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create item'
    });
  }
};

// Get all items with filters and pagination
export const getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      itemType = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemId: { $regex: search, $options: 'i' } },
        { hsnSacCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.itemCategory = category;
    }
    
    // Type filter
    if (itemType) {
      query.itemType = itemType;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const items = await Item.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();
    
    const total = await Item.countDocuments(query);
    
    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch items'
    });
  }
};

// Get active items only (for dropdowns)
export const getActiveItems = async (req, res) => {
  try {
    const items = await Item.find({ status: 'Active' })
      .select('itemId itemName sellingPrice gstPercent hsnSacCode unitOfMeasure itemType trackInventory')
      .sort({ itemName: 1 })
      .lean();
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active items'
    });
  }
};

// Get item by ID
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch item'
    });
  }
};

// Update item
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Validate GST percent if provided
    if (updateData.gstPercent !== undefined) {
      if (updateData.gstPercent < 0 || updateData.gstPercent > 28) {
        return res.status(400).json({
          success: false,
          message: 'GST percent must be between 0 and 28'
        });
      }
    }
    
    // Validate selling price if provided
    if (updateData.sellingPrice !== undefined && updateData.sellingPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be negative'
      });
    }
    
    // Auto-disable inventory tracking for Service items
    if (updateData.itemType === 'Service') {
      updateData.trackInventory = false;
    }
    
    const item = await Item.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update item'
    });
  }
};

// Update item status (Activate/Deactivate)
export const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Active', 'Inactive', 'Discontinued'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Inactive, or Discontinued'
      });
    }
    
    const item = await Item.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: `Item ${status.toLowerCase()} successfully`,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update item status'
    });
  }
};

// Delete item (soft delete - set status to Discontinued)
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete items'
      });
    }
    
    const item = await Item.findByIdAndUpdate(
      id,
      { status: 'Discontinued' },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete item'
    });
  }
};
