import Quotation from '../models/Quotation.model.js';
import Master from '../models/Master.model.js';
import { generateQuotationNumber } from '../utils/generateId.js';
import { logAudit } from '../utils/auditLogger.js';
import { isEmailConfigured, getTransporter } from '../utils/brevoMailer.js';
import { getCompanySettings } from '../utils/settingsCache.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// Status transition validation rules
const ALLOWED_TRANSITIONS = {
  'Draft': ['Sent', 'Rejected'],
  'Sent': ['Approved', 'Request Changes', 'Rejected'],
  'Request Changes': ['Draft', 'Sent'],
  'Approved': ['Converted'],
  'Rejected': ['Draft'], // Optional admin reopen
  'Converted': [], // Locked - no transitions allowed
  'Expired': ['Draft'] // Optional manual reopen
};

/**
 * Validate if a status transition is allowed
 * @param {string} currentStatus - Current status of the quotation
 * @param {string} newStatus - Desired new status
 * @returns {object} - { allowed: boolean, message: string }
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  // Check if current status exists
  if (!ALLOWED_TRANSITIONS[currentStatus]) {
    return {
      allowed: false,
      message: `Invalid current status: ${currentStatus}`
    };
  }

  // Check if transition is allowed
  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      allowed: false,
      message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ') || 'None'}`
    };
  }

  return {
    allowed: true,
    message: 'Transition allowed'
  };
};

// Calculate total amount from multiple processes
const calculateTotal = (processes, gstPercent, packagingCost, transportCost, quantity = 1) => {
  try {
    // Ensure processes is an array
    if (!Array.isArray(processes) || processes.length === 0) {
      console.warn('⚠️ [CALC] No processes provided, using 0');
      return (packagingCost || 0) + (transportCost || 0);
    }
    
    // Sum all process rates
    const baseAmount = processes.reduce((sum, proc) => {
      const rate = proc.rate || 0;
      return sum + (typeof rate === 'number' ? rate : parseFloat(rate) || 0);
    }, 0) * (quantity || 1);
    
    const gst = gstPercent || 0;
    const gstAmount = (baseAmount * gst) / 100;
    const pkgCost = packagingCost || 0;
    const transCost = transportCost || 0;
    
    const total = baseAmount + gstAmount + pkgCost + transCost;
    
    console.log('💰 [CALC] Total calculation:', {
      baseAmount,
      gstPercent: gst,
      gstAmount,
      packagingCost: pkgCost,
      transportCost: transCost,
      total
    });
    
    return total;
  } catch (error) {
    console.error('❌ [CALC] Error calculating total:', error);
    throw error;
  }
};

// Generate PDF for quotation
const generateQuotationPDF = async (quotation) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📄 [PDF] Starting PDF generation for quotation:', quotation.quotationNumber);
      
      // Fetch company settings
      const companySettings = await getCompanySettings();
      
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('📄 [PDF] PDF generation completed, size:', buffer.length, 'bytes');
        resolve(buffer);
      });
      doc.on('error', (error) => {
        console.error('❌ [PDF] PDF generation error:', error);
        reject(error);
      });

      try {
        // Company Header Section
        const startY = 50;
        let currentY = startY;
        
        // Company Name (Bold, Large)
        if (companySettings.companyName) {
          doc.fontSize(18);
          doc.font('Helvetica-Bold');
          doc.text(companySettings.companyName, 50, currentY, { align: 'left' });
          currentY += 20;
        }
        
        // Tagline (if exists)
        if (companySettings.tagline) {
          doc.fontSize(10);
          doc.font('Helvetica');
          doc.text(companySettings.tagline, 50, currentY, { align: 'left' });
          currentY += 15;
        }
        
        // Company Address
        const addressParts = [];
        if (companySettings.addressLine1) addressParts.push(companySettings.addressLine1);
        if (companySettings.addressLine2) addressParts.push(companySettings.addressLine2);
        const cityStateParts = [];
        if (companySettings.city) cityStateParts.push(companySettings.city);
        if (companySettings.state) cityStateParts.push(companySettings.state);
        if (companySettings.pincode) cityStateParts.push(companySettings.pincode);
        if (cityStateParts.length > 0) addressParts.push(cityStateParts.join(', '));
        if (companySettings.country) addressParts.push(companySettings.country);
        
        if (addressParts.length > 0) {
          doc.fontSize(9);
          doc.font('Helvetica');
          addressParts.forEach(part => {
            doc.text(part, 50, currentY, { align: 'left' });
            currentY += 12;
          });
        }
        
        // Contact Information
        const contactInfo = [];
        if (companySettings.phone) contactInfo.push(`Phone: ${companySettings.phone}`);
        if (companySettings.email) contactInfo.push(`Email: ${companySettings.email}`);
        if (companySettings.website) contactInfo.push(`Website: ${companySettings.website}`);
        if (companySettings.gstin) contactInfo.push(`GSTIN: ${companySettings.gstin}`);
        
        if (contactInfo.length > 0) {
          currentY += 5;
          doc.fontSize(9);
          contactInfo.forEach(info => {
            doc.text(info, 50, currentY, { align: 'left' });
            currentY += 12;
          });
        }
        
        // Draw line separator
        currentY += 10;
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 15;
        
        // Title: QUOTATION (Centered)
        doc.fontSize(20);
        doc.font('Helvetica-Bold');
        doc.text('QUOTATION', 50, currentY, { align: 'center', width: 500 });
        currentY += 25;

        // Quotation Details (Right aligned)
        doc.fontSize(10);
        doc.font('Helvetica');
        const quotationDate = quotation.quotationDate ? new Date(quotation.quotationDate) : new Date(quotation.createdAt);
        const formatDate = (date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        };
        
        doc.text(`Quotation Number: ${quotation.quotationNumber || 'N/A'}`, 300, currentY, { align: 'left', width: 250 });
        currentY += 12;
        doc.text(`Date: ${formatDate(quotationDate)}`, 300, currentY, { align: 'left', width: 250 });
        
        // Calculate Valid Till date
        if (quotation.validUntil) {
          currentY += 12;
          const validUntilDate = new Date(quotation.validUntil);
          doc.text(`Valid Till: ${formatDate(validUntilDate)}`, 300, currentY, { align: 'left', width: 250 });
        } else if (companySettings.quotationValidityDays) {
          // Auto-calculate if not set
          const validTillDate = new Date(quotationDate);
          validTillDate.setDate(validTillDate.getDate() + companySettings.quotationValidityDays);
          currentY += 12;
          doc.text(`Valid Till: ${formatDate(validTillDate)}`, 300, currentY, { align: 'left', width: 250 });
        }
        
        currentY += 20;

        // Party Details
        doc.fontSize(14).text('Party Details:', { underline: true });
        doc.fontSize(12);
        doc.text(`Name: ${quotation.partyName || 'N/A'}`);
        if (quotation.email) doc.text(`Email: ${quotation.email}`);
        if (quotation.contactNumber) doc.text(`Contact: ${quotation.contactNumber}`);
        doc.moveDown();

        // Item Description (legacy field)
        if (quotation.itemDescription) {
          doc.fontSize(14).text('Item Description:', { underline: true });
          doc.fontSize(12).text(quotation.itemDescription);
          doc.moveDown();
        }

        // Items Table (if items exist)
        if (quotation.items && quotation.items.length > 0) {
          doc.fontSize(14).text('Items:', { underline: true });
          doc.moveDown(0.5);
          
          let currentY = doc.y;
          doc.font('Helvetica');
          
          quotation.items.forEach((item, index) => {
            // Check if we need a new page
            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }
            
            const itemName = item.itemName || item.itemDescription || 'N/A';
            const qty = item.quantity || 'N/A';
            const unit = item.unit || 'PCS';
            const description = item.description || '';
            
            // Item Name (bold)
            doc.fontSize(11);
            doc.font('Helvetica-Bold');
            doc.text(`${index + 1}. ${itemName}`, 50, currentY);
            currentY += 15;
            
            // Description below Item Name (if exists)
            if (description) {
              doc.fontSize(10);
              doc.font('Helvetica');
              // Wrap description text if it's long
              const descLines = doc.heightOfString(description, { width: 500 });
              doc.text(description, 70, currentY, { width: 500, align: 'left' });
              currentY += Math.max(descLines, 15);
            }
            
            // Qty and Unit on same line
            doc.fontSize(10);
            doc.text(`Qty: ${qty} | Unit: ${unit}`, 70, currentY);
            currentY += 20;
            
            // Add spacing between items
            currentY += 5;
          });
          
          doc.y = currentY;
          doc.moveDown();
        }

        // Process/Item Table with all columns
        if (quotation.processes && quotation.processes.length > 0) {
          currentY = doc.y;
          doc.fontSize(12);
          doc.font('Helvetica-Bold');
          doc.text('Process / Item Details:', 50, currentY);
          currentY += 15;
          
          // Table header
          const tableTop = currentY;
          const colWidths = {
            srNo: 40,
            processName: 120,
            description: 150,
            quantity: 50,
            unit: 40,
            rate: 70,
            amount: 80
          };
          
          doc.fontSize(9);
          doc.font('Helvetica-Bold');
          let xPos = 50;
          doc.text('Sr.', xPos, tableTop);
          xPos += colWidths.srNo;
          doc.text('Process/Item', xPos, tableTop, { width: colWidths.processName });
          xPos += colWidths.processName;
          doc.text('Description', xPos, tableTop, { width: colWidths.description });
          xPos += colWidths.description;
          doc.text('Qty', xPos, tableTop, { width: colWidths.quantity, align: 'right' });
          xPos += colWidths.quantity;
          doc.text('Unit', xPos, tableTop, { width: colWidths.unit });
          xPos += colWidths.unit;
          doc.text('Rate (₹)', xPos, tableTop, { width: colWidths.rate, align: 'right' });
          xPos += colWidths.rate;
          doc.text('Amount (₹)', xPos, tableTop, { width: colWidths.amount, align: 'right' });
          
          // Draw line under header
          currentY = tableTop + 12;
          doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
          currentY += 5;
          
          // Process rows
          doc.font('Helvetica');
          let totalProcessAmount = 0;
          
          quotation.processes.forEach((proc, index) => {
            // Check if we need a new page
            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }
            
            const processName = proc.processName || 'N/A';
            const description = proc.description || '';
            const quantity = proc.quantity || 1;
            const unit = proc.unit || 'PCS';
            const rate = proc.rate || 0;
            const amount = rate * quantity;
            totalProcessAmount += amount;
            
            xPos = 50;
            doc.fontSize(9);
            
            // Sr No
            doc.text(String(index + 1), xPos, currentY, { width: colWidths.srNo, align: 'center' });
            xPos += colWidths.srNo;
            
            // Process Name
            doc.text(processName, xPos, currentY, { width: colWidths.processName });
            xPos += colWidths.processName;
            
            // Description (wrap if long)
            if (description) {
              const descHeight = doc.heightOfString(description, { width: colWidths.description });
              doc.text(description, xPos, currentY, { width: colWidths.description });
              currentY += Math.max(descHeight, 12);
            } else {
              doc.text('-', xPos, currentY, { width: colWidths.description });
              xPos += colWidths.description;
              currentY += 12;
            }
            
            // Reset xPos for next row
            xPos = 50 + colWidths.srNo + colWidths.processName + colWidths.description;
            
            // Quantity
            doc.text(String(quantity), xPos, currentY, { width: colWidths.quantity, align: 'right' });
            xPos += colWidths.quantity;
            
            // Unit
            doc.text(unit, xPos, currentY, { width: colWidths.unit });
            xPos += colWidths.unit;
            
            // Rate
            doc.text(rate.toLocaleString('en-IN'), xPos, currentY, { width: colWidths.rate, align: 'right' });
            xPos += colWidths.rate;
            
            // Amount
            doc.text(amount.toLocaleString('en-IN'), xPos, currentY, { width: colWidths.amount, align: 'right' });
            
            currentY += 15;
          });
          
          // Draw line after table
          doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
          currentY += 10;
          
          // Subtotal
          doc.fontSize(10);
          doc.font('Helvetica-Bold');
          doc.text(`Subtotal: ₹${totalProcessAmount.toLocaleString('en-IN')}`, 400, currentY, { align: 'right', width: 150 });
          currentY += 15;
          
        } else if (quotation.process && quotation.rate) {
          // Legacy single process format
          currentY = doc.y;
          doc.fontSize(12);
          doc.font('Helvetica-Bold');
          doc.text('Process Details:', 50, currentY);
          currentY += 15;
          
          const rate = quotation.rate || 0;
          const quantity = quotation.quantity || 1;
          const amount = rate * quantity;
          
          doc.fontSize(10);
          doc.font('Helvetica');
          doc.text(`Process: ${quotation.process}`, 50, currentY);
          currentY += 12;
          doc.text(`Quantity: ${quantity}`, 50, currentY);
          currentY += 12;
          doc.text(`Rate: ₹${rate.toLocaleString('en-IN')}`, 50, currentY);
          currentY += 12;
          doc.font('Helvetica-Bold');
          doc.text(`Amount: ₹${amount.toLocaleString('en-IN')}`, 50, currentY);
          currentY += 20;
        }
        
        doc.y = currentY;
        doc.moveDown();

        // Cost Breakdown
        currentY = doc.y;
        doc.fontSize(12);
        doc.font('Helvetica-Bold');
        doc.text('Cost Summary:', 50, currentY);
        currentY += 15;
        
        doc.fontSize(10);
        doc.font('Helvetica');
        
        // Calculate amounts
        const baseAmount = quotation.processes?.reduce((sum, p) => {
          const qty = p.quantity || 1;
          return sum + ((p.rate || 0) * qty);
        }, 0) || (quotation.rate || 0) * (quotation.quantity || 1);
        
        doc.text(`Subtotal: ₹${baseAmount.toLocaleString('en-IN')}`, 400, currentY, { align: 'right', width: 150 });
        currentY += 12;
        
        if (quotation.gstPercent && quotation.gstPercent > 0) {
          const gstAmount = (baseAmount * quotation.gstPercent) / 100;
          doc.text(`GST (${quotation.gstPercent}%): ₹${gstAmount.toLocaleString('en-IN')}`, 400, currentY, { align: 'right', width: 150 });
          currentY += 12;
        }
        
        if (quotation.packagingCost && quotation.packagingCost > 0) {
          doc.text(`Packaging Cost: ₹${quotation.packagingCost.toLocaleString('en-IN')}`, 400, currentY, { align: 'right', width: 150 });
          currentY += 12;
        }
        
        if (quotation.transportCost && quotation.transportCost > 0) {
          doc.text(`Transport Cost: ₹${quotation.transportCost.toLocaleString('en-IN')}`, 400, currentY, { align: 'right', width: 150 });
          currentY += 12;
        }
        
        // Total Amount
        currentY += 5;
        doc.moveTo(400, currentY).lineTo(550, currentY).stroke();
        currentY += 10;
        doc.fontSize(12);
        doc.font('Helvetica-Bold');
        doc.text(`Total Amount: ₹${(quotation.totalAmount || 0).toLocaleString('en-IN')}`, 400, currentY, { align: 'right', width: 150 });
        currentY += 25;

        // Payment Terms & Delivery Date
        if (quotation.paymentTerms) {
          doc.fontSize(10);
          doc.font('Helvetica');
          doc.text(`Payment Terms: ${quotation.paymentTerms}`, 50, currentY);
          currentY += 12;
        }
        
        if (quotation.deliveryDate) {
          const deliveryDate = new Date(quotation.deliveryDate);
          doc.text(`Delivery Date: ${formatDate(deliveryDate)}`, 50, currentY);
          currentY += 12;
        }
        
        // Footer Section
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 120;
        
        // Draw line before footer
        doc.moveTo(50, footerY).lineTo(550, footerY).stroke();
        currentY = footerY + 10;
        
        // Bank Details (if available)
        if (companySettings.bankName || companySettings.accountNumber || companySettings.ifsc) {
          doc.fontSize(9);
          doc.font('Helvetica-Bold');
          doc.text('Bank Details:', 50, currentY);
          currentY += 12;
          
          doc.font('Helvetica');
          const bankDetails = [];
          if (companySettings.bankName) bankDetails.push(`Bank: ${companySettings.bankName}`);
          if (companySettings.accountNumber) bankDetails.push(`A/c No: ${companySettings.accountNumber}`);
          if (companySettings.ifsc) bankDetails.push(`IFSC: ${companySettings.ifsc}`);
          if (companySettings.branch) bankDetails.push(`Branch: ${companySettings.branch}`);
          
          bankDetails.forEach(detail => {
            doc.text(detail, 50, currentY);
            currentY += 10;
          });
          
          currentY += 5;
        }
        
        // Footer Note
        if (companySettings.footerNote) {
          doc.fontSize(8);
          doc.font('Helvetica');
          doc.text(companySettings.footerNote, 50, currentY, { width: 500, align: 'center' });
          currentY += 15;
        }
        
        // Authorized Signatory
        doc.fontSize(9);
        doc.font('Helvetica');
        doc.text('Authorized Signatory', 450, currentY, { align: 'right', width: 100 });

        doc.end();
      } catch (contentError) {
        console.error('❌ [PDF] Error adding content to PDF:', contentError);
        doc.end();
        reject(contentError);
      }
    } catch (error) {
      console.error('❌ [PDF] Error creating PDF document:', error);
      reject(error);
    }
  });
};

// Sync processes with master data - add new processes to master
const syncProcessesWithMaster = async (processes, userId) => {
  const processNames = processes.map(p => p.processName?.trim()).filter(Boolean);
  
  for (const processName of processNames) {
    // Check if process exists in master
    const existingProcess = await Master.findOne({
      type: 'Process',
      name: { $regex: new RegExp(`^${processName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    // If not exists, add to master
    if (!existingProcess) {
      try {
        await Master.create({
          type: 'Process',
          name: processName,
          isActive: true
        });
        await logAudit(userId, 'Create', 'Master-Process', null, { name: processName });
      } catch (error) {
        // Ignore duplicate errors (race condition)
        if (error.code !== 11000) {
          console.error('Error syncing process to master:', error);
        }
      }
    }
  }
};

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private
export const createQuotation = async (req, res, next) => {
  try {
    const {
      partyName,
      quotationNumber,
      email,
      contactNumber,
      itemDescription,
      items,
      processes,
      process,
      rate,
      gstPercent = 0,
      packagingCost = 0,
      transportCost = 0,
      paymentTerms,
      deliveryDate,
      validUntil,
      billingAddress,
      deliveryAddress,
      quantity = 1,
      quotationDate: quotationDateInput
    } = req.body;

    // Validation: Required fields
    if (!partyName || !partyName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Party Name is required'
      });
    }

    if (!contactNumber || !contactNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Contact Number is required'
      });
    }

    // Auto-calculate validUntil if not provided
    let finalValidUntil = validUntil;
    if (!finalValidUntil) {
      const companySettings = await getCompanySettings();
      const validityDays = companySettings.quotationValidityDays || 30;
      const quotationDate = quotationDateInput ? new Date(quotationDateInput) : new Date();
      finalValidUntil = new Date(quotationDate);
      finalValidUntil.setDate(finalValidUntil.getDate() + validityDays);
    }

    // Check if finalValidUntil is in the past
    if (new Date(finalValidUntil) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Valid Till date cannot be in the past'
      });
    }

    // Clean up item processes - remove empty processId to prevent ObjectId cast error
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        if (item.processes && Array.isArray(item.processes)) {
          item.processes.forEach(process => {
            if (process.processId === '' || process.processId === null || process.processId === undefined) {
              delete process.processId;
            }
          });
        }
      });
    }

    // Normalize processes - support both new array format and legacy single process
    let normalizedProcesses = [];
    if (processes && Array.isArray(processes) && processes.length > 0) {
      normalizedProcesses = processes
        .filter(p => p.processName && p.processName.trim() && p.rate !== undefined && p.rate !== null)
        .map(p => ({
          processName: p.processName.trim(),
          rate: parseFloat(p.rate),
          quantity: p.quantity ? parseFloat(p.quantity) : 1
        }));
    } else if (process && rate !== undefined && rate !== null) {
      normalizedProcesses = [{
        processName: process.trim(),
        rate: parseFloat(rate),
        quantity: quantity || 1
      }];
    }

    if (normalizedProcesses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one process with rate is required'
      });
    }

    // Validate all rates > 0
    const invalidRate = normalizedProcesses.find(p => p.rate <= 0);
    if (invalidRate) {
      return res.status(400).json({
        success: false,
        message: 'All process rates must be greater than 0'
      });
    }

    // Sync new processes with master data
    await syncProcessesWithMaster(normalizedProcesses, req.user._id);

    // Generate quotation number if not provided
    let quotationNo = quotationNumber;
    if (!quotationNo) {
      quotationNo = await generateQuotationNumber();
    }

    // Check for duplicates (case-insensitive)
    const existingQuotation = await Quotation.findOne({
      $or: [
        { quotationNumber: { $regex: new RegExp(`^${quotationNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (existingQuotation) {
      return res.status(400).json({
        success: false,
        message: `Duplicate entry! A quotation with number "${existingQuotation.quotationNumber}" already exists (created on ${new Date(existingQuotation.createdAt).toLocaleDateString()}).`
      });
    }

    // Calculate total amount
    const totalAmount = calculateTotal(normalizedProcesses, gstPercent, packagingCost || 0, transportCost || 0, quantity);

    // Determine status - allow manual status setting or default to Draft
    let status = 'Draft';
    if (req.body.status && ['Draft', 'Sent', 'Approved', 'Rejected', 'Request Changes', 'Changes Required'].includes(req.body.status)) {
      status = req.body.status;
      console.log('📝 [CREATE] Setting status to:', status);
    }

    // Create quotation with processes array
    const quotation = await Quotation.create({
      quotationNumber: quotationNo,
      partyName,
      email,
      contactNumber,
      itemDescription,
      items: items || [],
      processes: normalizedProcesses,
      // Keep legacy fields for backward compatibility
      process: normalizedProcesses.length === 1 ? normalizedProcesses[0].processName : null,
      rate: normalizedProcesses.length === 1 ? normalizedProcesses[0].rate : null,
      gstPercent,
      packagingCost,
      transportCost,
      paymentTerms,
      deliveryDate,
      validUntil: finalValidUntil ? new Date(finalValidUntil) : new Date(),
      billingAddress,
      deliveryAddress,
      totalAmount,
      createdBy: req.user._id,
      status
    });

    // Log audit with details
    await logAudit(req.user._id, 'Create', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      partyName: quotation.partyName
    });

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    // Handle duplicate key error (if quotationNumber somehow duplicates)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate entry! A quotation with this ${field} already exists.`
      });
    }
    next(error);
  }
};

// @desc    Get next quotation number (for preview)
// @route   GET /api/quotations/next-number
// @access  Private
export const getNextQuotationNumber = async (req, res, next) => {
  try {
    const quotationNumber = await generateQuotationNumber();
    res.status(200).json({
      success: true,
      data: { quotationNumber }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res, next) => {
  try {
    const { status, approvedOnly, startDate, endDate, search } = req.query;
    let filter = {};
    
    // Valid status enum values (must match model exactly)
    const validStatuses = ['Draft', 'Sent', 'Approved', 'Rejected', 'Request Changes', 'Changes Required', 'Converted'];
    
    // Status filter - MUST be applied first with EXACT match
    if (status && status !== 'all' && validStatuses.includes(status)) {
      filter.status = status; // Exact match, no regex, no case-insensitive
    } else if (approvedOnly === 'true') {
      // Return only Approved quotations (not Converted)
      filter.status = 'Approved';
      // Filter out expired quotations only if validUntil exists and is in the past
      // Include quotations without validUntil or with valid expiry dates
      filter.$and = [
        {
          $or: [
            { validUntil: { $exists: false } }, // No expiry date set
            { validUntil: null }, // Null expiry date
            { validUntil: { $gte: new Date() } } // Valid expiry date (not expired)
          ]
        }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Set to end of day for inclusive end date
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
    }

    // Search filter (by quotation number or party name)
    // IMPORTANT: Combine search with status filter using $and
    if (search && search.trim()) {
      const searchCondition = {
        $or: [
          { quotationNumber: { $regex: search.trim(), $options: 'i' } },
          { partyName: { $regex: search.trim(), $options: 'i' } }
        ]
      };

      // If we already have $and (from approvedOnly), add search to it
      if (filter.$and) {
        filter.$and.push(searchCondition);
      } else if (filter.status) {
        // If we have status filter, combine with $and to ensure BOTH conditions
        const statusFilter = { status: filter.status };
        delete filter.status;
        filter.$and = [statusFilter, searchCondition];
      } else {
        // No status filter, just use $or for search
        filter.$or = searchCondition.$or;
      }
    }
    // If only status filter (no search), filter.status is already set correctly above

    // Validate filter before querying
    if (status && status !== 'all' && !validStatuses.includes(status)) {
      console.warn('⚠️ [QUOTATIONS] Invalid status value:', status, 'Valid values:', validStatuses);
      return res.status(400).json({
        success: false,
        message: `Invalid status value: ${status}. Valid values are: ${validStatuses.join(', ')}`
      });
    }

    console.log('🔍 [QUOTATIONS] Filter:', JSON.stringify(filter, null, 2));
    console.log('🔍 [QUOTATIONS] Query params - status:', status, 'approvedOnly:', approvedOnly, 'search:', search);
    console.log('🔍 [QUOTATIONS] Filter status value:', filter.status, 'Filter $and:', filter.$and);
    
    const quotations = await Quotation.find(filter)
      .populate('createdBy', 'name email')
      .sort({ quotationDate: -1, createdAt: -1 }); // Sort by quotationDate DESC (newest first), fallback to createdAt
    
    console.log('✅ [QUOTATIONS] Found', quotations.length, 'quotations');
    
    // Verify filter worked correctly
    if (status && status !== 'all') {
      const mismatchedStatuses = quotations.filter(q => q.status !== status);
      if (mismatchedStatuses.length > 0) {
        console.error('❌ [QUOTATIONS] FILTER MISMATCH! Expected status:', status);
        console.error('❌ [QUOTATIONS] Found quotations with wrong statuses:');
        mismatchedStatuses.forEach(q => {
          console.error(`  - ${q.quotationNumber} (${q.partyName}) - Status: "${q.status}" (Expected: "${status}")`);
        });
      }
      
      console.log('📊 [QUOTATIONS] Status breakdown:');
      const statusCounts = {};
      quotations.forEach(q => {
        statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
        console.log(`  - ${q.quotationNumber} (${q.partyName}) - Status: "${q.status}"`);
      });
      console.log('📊 [QUOTATIONS] Status counts:', statusCounts);
    }

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
export const getQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
export const updateQuotation = async (req, res, next) => {
  console.log('📝 [UPDATE] updateQuotation called');
  console.log('📝 [UPDATE] Request params:', req.params);
  console.log('📝 [UPDATE] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      console.error('❌ [UPDATE] Quotation not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    console.log('📝 [UPDATE] Quotation found:', quotation.quotationNumber);

    const {
      items,
      processes,
      process,
      rate,
      gstPercent,
      packagingCost,
      transportCost,
      quantity = 1
    } = req.body;

    // Clean up item processes - remove empty processId to prevent ObjectId cast error
    if (items && Array.isArray(items)) {
      items.forEach(item => {
        if (item.processes && Array.isArray(item.processes)) {
          item.processes.forEach(process => {
            if (process.processId === '' || process.processId === null || process.processId === undefined) {
              delete process.processId;
            }
          });
        }
      });
    }

    // Normalize processes - support both new array format and legacy single process
    let normalizedProcesses = [];
    if (processes && Array.isArray(processes) && processes.length > 0) {
      normalizedProcesses = processes
        .filter(p => p.processName && p.processName.trim() && p.rate !== undefined && p.rate !== null)
        .map(p => ({
          processName: p.processName.trim(),
          rate: parseFloat(p.rate)
        }));
    } else if (process && rate !== undefined && rate !== null) {
      normalizedProcesses = [{
        processName: process.trim(),
        rate: parseFloat(rate)
      }];
    } else {
      // Keep existing processes if not provided
      normalizedProcesses = quotation.processes && quotation.processes.length > 0
        ? quotation.processes
        : (quotation.process && quotation.rate ? [{ processName: quotation.process, rate: quotation.rate }] : []);
    }

    if (normalizedProcesses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one process with rate is required'
      });
    }

    // Sync new processes with master data
    await syncProcessesWithMaster(normalizedProcesses, req.user._id);

    // Calculate total amount from all processes
    const finalGstPercent = gstPercent !== undefined ? gstPercent : quotation.gstPercent || 0;
    const finalPackagingCost = packagingCost !== undefined ? (packagingCost || 0) : (quotation.packagingCost || 0);
    const finalTransportCost = transportCost !== undefined ? (transportCost || 0) : (quotation.transportCost || 0);
    
    console.log('📝 [UPDATE] Calculating total:', {
      processes: normalizedProcesses.length,
      gstPercent: finalGstPercent,
      packagingCost: finalPackagingCost,
      transportCost: finalTransportCost,
        quantity
    });
    
    const totalAmount = calculateTotal(normalizedProcesses, finalGstPercent, finalPackagingCost, finalTransportCost, quantity);
    console.log('📝 [UPDATE] Calculated total amount:', totalAmount);

    // Prepare update data
    const updateData = {
      ...req.body,
      processes: normalizedProcesses,
      // Keep legacy fields for backward compatibility
      process: normalizedProcesses.length === 1 ? normalizedProcesses[0].processName : null,
      rate: normalizedProcesses.length === 1 ? normalizedProcesses[0].rate : null,
      totalAmount
    };

    // Status flow control - only allow valid transitions
    if (req.body.status) {
      const currentStatus = quotation.status;
      const newStatus = req.body.status;
      
      // Define valid status transitions
      const validTransitions = {
        'Draft': ['Sent'],
        'Sent': ['Approved', 'Rejected', 'Request Changes'],
        'Request Changes': ['Draft', 'Sent'],
        'Approved': ['Converted'], // Only converted via order creation
        'Rejected': [],
        'Converted': []
      };

      // Check if transition is valid
      if (validTransitions[currentStatus] && validTransitions[currentStatus].includes(newStatus)) {
        updateData.status = newStatus;
        console.log('📝 [UPDATE] Status transition:', currentStatus, '→', newStatus);
      } else if (newStatus === currentStatus) {
        // Allow keeping same status
        updateData.status = newStatus;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition. Cannot change from "${currentStatus}" to "${newStatus}". Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'None'}`
        });
      }
    }

    // Lock editing if status is Approved or Converted
    if (quotation.status === 'Approved' || quotation.status === 'Converted') {
      // Only allow updating delivery/logistics fields, not pricing
      const allowedFields = ['deliveryDate', 'deliveryAddress', 'remarks', 'expectedDispatchDate'];
      const updateKeys = Object.keys(req.body);
      const restrictedFields = updateKeys.filter(key => !allowedFields.includes(key) && 
        ['processes', 'gstPercent', 'packagingCost', 'transportCost', 'totalAmount', 'rate', 'process'].includes(key));
      
      if (restrictedFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Cannot edit pricing fields for ${quotation.status} quotation. Only delivery/logistics fields can be updated.`
        });
      }
    }

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    // Log audit with details
    await logAudit(req.user._id, 'Update', 'Quotation', updatedQuotation._id, {
      quotationNumber: updatedQuotation.quotationNumber,
      partyName: updatedQuotation.partyName
    });

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: updatedQuotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send quotation email with PDF
// @route   POST /api/quotations/:id/send-email
// @access  Private
export const sendQuotationEmail = async (req, res, next) => {
  console.log('📧 [EMAIL] sendQuotationEmail called');
  console.log('📧 [EMAIL] Request params:', req.params);
  console.log('📧 [EMAIL] User ID:', req.user?._id);

  try {
    const quotationId = req.params.id;
    console.log('📧 [EMAIL] Fetching quotation:', quotationId);

    const quotation = await Quotation.findById(quotationId)
      .populate('createdBy', 'name email');

    if (!quotation) {
      console.error('❌ [EMAIL] Quotation not found:', quotationId);
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    console.log('📧 [EMAIL] Quotation found:', quotation.quotationNumber);
    console.log('📧 [EMAIL] Quotation email:', quotation.email);

    if (!quotation.email) {
      console.error('❌ [EMAIL] No email address in quotation');
      return res.status(400).json({
        success: false,
        message: 'Quotation does not have an email address'
      });
    }

    // Check email configuration
    console.log('📧 [EMAIL] Checking email configuration...');
    console.log('📧 [EMAIL] BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? 'SET' : 'NOT SET');
    console.log('📧 [EMAIL] BREVO_SMTP_PASS:', process.env.BREVO_SMTP_PASS ? 'SET' : 'NOT SET');
    console.log('📧 [EMAIL] BREVO_SMTP_HOST:', process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com');
    console.log('📧 [EMAIL] BREVO_SMTP_PORT:', process.env.BREVO_SMTP_PORT || '587');
    console.log('📧 [EMAIL] isEmailConfigured():', isEmailConfigured());
    
    // Get transporter (will recreate if needed)
    const transporter = getTransporter();
    console.log('📧 [EMAIL] transporter exists:', !!transporter);

    if (!isEmailConfigured() || !transporter) {
      console.error('❌ [EMAIL] Email not configured properly');
      // Fallback: just update status if email not configured
      quotation.status = 'Sent';
      await quotation.save();

      return res.status(200).json({
        success: true,
        message: 'Quotation status updated to Sent (email not configured)',
        data: quotation
      });
    }

    // Generate PDF
    console.log('📧 [EMAIL] Generating PDF...');
    let pdfBuffer;
    try {
      pdfBuffer = await generateQuotationPDF(quotation.toObject ? quotation.toObject() : quotation);
      console.log('📧 [EMAIL] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError) {
      console.error('❌ [EMAIL] PDF generation failed:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF: ' + pdfError.message
      });
    }

    // Prepare email
    const mailOptions = {
      from: process.env.BREVO_SMTP_USER,
      to: quotation.email,
      subject: `Quotation ${quotation.quotationNumber} - ${quotation.partyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Quotation Details</h2>
          <p>Dear ${quotation.partyName},</p>
          <p>Please find attached the quotation ${quotation.quotationNumber}.</p>
          <p><strong>Total Amount:</strong> ₹${quotation.totalAmount.toLocaleString()}</p>
          <p>Thank you for your business!</p>
          <br>
          <p>Best regards,<br>${quotation.createdBy?.name || 'WMS Team'}</p>
        </div>
      `,
      attachments: [
        {
          filename: `Quotation_${quotation.quotationNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    };

    console.log('📧 [EMAIL] Sending email...');
    console.log('📧 [EMAIL] From:', mailOptions.from);
    console.log('📧 [EMAIL] To:', mailOptions.to);
    console.log('📧 [EMAIL] Subject:', mailOptions.subject);

    // Send email with PDF attachment
    try {
      console.log('📧 [EMAIL] Attempting to send email via transporter...');
      
      // Wrap sendMail in Promise with timeout to prevent hanging
      const sendEmailPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000);
      });
      
      const info = await Promise.race([sendEmailPromise, timeoutPromise]);
      
      console.log('✅ [EMAIL] Email sent successfully!');
      console.log('📧 [EMAIL] Message ID:', info.messageId);
      console.log('📧 [EMAIL] Response:', info.response);

      // Update status to 'Sent' (if not already Sent)
      if (quotation.status !== 'Sent') {
        quotation.status = 'Sent';
        await quotation.save();
      }

      await logAudit(req.user._id, 'Update', 'Quotation', quotation._id, {
        action: 'Email sent',
        quotationNumber: quotation.quotationNumber
      });

      // Ensure response is sent
      if (!res.headersSent) {
        return res.status(200).json({
          success: true,
          message: 'Quotation email sent successfully',
          data: quotation
        });
      }
    } catch (emailError) {
      console.error('❌ [EMAIL] Failed to send email:', emailError);
      console.error('❌ [EMAIL] Error name:', emailError.name);
      console.error('❌ [EMAIL] Error code:', emailError.code);
      console.error('❌ [EMAIL] Error command:', emailError.command);
      console.error('❌ [EMAIL] Error response:', emailError.response);
      console.error('❌ [EMAIL] Error responseCode:', emailError.responseCode);
      console.error('❌ [EMAIL] Full error:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
      
      // Check if response already sent
      if (res.headersSent) {
        console.error('❌ [EMAIL] Response already sent, cannot send error response');
        return;
      }
      
      // Determine error message based on error type
      let errorMessage = 'Failed to send email';
      let statusCode = 500;
      
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please check SMTP credentials.';
        statusCode = 401;
      } else if (emailError.code === 'ETIMEDOUT' || emailError.code === 'ECONNECTION') {
        errorMessage = 'Email server connection failed. Please check network and SMTP settings.';
        statusCode = 503;
      } else if (emailError.responseCode === 535) {
        errorMessage = 'SMTP authentication failed. Invalid username or password.';
        statusCode = 401;
      } else if (emailError.message) {
        errorMessage = `Failed to send email: ${emailError.message}`;
      }
      
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? {
          message: emailError.message,
          name: emailError.name,
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
          responseCode: emailError.responseCode
        } : undefined
      });
    }
  } catch (error) {
    console.error('❌ [EMAIL] Unexpected error in sendQuotationEmail:', error);
    console.error('❌ [EMAIL] Error name:', error.name);
    console.error('❌ [EMAIL] Error message:', error.message);
    console.error('❌ [EMAIL] Error stack:', error.stack);
    
    // Check if response already sent
    if (res.headersSent) {
      console.error('❌ [EMAIL] Response already sent, cannot send error response');
      return;
    }
    
    // Return error response - DO NOT use next() to prevent server crash
    return res.status(500).json({
      success: false,
      message: 'Failed to process email request: ' + (error.message || 'Unknown error'),
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
};

// @desc    Approve quotation
// @route   PUT /api/quotations/:id/approve
// @access  Private
export const approveQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(quotation.status, 'Approved');
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    quotation.status = 'Approved';
    await quotation.save();

    await logAudit(req.user._id, 'Update', 'Quotation', quotation._id, {
      action: 'Approved',
      quotationNumber: quotation.quotationNumber
    });

    res.status(200).json({
      success: true,
      message: 'Quotation approved successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject quotation
// @route   PUT /api/quotations/:id/reject
// @access  Private
export const rejectQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status !== 'Sent' && quotation.status !== 'Request Changes') {
      return res.status(400).json({
        success: false,
        message: 'Quotation can only be rejected if status is "Sent" or "Request Changes"'
      });
    }

    quotation.status = 'Rejected';
    await quotation.save();

    await logAudit(req.user._id, 'Update', 'Quotation', quotation._id, {
      action: 'Rejected',
      quotationNumber: quotation.quotationNumber
    });

    res.status(200).json({
      success: true,
      message: 'Quotation rejected successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request changes for quotation
// @route   PUT /api/quotations/:id/request-changes
// @access  Private
export const requestChangesQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Validate status transition
    const validation = validateStatusTransition(quotation.status, 'Request Changes');
    if (!validation.allowed) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    quotation.status = 'Request Changes';
    await quotation.save();

    await logAudit(req.user._id, 'Update', 'Quotation', quotation._id, {
      action: 'Request Changes',
      quotationNumber: quotation.quotationNumber
    });

    res.status(200).json({
      success: true,
      message: 'Changes requested for quotation successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quotation status (generic status change endpoint)
// @route   PATCH /api/quotations/:id/status
// @access  Private
export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const quotation = await Quotation.findById(req.params.id).populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const currentStatus = quotation.status || 'Draft';

    // Define valid status transitions
    const validTransitions = {
      'Draft': ['Sent'],
      'Sent': ['Approved', 'Rejected', 'Changes Required'],
      'Changes Required': ['Draft', 'Sent'],
      'Approved': ['Converted'],
      'Rejected': [],
      'Converted': []
    };

    // Normalize status values (handle "Changes Required" vs "Request Changes")
    const normalizedNewStatus = newStatus === 'Request Changes' ? 'Changes Required' : newStatus;

    // Check if transition is valid
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(normalizedNewStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${currentStatus}" to "${normalizedNewStatus}". Allowed transitions: ${allowedTransitions.join(', ') || 'None'}`
      });
    }

    // Update status
    quotation.status = normalizedNewStatus;
    await quotation.save();

    // Log audit
    await logAudit(req.user._id, 'Update', 'Quotation', quotation._id, {
      action: `Status changed to ${normalizedNewStatus}`,
      quotationNumber: quotation.quotationNumber,
      previousStatus: currentStatus,
      newStatus: normalizedNewStatus
    });

    res.status(200).json({
      success: true,
      message: `Quotation status updated to ${normalizedNewStatus}`,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    await logAudit(req.user._id, 'Delete', 'Quotation', quotation._id, {
      quotationNumber: quotation.quotationNumber,
      partyName: quotation.partyName
    });

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
