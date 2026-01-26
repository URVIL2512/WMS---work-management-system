import Quotation from '../models/Quotation.model.js';
import Order from '../models/Order.model.js';

// Generate random words (uppercase letters + numbers)
const generateRandomWords = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 3 + Math.floor(Math.random() * 3); // 3-5 characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique IDs for various entities
export const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Generate Sales Order Number in format: SO00001, SO00002, etc.
export const generateSONumber = async () => {
  try {
    // Find all orders with SO numbers matching the pattern SO\d+
    const orders = await Order.find({
      soNumber: { $regex: /^SO\d+$/ }
    }).select('soNumber');

    let maxNumber = 0;

    // Extract all numbers and find the maximum
    orders.forEach(order => {
      if (order.soNumber) {
        const match = order.soNumber.match(/SO(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });

    // If no orders found with the new format, check for old format or count
    if (maxNumber === 0) {
      const allOrders = await Order.find().select('soNumber');
      if (allOrders.length === 0) {
        maxNumber = 0;
      } else {
        // Check if any old format exists
        const hasOldFormat = allOrders.some(order => 
          order.soNumber && !order.soNumber.match(/^SO\d+$/)
        );
        if (hasOldFormat) {
          // Count all orders and use that as base
          maxNumber = allOrders.length;
        } else {
          // All are new format, find max
          allOrders.forEach(order => {
            if (order.soNumber) {
              const match = order.soNumber.match(/SO(\d+)/);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                  maxNumber = num;
                }
              }
            }
          });
        }
      }
    }

    const nextNumber = maxNumber + 1;

    // Format as SO00001, SO00002, etc. (5 digits)
    const soNumber = `SO${String(nextNumber).padStart(5, '0')}`;
    console.log(`📦 [SO NUMBER] Generated: ${soNumber} (max found: ${maxNumber}, total orders: ${orders.length})`);
    return soNumber;
  } catch (error) {
    console.error('Error generating Sales Order number:', error);
    // Fallback to timestamp-based format if database query fails
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SO-${timestamp}-${random}`;
  }
};

export const generateWorkOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WO-${timestamp}-${random}`;
};

export const generateJobCardId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JC-${timestamp}-${random}`;
};

export const generateJobWorkId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JW-${timestamp}-${random}`;
};

// Generate quotation number in format: QT00001/RANDOM
export const generateQuotationNumber = async () => {
  try {
    // Find the last quotation to get the highest sequential number
    const lastQuotation = await Quotation.findOne()
      .sort({ createdAt: -1 })
      .select('quotationNumber');

    let nextNumber = 1;

    if (lastQuotation && lastQuotation.quotationNumber) {
      // Extract number from format QT00001/RANDOM or old format QT-XXX-XXX
      const match = lastQuotation.quotationNumber.match(/QT(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      } else {
        // If old format exists, count all quotations and add 1
        const count = await Quotation.countDocuments();
        nextNumber = count + 1;
      }
    }

    // Format as QT00001, QT00002, etc. (5 digits)
    const sequentialPart = `QT${String(nextNumber).padStart(5, '0')}`;
    
    // Generate random words for the part after /
    const randomPart = generateRandomWords();
    
    return `${sequentialPart}/${randomPart}`;
  } catch (error) {
    console.error('Error generating quotation number:', error);
    // Fallback to timestamp-based format if database query fails
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `QT-${timestamp}-${random}`;
  }
};
