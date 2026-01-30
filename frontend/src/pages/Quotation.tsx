// import React, { useState, useEffect, useRef } from 'react';
// import { createPortal } from 'react-dom';
// import { Plus, Eye, X, Trash2, MoreVertical, Edit, Send, CheckCircle, XCircle, RefreshCw, FileText, AlertCircle, Download, Filter, RotateCcw } from 'lucide-react';
// import api from '../api/axios';
// import ConfirmationModal from '../components/ConfirmationModal';
// import QuotationForm from '../components/QuotationForm';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';

// interface QuotationItem {
//   _id: string;
//   quotationNumber: string;
//   partyName: string;
//   totalAmount: number;
//   receivableAmount?: number;
//   createdAt: string;
//   createdBy: {
//     name: string;
//     email: string;
//   };
//   status?: string;
// }

// export default function Quotation() {
//   const [showModal, setShowModal] = useState(false);
//   const [quotations, setQuotations] = useState<QuotationItem[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
//   const [deleting, setDeleting] = useState(false);
//   const [openMenuId, setOpenMenuId] = useState<string | null>(null);
//   const [quotationToEdit, setQuotationToEdit] = useState<any>(null);
//   const [showViewDetails, setShowViewDetails] = useState(false);
//   const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<any>(null);
//   const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
//   const menuRef = useRef<HTMLDivElement>(null);
//   const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

//   // Filter states
//   const [statusFilter, setStatusFilter] = useState<string>('all');
//   const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
//   const [searchFilter, setSearchFilter] = useState<string>('');
//   const [showFilters, setShowFilters] = useState<boolean>(false);
//   const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);


//   // Fetch quotations on component mount
//   useEffect(() => {
//     fetchQuotations();
//   }, []);

//   const fetchQuotations = async (overrides?: { status?: string; startDate?: string; endDate?: string; search?: string }) => {
//     try {
//       setLoading(true);
//       setError('');
//       let url = '/quotations?';
//       const params = new URLSearchParams();
      
//       // Use override values if provided, otherwise use state values
//       const currentStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
//       const currentStartDate = overrides?.startDate !== undefined ? overrides.startDate : dateRangeFilter.start;
//       const currentEndDate = overrides?.endDate !== undefined ? overrides.endDate : dateRangeFilter.end;
//       const currentSearch = overrides?.search !== undefined ? overrides.search : searchFilter;
      
//       if (currentStatus && currentStatus !== 'all') {
//         params.append('status', currentStatus.trim());
//         console.log('🔍 [FRONTEND] Quotation Status Filter:', currentStatus);
//       }
//       if (currentStartDate) {
//         params.append('startDate', currentStartDate);
//       }
//       if (currentEndDate) {
//         params.append('endDate', currentEndDate);
//       }
//       if (currentSearch && currentSearch.trim()) {
//         params.append('search', currentSearch.trim());
//       }

//       const queryString = params.toString();
//       if (queryString) {
//         url += queryString;
//       }

//       console.log('🔍 [FRONTEND] Fetching quotations with URL:', url);
      
//       const response = await api.get(url);
//       if (response.data.success) {
//         setQuotations(response.data.data || []);
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to fetch quotations');
//       console.error('Error fetching quotations:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clear all filters
//   const handleClearAllFilters = () => {
//     setStatusFilter('all');
//     setDateRangeFilter({ start: '', end: '' });
//     setSearchFilter('');
//     // Clear search timeout if exists
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }
//     // Fetch without any filters
//     fetchQuotations({ status: 'all', startDate: '', endDate: '', search: '' });
//   };


//   const handleDeleteClick = (id: string) => {
//     setQuotationToDelete(id);
//     setShowDeleteModal(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!quotationToDelete) return;

//     try {
//       setDeleting(true);
//       const response = await api.delete(`/quotations/${quotationToDelete}`);
      
//       if (response.data.success) {
//         setShowDeleteModal(false);
//         setQuotationToDelete(null);
//         // Refresh quotations list
//         await fetchQuotations();
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to delete quotation');
//       console.error('Error deleting quotation:', err);
//       setShowDeleteModal(false);
//       setQuotationToDelete(null);
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // Close menu when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setOpenMenuId(null);
//         setDropdownPosition(null);
//       }
//     };

//     const handleScroll = () => {
//       // Close dropdown on scroll
//       setOpenMenuId(null);
//       setDropdownPosition(null);
//     };

//     const handleResize = () => {
//       // Close dropdown on resize
//       setOpenMenuId(null);
//       setDropdownPosition(null);
//     };

//     if (openMenuId) {
//       document.addEventListener('mousedown', handleClickOutside);
//       window.addEventListener('scroll', handleScroll, true);
//       window.addEventListener('resize', handleResize);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//       window.removeEventListener('scroll', handleScroll, true);
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [openMenuId]);

//   const toggleMenu = (id: string) => {
//     if (openMenuId === id) {
//       setOpenMenuId(null);
//       setDropdownPosition(null);
//       return;
//     }

//     const button = buttonRefs.current[id];
//     if (!button) return;

//     const rect = button.getBoundingClientRect();
//     const dropdownHeight = 350; // Approximate height of dropdown menu with status actions
//     const dropdownWidth = 224; // w-56 = 14rem = 224px
//     const spacing = 8; // mt-2 = 0.5rem = 8px
//     const viewportHeight = window.innerHeight;
//     const viewportWidth = window.innerWidth;

//     // Determine if dropdown should open upward
//     const spaceBelow = viewportHeight - rect.bottom;
//     const spaceAbove = rect.top;
//     const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

//     // Calculate top position
//     let top: number;
//     if (openUpward) {
//       top = rect.top - dropdownHeight - spacing;
//       // Ensure it doesn't go above viewport
//       if (top < 10) {
//         top = 10;
//       }
//     } else {
//       top = rect.bottom + spacing;
//       // Ensure it doesn't go below viewport
//       if (top + dropdownHeight > viewportHeight - 10) {
//         top = viewportHeight - dropdownHeight - 10;
//       }
//     }

//     // Calculate left position (align to right edge of button)
//     let left = rect.right - dropdownWidth;
//     // Ensure it doesn't go off-screen
//     if (left < 10) {
//       left = 10;
//     }
//     if (left + dropdownWidth > viewportWidth - 10) {
//       left = viewportWidth - dropdownWidth - 10;
//     }

//     setDropdownPosition({ top, left, openUpward });
//     setOpenMenuId(id);
//   };

//   const handleView = async (quotation: QuotationItem) => {
//     try {
//       const response = await api.get(`/quotations/${quotation._id}`);
//       if (response.data.success) {
//         setSelectedQuotationDetails(response.data.data);
//         setShowViewDetails(true);
//       }
//     } catch (err: any) {
//       console.error('Error fetching quotation details:', err);
//       setError(err.response?.data?.message || 'Failed to fetch quotation details');
//     }
//     setOpenMenuId(null);
//     setDropdownPosition(null);
//   };

//   const handleCloseViewDetails = () => {
//     setShowViewDetails(false);
//     setSelectedQuotationDetails(null);
//   };

//   const getStatusBadgeColor = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'draft':
//         return 'bg-yellow-100 text-yellow-700 border-yellow-300';
//       case 'sent':
//         return 'bg-blue-100 text-blue-700 border-blue-300';
//       case 'approved':
//         return 'bg-green-100 text-green-700 border-green-300';
//       case 'rejected':
//         return 'bg-red-100 text-red-700 border-red-300';
//       case 'changes required':
//       case 'changes_required':
//         return 'bg-orange-100 text-orange-700 border-orange-300';
//       case 'converted':
//         return 'bg-purple-100 text-purple-700 border-purple-300';
//       default:
//         return 'bg-gray-100 text-gray-700 border-gray-300';
//     }
//   };

//   const handleStatusUpdate = async (quotationId: string, newStatus: string) => {
//     try {
//       setError('');
//       const response = await api.patch(`/quotations/${quotationId}/status`, {
//         status: newStatus
//       });
      
//       if (response.data.success) {
//         setSuccess(`Quotation status updated to ${newStatus}`);
//         // Clear success message after 3 seconds
//         setTimeout(() => setSuccess(''), 3000);
        
//         // Refresh quotations list
//         await fetchQuotations();
//         // If viewing details, refresh that too
//         if (showViewDetails && selectedQuotationDetails?._id === quotationId) {
//           const detailsResponse = await api.get(`/quotations/${quotationId}`);
//           if (detailsResponse.data.success) {
//             setSelectedQuotationDetails(detailsResponse.data.data);
//           }
//         }
//       }
//     } catch (err: any) {
//       console.error('Error updating status:', err);
//       setError(err.response?.data?.message || 'Failed to update status');
//     }
//     setOpenMenuId(null);
//     setDropdownPosition(null);
//   };

//   const canEditQuotation = (status: string) => {
//     const s = status?.toLowerCase();
//     return s === 'draft' || s === 'changes required' || s === 'changes_required' || !s;
//   };

//   const canDeleteQuotation = (status: string) => {
//     const s = status?.toLowerCase();
//     return s !== 'converted';
//   };

//   const canConvertToOrder = (status: string) => {
//     return status?.toLowerCase() === 'approved';
//   };

//   const canMarkAsSent = (status: string) => {
//     const s = status?.toLowerCase();
//     return s === 'draft' || s === 'changes required' || s === 'changes_required' || !s;
//   };

//   const canMarkAsApproved = (status: string) => {
//     return status?.toLowerCase() === 'sent';
//   };

//   const canMarkAsRejected = (status: string) => {
//     return status?.toLowerCase() === 'sent';
//   };

//   const canRequestChanges = (status: string) => {
//     return status?.toLowerCase() === 'sent';
//   };

//   const handleEdit = async (quotation: QuotationItem) => {
//     try {
//       const response = await api.get(`/quotations/${quotation._id}`);
//       if (response.data.success) {
//         setQuotationToEdit(response.data.data);
//         setShowModal(true);
//       }
//     } catch (err: any) {
//       console.error('Error fetching quotation details:', err);
//       setError(err.response?.data?.message || 'Failed to fetch quotation details');
//     }
//     setOpenMenuId(null);
//     setDropdownPosition(null);
//   };

//   const handleDownloadPDF = async (quotation: QuotationItem) => {
//     try {
//       setLoading(true);
      
//       // Fetch company settings
//       const settingsResponse = await api.get('/settings');
//       const companySettings = settingsResponse.data;
      
//       // Fetch full quotation details
//       const quotationResponse = await api.get(`/quotations/${quotation._id}`);
//       const quotationDetails = quotationResponse.data;
      
//       // Create PDF
//       const doc = new jsPDF();
//       const pageWidth = doc.internal.pageSize.getWidth();
//       const pageHeight = doc.internal.pageSize.getHeight();
//       let yPosition = 20;
      
//       // Company Header
//       doc.setFontSize(20);
//       doc.setFont('helvetica', 'bold');
//       doc.setTextColor(34, 139, 34); // Green color
//       doc.text(companySettings.companyName || 'Company Name', pageWidth / 2, yPosition, { align: 'center' });
//       yPosition += 8;
      
//       if (companySettings.tagline) {
//         doc.setFontSize(10);
//         doc.setFont('helvetica', 'italic');
//         doc.setTextColor(100, 100, 100);
//         doc.text(companySettings.tagline, pageWidth / 2, yPosition, { align: 'center' });
//         yPosition += 6;
//       }
      
//       // Company Contact Info
//       doc.setFontSize(9);
//       doc.setFont('helvetica', 'normal');
//       doc.setTextColor(80, 80, 80);
//       const contactInfo = [];
//       if (companySettings.addressLine1) contactInfo.push(companySettings.addressLine1);
//       if (companySettings.addressLine2) contactInfo.push(companySettings.addressLine2);
//       if (companySettings.city || companySettings.state) {
//         contactInfo.push(`${companySettings.city || ''}${companySettings.city && companySettings.state ? ', ' : ''}${companySettings.state || ''} ${companySettings.pincode || ''}`);
//       }
//       if (companySettings.phone) contactInfo.push(`Phone: ${companySettings.phone}`);
//       if (companySettings.email) contactInfo.push(`Email: ${companySettings.email}`);
//       if (companySettings.website) contactInfo.push(`Website: ${companySettings.website}`);
//       if (companySettings.gstin) contactInfo.push(`GSTIN: ${companySettings.gstin}`);
      
//       contactInfo.forEach((info) => {
//         doc.text(info, pageWidth / 2, yPosition, { align: 'center' });
//         yPosition += 4;
//       });
      
//       yPosition += 5;
//       doc.setDrawColor(34, 139, 34);
//       doc.setLineWidth(0.5);
//       doc.line(15, yPosition, pageWidth - 15, yPosition);
//       yPosition += 10;
      
//       // Document Title
//       doc.setFontSize(16);
//       doc.setFont('helvetica', 'bold');
//       doc.setTextColor(0, 0, 0);
//       doc.text('QUOTATION', pageWidth / 2, yPosition, { align: 'center' });
//       yPosition += 10;
      
//       // Quotation Details - Two Columns
//       doc.setFontSize(10);
//       doc.setFont('helvetica', 'normal');
      
//       const leftColX = 15;
//       const rightColX = pageWidth / 2 + 10;
      
//       // Left Column
//       doc.setFont('helvetica', 'bold');
//       doc.text('Quotation No:', leftColX, yPosition);
//       doc.setFont('helvetica', 'normal');
//       doc.text(quotationDetails.quotationNumber || 'N/A', leftColX + 35, yPosition);
      
//       // Right Column
//       doc.setFont('helvetica', 'bold');
//       doc.text('Date:', rightColX, yPosition);
//       doc.setFont('helvetica', 'normal');
//       doc.text(new Date(quotationDetails.createdAt).toLocaleDateString('en-IN'), rightColX + 20, yPosition);
//       yPosition += 6;
      
//       // Customer Name
//       doc.setFont('helvetica', 'bold');
//       doc.text('Customer:', leftColX, yPosition);
//       doc.setFont('helvetica', 'normal');
//       doc.text(quotationDetails.partyName || 'N/A', leftColX + 35, yPosition);
      
//       // Status
//       doc.setFont('helvetica', 'bold');
//       doc.text('Status:', rightColX, yPosition);
//       doc.setFont('helvetica', 'normal');
//       const statusColors: any = {
//         Draft: [255, 193, 7],
//         Sent: [33, 150, 243],
//         Approved: [76, 175, 80],
//         Rejected: [244, 67, 54],
//         'Changes Required': [255, 152, 0],
//         Converted: [156, 39, 176]
//       };
//       const statusColor = statusColors[quotationDetails.status || 'Draft'] || [100, 100, 100];
//       doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
//       doc.text(quotationDetails.status || 'Draft', rightColX + 20, yPosition);
//       doc.setTextColor(0, 0, 0);
//       yPosition += 6;
      
//       // Valid Until
//       if (quotationDetails.validUntil) {
//         doc.setFont('helvetica', 'bold');
//         doc.text('Valid Until:', leftColX, yPosition);
//         doc.setFont('helvetica', 'normal');
//         doc.text(new Date(quotationDetails.validUntil).toLocaleDateString('en-IN'), leftColX + 35, yPosition);
//         yPosition += 6;
//       }
      
//       yPosition += 5;
      
//       // Items Table
//       const tableData: any[] = [];
      
//       if (quotationDetails.items && quotationDetails.items.length > 0) {
//         quotationDetails.items.forEach((item: any, index: number) => {
//           // Main item row
//           tableData.push([
//             { content: item.itemName, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
//             { content: item.quantity.toString(), styles: { halign: 'center', fillColor: [245, 245, 245] } },
//             { content: `₹${(item.rate || 0).toFixed(2)}`, styles: { halign: 'right', fillColor: [245, 245, 245] } },
//             { content: `${item.discount || 0}%`, styles: { halign: 'center', fillColor: [245, 245, 245] } },
//             { content: `₹${(item.itemTotal || item.amount || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } }
//           ]);
          
//           // Process rows for this item
//           if (item.processes && item.processes.length > 0) {
//             item.processes.forEach((process: any) => {
//               tableData.push([
//                 { content: `  ↳ ${process.processName}`, styles: { fontSize: 9, textColor: [80, 80, 80], fillColor: [230, 240, 255] } },
//                 { content: `${process.quantity || 1}`, styles: { halign: 'center', fontSize: 9, fillColor: [230, 240, 255] } },
//                 { content: `₹${(process.processCost || 0).toFixed(2)}`, styles: { halign: 'right', fontSize: 9, fillColor: [230, 240, 255] } },
//                 { content: '-', styles: { halign: 'center', fontSize: 9, fillColor: [230, 240, 255] } },
//                 { content: `₹${(process.processTotal || 0).toFixed(2)}`, styles: { halign: 'right', fontSize: 9, fillColor: [230, 240, 255] } }
//               ]);
//             });
//           }
//         });
//       }
      
//       autoTable(doc, {
//         startY: yPosition,
//         head: [['Item Name', 'Qty', 'Rate', 'Disc.', 'Amount']],
//         body: tableData,
//         theme: 'grid',
//         headStyles: {
//           fillColor: [34, 139, 34],
//           textColor: [255, 255, 255],
//           fontStyle: 'bold',
//           halign: 'center'
//         },
//         styles: {
//           fontSize: 10,
//           cellPadding: 3
//         },
//         columnStyles: {
//           0: { cellWidth: 70 },
//           1: { cellWidth: 25, halign: 'center' },
//           2: { cellWidth: 35, halign: 'right' },
//           3: { cellWidth: 25, halign: 'center' },
//           4: { cellWidth: 35, halign: 'right' }
//         }
//       });
      
//       yPosition = (doc as any).lastAutoTable.finalY + 10;
      
//       // Financial Summary
//       const summaryX = pageWidth - 75;
//       doc.setFontSize(10);
      
//       // Base Amount
//       doc.setFont('helvetica', 'normal');
//       doc.text('Subtotal:', summaryX, yPosition);
//       doc.text(`₹${(quotationDetails.baseAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
//       yPosition += 6;
      
//       // GST
//       if (quotationDetails.gstPercent > 0) {
//         doc.text(`GST (${quotationDetails.gstPercent}%):`, summaryX, yPosition);
//         doc.text(`₹${(quotationDetails.totalTaxAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
//         yPosition += 6;
//       }
      
//       // TDS
//       if (quotationDetails.tdsPercent > 0) {
//         doc.setTextColor(255, 0, 0);
//         doc.text(`TDS (${quotationDetails.tdsPercent}%):`, summaryX, yPosition);
//         doc.text(`-₹${(quotationDetails.tdsAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
//         doc.setTextColor(0, 0, 0);
//         yPosition += 6;
//       }
      
//       // TCS
//       if (quotationDetails.tcsPercent > 0) {
//         doc.text(`TCS (${quotationDetails.tcsPercent}%):`, summaryX, yPosition);
//         doc.text(`₹${(quotationDetails.tcsAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
//         yPosition += 6;
//       }
      
//       // Remittance
//       if (quotationDetails.remittanceCharges > 0) {
//         doc.text('Remittance:', summaryX, yPosition);
//         doc.text(`₹${quotationDetails.remittanceCharges.toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
//         yPosition += 6;
//       }
      
//       // Total line
//       yPosition += 2;
//       doc.setDrawColor(34, 139, 34);
//       doc.setLineWidth(0.5);
//       doc.line(summaryX, yPosition, pageWidth - 15, yPosition);
//       yPosition += 6;
      
//       // Grand Total
//       doc.setFontSize(12);
//       doc.setFont('helvetica', 'bold');
//       doc.setTextColor(34, 139, 34);
//       doc.text('Total Amount:', summaryX, yPosition);
//       doc.text(`₹${(quotationDetails.totalAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
//       doc.setTextColor(0, 0, 0);
//       yPosition += 10;
      
//       // Payment Terms
//       if (quotationDetails.paymentTerms) {
//         doc.setFontSize(10);
//         doc.setFont('helvetica', 'bold');
//         doc.text('Payment Terms:', 15, yPosition);
//         yPosition += 5;
//         doc.setFont('helvetica', 'normal');
//         const splitTerms = doc.splitTextToSize(quotationDetails.paymentTerms, pageWidth - 30);
//         doc.text(splitTerms, 15, yPosition);
//         yPosition += (splitTerms.length * 5);
//       }
      
//       // Footer Note
//       if (companySettings.footerNote) {
//         yPosition += 5;
//         doc.setFontSize(9);
//         doc.setFont('helvetica', 'italic');
//         doc.setTextColor(100, 100, 100);
//         const splitFooter = doc.splitTextToSize(companySettings.footerNote, pageWidth - 30);
//         doc.text(splitFooter, pageWidth / 2, yPosition, { align: 'center' });
//       }
      
//       // Bank Details (if available)
//       if (companySettings.bankName && yPosition < pageHeight - 40) {
//         yPosition += 10;
//         doc.setFontSize(10);
//         doc.setFont('helvetica', 'bold');
//         doc.setTextColor(0, 0, 0);
//         doc.text('Bank Details:', 15, yPosition);
//         yPosition += 5;
//         doc.setFontSize(9);
//         doc.setFont('helvetica', 'normal');
//         if (companySettings.bankName) {
//           doc.text(`Bank: ${companySettings.bankName}`, 15, yPosition);
//           yPosition += 4;
//         }
//         if (companySettings.accountNumber) {
//           doc.text(`Account No: ${companySettings.accountNumber}`, 15, yPosition);
//           yPosition += 4;
//         }
//         if (companySettings.ifsc) {
//           doc.text(`IFSC: ${companySettings.ifsc}`, 15, yPosition);
//           yPosition += 4;
//         }
//         if (companySettings.branch) {
//           doc.text(`Branch: ${companySettings.branch}`, 15, yPosition);
//         }
//       }
      
//       // Save PDF
//       doc.save(`Quotation_${quotationDetails.quotationNumber}.pdf`);
      
//       setSuccess('PDF downloaded successfully!');
//       setTimeout(() => setSuccess(''), 3000);
//       setLoading(false);
//       setOpenMenuId(null);
//       setDropdownPosition(null);
//     } catch (error: any) {
//       console.error('Error generating PDF:', error);
//       setError(error.response?.data?.message || 'Failed to generate PDF');
//       setTimeout(() => setError(''), 5000);
//       setLoading(false);
//     }
//   };

//   const handleDelete = (quotation: QuotationItem) => {
//     handleDeleteClick(quotation._id);
//     setOpenMenuId(null);
//     setDropdownPosition(null);
//   };

//   return (
//     <div className="space-y-4 md:space-y-6">
//       {!showModal && !showViewDetails && (
//         <>
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
//             <div>
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quotation Management</h1>
//               <p className="text-sm md:text-base text-gray-500 mt-1">Create and manage customer quotations</p>
//             </div>
//             <div className="flex items-center gap-3 w-full sm:w-auto">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
//               >
//                 <Filter size={18} />
//                 <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
//               </button>
//               <button
//                 onClick={() => { 
//                   setQuotationToEdit(null);
//                   setShowModal(true); 
//                 }}
//                 className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors flex-1 sm:flex-initial"
//               >
//                 <Plus size={20} className="w-4 h-4 md:w-5 md:h-5" />
//                 <span>New Quotation</span>
//               </button>
//             </div>
//           </div>

//           {/* Success Message */}
//           {success && (
//             <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in">
//               <div className="flex items-center gap-3">
//                 <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
//                 <span className="font-semibold text-base">{success}</span>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setSuccess('')}
//                 className="text-green-600 hover:text-green-800 hover:bg-green-200 p-2 rounded-full transition-all duration-200 ml-4"
//                 aria-label="Close success message"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//           )}

//           {/* Error Message */}
//           {error && (
//             <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in">
//               <div className="flex items-center gap-3">
//                 <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
//                 <span className="font-semibold text-base">{error}</span>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setError('')}
//                 className="text-red-600 hover:text-red-800 hover:bg-red-200 p-2 rounded-full transition-all duration-200 ml-4"
//                 aria-label="Close error message"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//           )}

//           {/* Filters Section */}
//           {showFilters && (
//             <div className="bg-white p-4 rounded-lg shadow-md animate-fadeIn">
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
//                   <select
//                     value={statusFilter}
//                     onChange={(e) => {
//                       const newValue = e.target.value;
//                       setStatusFilter(newValue);
//                       fetchQuotations({ status: newValue });
//                     }}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//                   >
//                     <option value="all">All Status</option>
//                     <option value="Draft">Draft</option>
//                     <option value="Sent">Sent</option>
//                     <option value="Approved">Approved</option>
//                     <option value="Rejected">Rejected</option>
//                     <option value="Changes Required">Changes Required</option>
//                     <option value="Converted">Converted</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
//                   <input
//                     type="date"
//                     value={dateRangeFilter.start}
//                     onChange={(e) => {
//                       const newStartDate = e.target.value;
//                       const newDateRange = { ...dateRangeFilter, start: newStartDate };
//                       setDateRangeFilter(newDateRange);
//                       fetchQuotations({ startDate: newStartDate, endDate: dateRangeFilter.end });
//                     }}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
//                   <input
//                     type="date"
//                     value={dateRangeFilter.end}
//                     onChange={(e) => {
//                       const newEndDate = e.target.value;
//                       const newDateRange = { ...dateRangeFilter, end: newEndDate };
//                       setDateRangeFilter(newDateRange);
//                       fetchQuotations({ startDate: dateRangeFilter.start, endDate: newEndDate });
//                     }}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
//                   <input
//                     type="text"
//                     value={searchFilter}
//                     onChange={(e) => {
//                       const newSearchValue = e.target.value;
//                       setSearchFilter(newSearchValue);
//                       // Clear previous timeout if user types again
//                       if (searchTimeoutRef.current) {
//                         clearTimeout(searchTimeoutRef.current);
//                       }
//                       // Debounce search - only fetch after user stops typing
//                       searchTimeoutRef.current = setTimeout(() => {
//                         fetchQuotations({ search: newSearchValue });
//                       }, 500);
//                     }}
//                     placeholder="Search by Quotation No or Party Name"
//                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//                   />
//                 </div>
//               </div>
//               {/* Clear All Filters Button */}
//               <div className="mt-4 flex justify-end">
//                 <button
//                   onClick={handleClearAllFilters}
//                   className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium text-sm"
//                 >
//                   <RotateCcw size={16} />
//                   <span>Clear All Filters</span>
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Success Message */}
//           {success && (
//             <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
//               <span>{success}</span>
//               <button
//                 onClick={() => setSuccess('')}
//                 className="text-green-700 hover:text-green-900 ml-4 p-1 hover:bg-green-100 rounded transition-colors"
//                 aria-label="Close success message"
//               >
//                 <X size={18} />
//               </button>
//             </div>
//           )}

//           {/* Error Message */}
//           {error && (
//             <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
//               <span>{error}</span>
//               <button
//                 onClick={() => setError('')}
//                 className="text-red-700 hover:text-red-900 ml-4 p-1 hover:bg-red-100 rounded transition-colors"
//                 aria-label="Close error message"
//               >
//                 <X size={18} />
//               </button>
//             </div>
//           )}

//           <div className="bg-white rounded-lg shadow-md">
//         <div className="overflow-x-auto -mx-3 md:mx-0">
//           <div className="inline-block min-w-full align-middle px-3 md:px-0">
//             <table className="min-w-full divide-y divide-gray-200 relative">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quotation No</th>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Party Name</th>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created By</th>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
//                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading && quotations.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="py-8 text-center text-gray-500">
//                     Loading quotations...
//                   </td>
//                 </tr>
//               ) : quotations.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="py-8 text-center text-gray-500">
//                     No quotations found. Create your first quotation!
//                   </td>
//                 </tr>
//               ) : (
//                 quotations.map((quotation) => (
//                   <tr key={quotation._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
//                     <td className="py-3 px-4">
//                       <span className="text-sm font-medium text-gray-900">
//                         {quotation.quotationNumber}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4 text-sm text-gray-700">{quotation.partyName}</td>
//                     <td className="py-3 px-4 text-sm text-gray-900 font-semibold">₹{(quotation.receivableAmount || quotation.totalAmount).toLocaleString()}</td>
//                     <td className="py-3 px-4 text-sm text-gray-700">
//                       {new Date(quotation.createdAt).toLocaleDateString()}
//                     </td>
//                     <td className="py-3 px-4 text-sm text-gray-700">
//                       {quotation.createdBy?.name || 'N/A'}
//                     </td>
//                     <td className="py-3 px-4">
//                       <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
//                         quotation.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
//                         quotation.status?.toLowerCase() === 'sent' ? 'bg-blue-100 text-blue-700' :
//                         quotation.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
//                         quotation.status?.toLowerCase() === 'converted' ? 'bg-purple-100 text-purple-700' :
//                         'bg-yellow-100 text-yellow-700'
//                       }`}>
//                         {quotation.status || 'Draft'}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4">
//                       <button
//                         ref={(el) => { buttonRefs.current[quotation._id] = el; }}
//                         onClick={() => toggleMenu(quotation._id)}
//                         className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                         title="More actions"
//                       >
//                         <MoreVertical size={18} className="text-gray-600" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//           </div>
//         </div>
//       </div>
//         </>
//       )}

//       {showModal && (
//         <div className="bg-white rounded-lg shadow-md overflow-hidden">
//           <QuotationForm
//             onClose={() => {
//               setShowModal(false);
//               setQuotationToEdit(null);
//             }}
//             onSuccess={() => {
//               fetchQuotations();
//               setShowModal(false);
//               setQuotationToEdit(null);
//             }}
//             quotationToEdit={quotationToEdit}
//           />
//         </div>
//       )}

//       {/* View Quotation Details */}
//       {showViewDetails && selectedQuotationDetails && (
//         <div className="bg-white rounded-lg shadow-md">
//           <div className="p-6">
//             {/* Header with Status and Close Button */}
//             <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-300">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Details</h2>
//                 <span className={`inline-block px-4 py-1.5 text-sm font-semibold rounded-full border ${getStatusBadgeColor(selectedQuotationDetails.status || 'Draft')}`}>
//                   {selectedQuotationDetails.status || 'Draft'}
//                 </span>
//               </div>
//               <button
//                 onClick={handleCloseViewDetails}
//                 className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 title="Close"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             {/* Changes Required Banner */}
//             {(selectedQuotationDetails.status?.toLowerCase() === 'changes required' || 
//               selectedQuotationDetails.status?.toLowerCase() === 'changes_required') && (
//               <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
//                 <div className="flex items-start">
//                   <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5 mr-3" />
//                   <div>
//                     <h3 className="text-sm font-bold text-orange-900 mb-1">Changes Required</h3>
//                     <p className="text-sm text-orange-800">
//                       Customer has requested modifications to this quotation. Please review and make necessary changes, then mark as "Sent" again.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Status Timeline */}
//             <div className="mb-6 bg-gray-50 rounded-lg p-4">
//               <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
//                 <RefreshCw size={16} />
//                 Status Timeline
//               </h3>
//               <div className="flex items-center justify-between flex-wrap gap-2">
//                 {/* Draft */}
//                 <div className={`flex flex-col items-center ${
//                   selectedQuotationDetails.status?.toLowerCase() === 'draft' || !selectedQuotationDetails.status
//                     ? 'opacity-100' : 'opacity-40'
//                 }`}>
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                     selectedQuotationDetails.status?.toLowerCase() === 'draft' || !selectedQuotationDetails.status
//                       ? 'bg-yellow-500 border-yellow-600 text-white'
//                       : 'bg-gray-200 border-gray-300 text-gray-500'
//                   }`}>
//                     1
//                   </div>
//                   <span className="text-xs font-medium text-gray-700 mt-1">Draft</span>
//                   {selectedQuotationDetails.createdAt && (
//                     <span className="text-xs text-gray-500">{new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}</span>
//                   )}
//                 </div>

//                 {/* Arrow */}
//                 <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

//                 {/* Sent */}
//                 <div className={`flex flex-col items-center ${
//                   ['sent', 'approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
//                     ? 'opacity-100' : 'opacity-40'
//                 }`}>
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                     ['sent', 'approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
//                       ? 'bg-blue-500 border-blue-600 text-white'
//                       : 'bg-gray-200 border-gray-300 text-gray-500'
//                   }`}>
//                     2
//                   </div>
//                   <span className="text-xs font-medium text-gray-700 mt-1">Sent</span>
//                 </div>

//                 {/* Arrow */}
//                 <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

//                 {/* Approved/Rejected/Changes Required */}
//                 <div className={`flex flex-col items-center ${
//                   ['approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
//                     ? 'opacity-100' : 'opacity-40'
//                 }`}>
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                     selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted'
//                       ? 'bg-green-500 border-green-600 text-white'
//                       : selectedQuotationDetails.status?.toLowerCase() === 'rejected'
//                       ? 'bg-red-500 border-red-600 text-white'
//                       : selectedQuotationDetails.status?.toLowerCase() === 'changes required'
//                       ? 'bg-orange-500 border-orange-600 text-white'
//                       : 'bg-gray-200 border-gray-300 text-gray-500'
//                   }`}>
//                     {selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted' ? (
//                       <CheckCircle size={16} />
//                     ) : selectedQuotationDetails.status?.toLowerCase() === 'rejected' ? (
//                       <XCircle size={16} />
//                     ) : selectedQuotationDetails.status?.toLowerCase() === 'changes required' ? (
//                       <AlertCircle size={16} />
//                     ) : (
//                       '3'
//                     )}
//                   </div>
//                   <span className="text-xs font-medium text-gray-700 mt-1">
//                     {selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted'
//                       ? 'Approved'
//                       : selectedQuotationDetails.status?.toLowerCase() === 'rejected'
//                       ? 'Rejected'
//                       : selectedQuotationDetails.status?.toLowerCase() === 'changes required'
//                       ? 'Changes Req.'
//                       : 'Pending'}
//                   </span>
//                 </div>

//                 {/* Arrow - Only if Approved */}
//                 {(selectedQuotationDetails.status?.toLowerCase() === 'approved' || 
//                   selectedQuotationDetails.status?.toLowerCase() === 'converted') && (
//                   <>
//                     <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

//                     {/* Converted */}
//                     <div className={`flex flex-col items-center ${
//                       selectedQuotationDetails.status?.toLowerCase() === 'converted'
//                         ? 'opacity-100' : 'opacity-40'
//                     }`}>
//                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                         selectedQuotationDetails.status?.toLowerCase() === 'converted'
//                           ? 'bg-purple-500 border-purple-600 text-white'
//                           : 'bg-gray-200 border-gray-300 text-gray-500'
//                       }`}>
//                         <FileText size={16} />
//                       </div>
//                       <span className="text-xs font-medium text-gray-700 mt-1">Converted</span>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Quotation Information Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation Number</label>
//                 <p className="text-gray-900">{selectedQuotationDetails.quotationNumber}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
//                 <p className="text-gray-900">{selectedQuotationDetails.partyName}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Quote Date</label>
//                 <p className="text-gray-900">
//                   {selectedQuotationDetails.quotationDate 
//                     ? new Date(selectedQuotationDetails.quotationDate).toLocaleDateString() 
//                     : new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}
//                 </p>
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
//                 <p className="text-gray-900">
//                   {selectedQuotationDetails.validUntil 
//                     ? new Date(selectedQuotationDetails.validUntil).toLocaleDateString() 
//                     : 'N/A'}
//                 </p>
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Created By</label>
//                 <p className="text-gray-900">{selectedQuotationDetails.createdBy?.name || 'N/A'}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Created Date</label>
//                 <p className="text-gray-900">
//                   {new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}
//                 </p>
//               </div>
//             </div>

//             {/* Subject */}
//             {selectedQuotationDetails.subject && (
//               <div className="mb-6">
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
//                 <p className="text-gray-900">{selectedQuotationDetails.subject}</p>
//               </div>
//             )}

//             {/* Item List Table */}
//             <div className="mb-6">
//               <h3 className="text-lg font-bold text-gray-900 mb-3">Items</h3>
//               <div className="overflow-x-auto border border-gray-200 rounded-lg">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Item Name</th>
//                       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Quantity</th>
//                       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Rate</th>
//                       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Discount</th>
//                       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {selectedQuotationDetails.items && selectedQuotationDetails.items.length > 0 ? (
//                       selectedQuotationDetails.items.map((item: any, index: number) => (
//                         <React.Fragment key={index}>
//                           {/* Item Row */}
//                           <tr className="bg-gray-50">
//                             <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.itemName}</td>
//                             <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
//                             <td className="px-4 py-3 text-sm text-gray-900 text-right">
//                               ₹{(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                             <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.discount || 0}%</td>
//                             <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
//                               ₹{(item.itemTotal || item.subTotal || item.lineTotal || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                           </tr>
                          
//                           {/* Item Processes */}
//                           {item.processes && item.processes.length > 0 && (
//                             <tr>
//                               <td colSpan={5} className="px-4 py-2 bg-blue-50">
//                                 <div className="pl-6">
//                                   <p className="text-xs font-semibold text-gray-700 mb-2">Item Processes:</p>
//                                   <table className="min-w-full">
//                                     <thead>
//                                       <tr className="border-b border-blue-200">
//                                         <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Process Name</th>
//                                         <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Cost (₹)</th>
//                                         <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Quantity</th>
//                                         <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Total (₹)</th>
//                                       </tr>
//                                     </thead>
//                                     <tbody>
//                                       {item.processes.map((process: any, pIndex: number) => (
//                                         <tr key={pIndex} className="border-b border-blue-100">
//                                           <td className="px-2 py-2 text-xs text-gray-700">{process.processName || 'N/A'}</td>
//                                           <td className="px-2 py-2 text-xs text-gray-700 text-right">
//                                             ₹{(process.processCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                           </td>
//                                           <td className="px-2 py-2 text-xs text-gray-700 text-right">{process.quantity || 1}</td>
//                                           <td className="px-2 py-2 text-xs font-semibold text-gray-900 text-right">
//                                             ₹{(process.processTotal || ((process.processCost || 0) * (process.quantity || 1))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                           </td>
//                                         </tr>
//                                       ))}
//                                     </tbody>
//                                   </table>
//                                 </div>
//                               </td>
//                             </tr>
//                           )}
//                         </React.Fragment>
//                       ))
//                     ) : selectedQuotationDetails.processes && selectedQuotationDetails.processes.length > 0 ? (
//                       selectedQuotationDetails.processes.map((process: any, _index: number) => (
//                         <tr key={_index}>
//                           <td className="px-4 py-3 text-sm text-gray-900">{process.processName}</td>
//                           <td className="px-4 py-3 text-sm text-gray-900 text-right">{process.quantity || 1}</td>
//                           <td className="px-4 py-3 text-sm text-gray-900 text-right">
//                             ₹{(process.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                           </td>
//                           <td className="px-4 py-3 text-sm text-gray-900 text-right">0%</td>
//                           <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
//                             ₹{((process.rate || 0) * (process.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 text-center">No items found</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Financial Summary */}
//             <div className="bg-gray-50 rounded-lg p-6 space-y-3">
//               <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h3>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm font-medium text-gray-700">Subtotal:</span>
//                   <span className="text-sm font-semibold text-gray-900">
//                     ₹{(selectedQuotationDetails.totalSubTotal || selectedQuotationDetails.baseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                   </span>
//                 </div>
//                 {selectedQuotationDetails.gstPercent > 0 && (
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-700">
//                       GST ({selectedQuotationDetails.gstPercent}%):
//                     </span>
//                     <span className="text-sm font-semibold text-gray-900">
//                       ₹{(selectedQuotationDetails.totalTaxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                   </div>
//                 )}
//                 {selectedQuotationDetails.tdsPercent > 0 && (
//                   <div className="flex justify-between items-center text-red-600">
//                     <span className="text-sm font-medium">
//                       TDS ({selectedQuotationDetails.tdsPercent}%):
//                     </span>
//                     <span className="text-sm font-semibold">
//                       -₹{(selectedQuotationDetails.tdsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                   </div>
//                 )}
//                 {selectedQuotationDetails.tcsPercent > 0 && (
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-700">
//                       TCS ({selectedQuotationDetails.tcsPercent}%):
//                     </span>
//                     <span className="text-sm font-semibold text-gray-900">
//                       ₹{(selectedQuotationDetails.tcsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                   </div>
//                 )}
//                 {selectedQuotationDetails.remittanceCharges > 0 && (
//                   <div className="flex justify-between items-center text-red-600">
//                     <span className="text-sm font-medium">Remittance Charges:</span>
//                     <span className="text-sm font-semibold">
//                       -₹{(selectedQuotationDetails.remittanceCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                   </div>
//                 )}
//                 <div className="border-t-2 border-gray-300 pt-3 mt-3">
//                   <div className="flex justify-between items-center">
//                     <span className="text-base font-bold text-gray-900">Total Amount:</span>
//                     <span className="text-xl font-bold text-green-600">
//                       ₹{(selectedQuotationDetails.receivableAmount || selectedQuotationDetails.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Customer Notes */}
//             {selectedQuotationDetails.customerNotes && (
//               <div className="mt-6">
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Notes</label>
//                 <p className="text-gray-900 whitespace-pre-wrap">{selectedQuotationDetails.customerNotes}</p>
//               </div>
//             )}

//             {/* Terms and Conditions */}
//             {selectedQuotationDetails.termsAndConditions && (
//               <div className="mt-6">
//                 <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
//                 <p className="text-gray-900 whitespace-pre-wrap">{selectedQuotationDetails.termsAndConditions}</p>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-300">
//               <button
//                 onClick={handleCloseViewDetails}
//                 className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Dropdown Menu Portal */}
//       {openMenuId && dropdownPosition && createPortal(
//         <div
//           ref={menuRef}
//           className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000]"
//           style={{
//             top: `${dropdownPosition.top}px`,
//             left: `${dropdownPosition.left}px`,
//           }}
//         >
//           <div className="py-1">
//             {(() => {
//               const quotation = quotations.find(q => q._id === openMenuId);
//               if (!quotation) return null;
//               const status = quotation.status || 'Draft';

//               return (
//                 <>
//                   {/* View Details */}
//                   <button
//                     onClick={() => handleView(quotation)}
//                     className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
//                   >
//                     <Eye size={16} className="text-blue-600 flex-shrink-0" />
//                     <span>View Details</span>
//                   </button>

//                   {/* Edit - Only if editable */}
//                   {canEditQuotation(status) && (
//                     <button
//                       onClick={() => handleEdit(quotation)}
//                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
//                     >
//                       <Edit size={16} className="text-green-600 flex-shrink-0" />
//                       <span>Edit</span>
//                     </button>
//                   )}

//                   {/* Download PDF */}
//                   <button
//                     onClick={() => handleDownloadPDF(quotation)}
//                     className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
//                   >
//                     <Download size={16} className="text-green-600 flex-shrink-0" />
//                     <span>Download PDF</span>
//                   </button>

//                   {/* Status Actions Divider */}
//                   <div className="border-t border-gray-200 my-1"></div>

//                   {/* Mark as Sent */}
//                   {canMarkAsSent(status) && (
//                     <button
//                       onClick={() => handleStatusUpdate(quotation._id, 'Sent')}
//                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
//                     >
//                       <Send size={16} className="text-blue-600 flex-shrink-0" />
//                       <span>Mark as Sent</span>
//                     </button>
//                   )}

//                   {/* Mark as Approved */}
//                   {canMarkAsApproved(status) && (
//                     <button
//                       onClick={() => handleStatusUpdate(quotation._id, 'Approved')}
//                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
//                     >
//                       <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
//                       <span>Mark as Approved</span>
//                     </button>
//                   )}

//                   {/* Mark as Rejected */}
//                   {canMarkAsRejected(status) && (
//                     <button
//                       onClick={() => handleStatusUpdate(quotation._id, 'Rejected')}
//                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
//                     >
//                       <XCircle size={16} className="text-red-600 flex-shrink-0" />
//                       <span>Mark as Rejected</span>
//                     </button>
//                   )}

//                   {/* Request Changes */}
//                   {canRequestChanges(status) && (
//                     <button
//                       onClick={() => handleStatusUpdate(quotation._id, 'Changes Required')}
//                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
//                     >
//                       <AlertCircle size={16} className="text-orange-600 flex-shrink-0" />
//                       <span>Request Changes</span>
//                     </button>
//                   )}

//                   {/* Convert to Order */}
//                   {canConvertToOrder(status) && (
//                     <>
//                       <div className="border-t border-gray-200 my-1"></div>
//                       <button
//                         onClick={() => {
//                           alert('Convert to Sales Order feature - Coming soon!\nThis will create a new order from this approved quotation.');
//                           setOpenMenuId(null);
//                           setDropdownPosition(null);
//                         }}
//                         className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2 transition-colors"
//                       >
//                         <FileText size={16} className="text-purple-600 flex-shrink-0" />
//                         <span>Convert to Order</span>
//                       </button>
//                     </>
//                   )}

//                   {/* Delete - Only if allowed */}
//                   {canDeleteQuotation(status) && (
//                     <>
//                       <div className="border-t border-gray-200 my-1"></div>
//                       <button
//                         onClick={() => handleDelete(quotation)}
//                         className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
//                       >
//                         <Trash2 size={16} className="flex-shrink-0" />
//                         <span>Delete</span>
//                       </button>
//                     </>
//                   )}
//                 </>
//               );
//             })()}
//           </div>
//         </div>,
//         document.body
//       )}

//       <ConfirmationModal
//         isOpen={showDeleteModal}
//         onClose={() => {
//           setShowDeleteModal(false);
//           setQuotationToDelete(null);
//         }}
//         onConfirm={handleDeleteConfirm}
//         title="Delete Quotation"
//         message="Are you sure you want to delete this quotation? This action cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         type="danger"
//         isLoading={deleting}
//       />
//     </div>
//   );
// }



// quotation.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Eye, X, Trash2, MoreVertical, Edit, Send, CheckCircle, XCircle, RefreshCw, FileText, AlertCircle, Download, Filter, RotateCcw } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from '../components/ConfirmationModal';
import QuotationForm from '../components/QuotationForm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationItem {
  _id: string;
  quotationNumber: string;
  partyName: string;
  totalAmount: number;
  receivableAmount?: number;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  status?: string;
}

export default function Quotation() {
  const [showModal, setShowModal] = useState(false);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [quotationToEdit, setQuotationToEdit] = useState<any>(null);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<any>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Fetch quotations on component mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async (overrides?: { status?: string; startDate?: string; endDate?: string; search?: string }) => {
    try {
      setLoading(true);
      setError('');
      let url = '/quotations?';
      const params = new URLSearchParams();
      
      // Use override values if provided, otherwise use state values
      const currentStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const currentStartDate = overrides?.startDate !== undefined ? overrides.startDate : dateRangeFilter.start;
      const currentEndDate = overrides?.endDate !== undefined ? overrides.endDate : dateRangeFilter.end;
      const currentSearch = overrides?.search !== undefined ? overrides.search : searchFilter;
      
      if (currentStatus && currentStatus !== 'all') {
        params.append('status', currentStatus.trim());
        console.log('🔍 [FRONTEND] Quotation Status Filter:', currentStatus);
      }
      if (currentStartDate) {
        params.append('startDate', currentStartDate);
      }
      if (currentEndDate) {
        params.append('endDate', currentEndDate);
      }
      if (currentSearch && currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }

      const queryString = params.toString();
      if (queryString) {
        url += queryString;
      }

      console.log('🔍 [FRONTEND] Fetching quotations with URL:', url);
      
      const response = await api.get(url);
      if (response.data.success) {
        setQuotations(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quotations');
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setStatusFilter('all');
    setDateRangeFilter({ start: '', end: '' });
    setSearchFilter('');
    // Clear search timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Fetch without any filters
    fetchQuotations({ status: 'all', startDate: '', endDate: '', search: '' });
  };


  const handleDeleteClick = (id: string) => {
    setQuotationToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/quotations/${quotationToDelete}`);
      
      if (response.data.success) {
        setShowDeleteModal(false);
        setQuotationToDelete(null);
        // Refresh quotations list
        await fetchQuotations();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete quotation');
      console.error('Error deleting quotation:', err);
      setShowDeleteModal(false);
      setQuotationToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      // Close dropdown on scroll
      setOpenMenuId(null);
      setDropdownPosition(null);
    };

    const handleResize = () => {
      // Close dropdown on resize
      setOpenMenuId(null);
      setDropdownPosition(null);
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [openMenuId]);

  const toggleMenu = (id: string) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setDropdownPosition(null);
      return;
    }

    const button = buttonRefs.current[id];
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const dropdownHeight = 350; // Approximate height of dropdown menu with status actions
    const dropdownWidth = 224; // w-56 = 14rem = 224px
    const spacing = 8; // mt-2 = 0.5rem = 8px
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Determine if dropdown should open upward
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Calculate top position
    let top: number;
    if (openUpward) {
      top = rect.top - dropdownHeight - spacing;
      // Ensure it doesn't go above viewport
      if (top < 10) {
        top = 10;
      }
    } else {
      top = rect.bottom + spacing;
      // Ensure it doesn't go below viewport
      if (top + dropdownHeight > viewportHeight - 10) {
        top = viewportHeight - dropdownHeight - 10;
      }
    }

    // Calculate left position (align to right edge of button)
    let left = rect.right - dropdownWidth;
    // Ensure it doesn't go off-screen
    if (left < 10) {
      left = 10;
    }
    if (left + dropdownWidth > viewportWidth - 10) {
      left = viewportWidth - dropdownWidth - 10;
    }

    setDropdownPosition({ top, left, openUpward });
    setOpenMenuId(id);
  };

  const handleView = async (quotation: QuotationItem) => {
    try {
      const response = await api.get(`/quotations/${quotation._id}`);
      if (response.data.success) {
        setSelectedQuotationDetails(response.data.data);
        setShowViewDetails(true);
      }
    } catch (err: any) {
      console.error('Error fetching quotation details:', err);
      setError(err.response?.data?.message || 'Failed to fetch quotation details');
    }
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const handleCloseViewDetails = () => {
    setShowViewDetails(false);
    setSelectedQuotationDetails(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'sent':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'changes required':
      case 'changes_required':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'converted':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleStatusUpdate = async (quotationId: string, newStatus: string) => {
    try {
      setError('');
      const response = await api.patch(`/quotations/${quotationId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setSuccess(`Quotation status updated to ${newStatus}`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        
        // Refresh quotations list
        await fetchQuotations();
        // If viewing details, refresh that too
        if (showViewDetails && selectedQuotationDetails?._id === quotationId) {
          const detailsResponse = await api.get(`/quotations/${quotationId}`);
          if (detailsResponse.data.success) {
            setSelectedQuotationDetails(detailsResponse.data.data);
          }
        }
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const canEditQuotation = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'draft' || s === 'changes required' || s === 'changes_required' || !s;
  };

  const canDeleteQuotation = (status: string) => {
    const s = status?.toLowerCase();
    return s !== 'converted';
  };

  const canConvertToOrder = (status: string) => {
    return status?.toLowerCase() === 'approved';
  };

  const canMarkAsSent = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'draft' || s === 'changes required' || s === 'changes_required' || !s;
  };

  const canMarkAsApproved = (status: string) => {
    return status?.toLowerCase() === 'sent';
  };

  const canMarkAsRejected = (status: string) => {
    return status?.toLowerCase() === 'sent';
  };

  const canRequestChanges = (status: string) => {
    return status?.toLowerCase() === 'sent';
  };

  const handleEdit = async (quotation: QuotationItem) => {
    try {
      const response = await api.get(`/quotations/${quotation._id}`);
      if (response.data.success) {
        setQuotationToEdit(response.data.data);
        setShowModal(true);
      }
    } catch (err: any) {
      console.error('Error fetching quotation details:', err);
      setError(err.response?.data?.message || 'Failed to fetch quotation details');
    }
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  const handleDownloadPDF = async (quotation: QuotationItem) => {
    try {
      setLoading(true);
      
      // Fetch company settings
      const settingsResponse = await api.get('/settings');
      const companySettings = settingsResponse.data;
      
      // Fetch full quotation details
      const quotationResponse = await api.get(`/quotations/${quotation._id}`);
      const quotationDetails = quotationResponse.data;
      
      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Company Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34); // Green color
      doc.text(companySettings.companyName || 'Company Name', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      if (companySettings.tagline) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(companySettings.tagline, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      }
      
      // Company Contact Info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const contactInfo = [];
      if (companySettings.addressLine1) contactInfo.push(companySettings.addressLine1);
      if (companySettings.addressLine2) contactInfo.push(companySettings.addressLine2);
      if (companySettings.city || companySettings.state) {
        contactInfo.push(`${companySettings.city || ''}${companySettings.city && companySettings.state ? ', ' : ''}${companySettings.state || ''} ${companySettings.pincode || ''}`);
      }
      if (companySettings.phone) contactInfo.push(`Phone: ${companySettings.phone}`);
      if (companySettings.email) contactInfo.push(`Email: ${companySettings.email}`);
      if (companySettings.website) contactInfo.push(`Website: ${companySettings.website}`);
      if (companySettings.gstin) contactInfo.push(`GSTIN: ${companySettings.gstin}`);
      
      contactInfo.forEach((info) => {
        doc.text(info, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 4;
      });
      
      yPosition += 5;
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(0.5);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;
      
      // Document Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('QUOTATION', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Quotation Details - Two Columns
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const leftColX = 15;
      const rightColX = pageWidth / 2 + 10;
      
      // Left Column
      doc.setFont('helvetica', 'bold');
      doc.text('Quotation No:', leftColX, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(quotationDetails.quotationNumber || 'N/A', leftColX + 35, yPosition);
      
      // Right Column
      doc.setFont('helvetica', 'bold');
      doc.text('Date:', rightColX, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(quotationDetails.createdAt).toLocaleDateString('en-IN'), rightColX + 20, yPosition);
      yPosition += 6;
      
      // Customer Name
      doc.setFont('helvetica', 'bold');
      doc.text('Customer:', leftColX, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(quotationDetails.partyName || 'N/A', leftColX + 35, yPosition);
      
      // Status
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', rightColX, yPosition);
      doc.setFont('helvetica', 'normal');
      const statusColors: any = {
        Draft: [255, 193, 7],
        Sent: [33, 150, 243],
        Approved: [76, 175, 80],
        Rejected: [244, 67, 54],
        'Changes Required': [255, 152, 0],
        Converted: [156, 39, 176]
      };
      const statusColor = statusColors[quotationDetails.status || 'Draft'] || [100, 100, 100];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(quotationDetails.status || 'Draft', rightColX + 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      
      // Valid Until
      if (quotationDetails.validUntil) {
        doc.setFont('helvetica', 'bold');
        doc.text('Valid Until:', leftColX, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(quotationDetails.validUntil).toLocaleDateString('en-IN'), leftColX + 35, yPosition);
        yPosition += 6;
      }
      
      yPosition += 5;
      
      // Items Table
      const tableData: any[] = [];
      
      if (quotationDetails.items && quotationDetails.items.length > 0) {
        quotationDetails.items.forEach((item: any, index: number) => {
          // Main item row
          tableData.push([
            { content: item.itemName, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
            { content: item.quantity.toString(), styles: { halign: 'center', fillColor: [245, 245, 245] } },
            { content: `₹${(item.rate || 0).toFixed(2)}`, styles: { halign: 'right', fillColor: [245, 245, 245] } },
            { content: `${item.discount || 0}%`, styles: { halign: 'center', fillColor: [245, 245, 245] } },
            { content: `₹${(item.itemTotal || item.amount || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } }
          ]);
          
          // Process rows for this item
          if (item.processes && item.processes.length > 0) {
            item.processes.forEach((process: any) => {
              tableData.push([
                { content: `  ↳ ${process.processName}`, styles: { fontSize: 9, textColor: [80, 80, 80], fillColor: [230, 240, 255] } },
                { content: `${process.quantity || 1}`, styles: { halign: 'center', fontSize: 9, fillColor: [230, 240, 255] } },
                { content: `₹${(process.processCost || 0).toFixed(2)}`, styles: { halign: 'right', fontSize: 9, fillColor: [230, 240, 255] } },
                { content: '-', styles: { halign: 'center', fontSize: 9, fillColor: [230, 240, 255] } },
                { content: `₹${(process.processTotal || 0).toFixed(2)}`, styles: { halign: 'right', fontSize: 9, fillColor: [230, 240, 255] } }
              ]);
            });
          }
        });
      }
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Item Name', 'Qty', 'Rate', 'Disc.', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [34, 139, 34],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35, halign: 'right' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
      
      // Financial Summary
      const summaryX = pageWidth - 75;
      doc.setFontSize(10);
      
      // Base Amount
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', summaryX, yPosition);
      doc.text(`₹${(quotationDetails.baseAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
      
      // GST
      if (quotationDetails.gstPercent > 0) {
        doc.text(`GST (${quotationDetails.gstPercent}%):`, summaryX, yPosition);
        doc.text(`₹${(quotationDetails.totalTaxAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      // TDS
      if (quotationDetails.tdsPercent > 0) {
        doc.setTextColor(255, 0, 0);
        doc.text(`TDS (${quotationDetails.tdsPercent}%):`, summaryX, yPosition);
        doc.text(`-₹${(quotationDetails.tdsAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
      }
      
      // TCS
      if (quotationDetails.tcsPercent > 0) {
        doc.text(`TCS (${quotationDetails.tcsPercent}%):`, summaryX, yPosition);
        doc.text(`₹${(quotationDetails.tcsAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      // Remittance
      if (quotationDetails.remittanceCharges > 0) {
        doc.text('Remittance:', summaryX, yPosition);
        doc.text(`₹${quotationDetails.remittanceCharges.toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
        yPosition += 6;
      }
      
      // Total line
      yPosition += 2;
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(0.5);
      doc.line(summaryX, yPosition, pageWidth - 15, yPosition);
      yPosition += 6;
      
      // Grand Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('Total Amount:', summaryX, yPosition);
      doc.text(`₹${(quotationDetails.totalAmount || 0).toFixed(2)}`, pageWidth - 15, yPosition, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPosition += 10;
      
      // Payment Terms
      if (quotationDetails.paymentTerms) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Terms:', 15, yPosition);
        yPosition += 5;
        doc.setFont('helvetica', 'normal');
        const splitTerms = doc.splitTextToSize(quotationDetails.paymentTerms, pageWidth - 30);
        doc.text(splitTerms, 15, yPosition);
        yPosition += (splitTerms.length * 5);
      }
      
      // Footer Note
      if (companySettings.footerNote) {
        yPosition += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const splitFooter = doc.splitTextToSize(companySettings.footerNote, pageWidth - 30);
        doc.text(splitFooter, pageWidth / 2, yPosition, { align: 'center' });
      }
      
      // Bank Details (if available)
      if (companySettings.bankName && yPosition < pageHeight - 40) {
        yPosition += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Bank Details:', 15, yPosition);
        yPosition += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companySettings.bankName) {
          doc.text(`Bank: ${companySettings.bankName}`, 15, yPosition);
          yPosition += 4;
        }
        if (companySettings.accountNumber) {
          doc.text(`Account No: ${companySettings.accountNumber}`, 15, yPosition);
          yPosition += 4;
        }
        if (companySettings.ifsc) {
          doc.text(`IFSC: ${companySettings.ifsc}`, 15, yPosition);
          yPosition += 4;
        }
        if (companySettings.branch) {
          doc.text(`Branch: ${companySettings.branch}`, 15, yPosition);
        }
      }
      
      // Save PDF
      doc.save(`Quotation_${quotationDetails.quotationNumber}.pdf`);
      
      setSuccess('PDF downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
      setOpenMenuId(null);
      setDropdownPosition(null);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setError(error.response?.data?.message || 'Failed to generate PDF');
      setTimeout(() => setError(''), 5000);
      setLoading(false);
    }
  };

  const handleDelete = (quotation: QuotationItem) => {
    handleDeleteClick(quotation._id);
    setOpenMenuId(null);
    setDropdownPosition(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {!showModal && !showViewDetails && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quotation Management</h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">Create and manage customer quotations</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                <Filter size={18} />
                <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
              <button
                onClick={() => { 
                  setQuotationToEdit(null);
                  setShowModal(true); 
                }}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors flex-1 sm:flex-initial"
              >
                <Plus size={20} className="w-4 h-4 md:w-5 md:h-5" />
                <span>New Quotation</span>
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                <span className="font-semibold text-base">{success}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccess('')}
                className="text-green-600 hover:text-green-800 hover:bg-green-200 p-2 rounded-full transition-all duration-200 ml-4"
                aria-label="Close success message"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                <span className="font-semibold text-base">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 hover:bg-red-200 p-2 rounded-full transition-all duration-200 ml-4"
                aria-label="Close error message"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow-md animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setStatusFilter(newValue);
                      fetchQuotations({ status: newValue });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Changes Required">Changes Required</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRangeFilter.start}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      const newDateRange = { ...dateRangeFilter, start: newStartDate };
                      setDateRangeFilter(newDateRange);
                      fetchQuotations({ startDate: newStartDate, endDate: dateRangeFilter.end });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRangeFilter.end}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      const newDateRange = { ...dateRangeFilter, end: newEndDate };
                      setDateRangeFilter(newDateRange);
                      fetchQuotations({ startDate: dateRangeFilter.start, endDate: newEndDate });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => {
                      const newSearchValue = e.target.value;
                      setSearchFilter(newSearchValue);
                      // Clear previous timeout if user types again
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                      // Debounce search - only fetch after user stops typing
                      searchTimeoutRef.current = setTimeout(() => {
                        fetchQuotations({ search: newSearchValue });
                      }, 500);
                    }}
                    placeholder="Search by Quotation No or Party Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              {/* Clear All Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearAllFilters}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                >
                  <RotateCcw size={16} />
                  <span>Clear All Filters</span>
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900 ml-4 p-1 hover:bg-green-100 rounded transition-colors"
                aria-label="Close success message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 ml-4 p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Close error message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <div className="inline-block min-w-full align-middle px-3 md:px-0">
            <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quotation No</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Party Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No quotations found. Create your first quotation!
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {quotation.quotationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{quotation.partyName}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">₹{(quotation.receivableAmount || quotation.totalAmount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(quotation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {quotation.createdBy?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        quotation.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                        quotation.status?.toLowerCase() === 'sent' ? 'bg-blue-100 text-blue-700' :
                        quotation.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                        quotation.status?.toLowerCase() === 'converted' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {quotation.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        ref={(el) => { buttonRefs.current[quotation._id] = el; }}
                        onClick={() => toggleMenu(quotation._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="More actions"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
        </>
      )}

      {showModal && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <QuotationForm
            onClose={() => {
              setShowModal(false);
              setQuotationToEdit(null);
            }}
            onSuccess={() => {
              fetchQuotations();
              setShowModal(false);
              setQuotationToEdit(null);
            }}
            quotationToEdit={quotationToEdit}
          />
        </div>
      )}

      {/* View Quotation Details */}
      {showViewDetails && selectedQuotationDetails && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {/* Header with Status and Close Button */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-300">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quotation Details</h2>
                <span className={`inline-block px-4 py-1.5 text-sm font-semibold rounded-full border ${getStatusBadgeColor(selectedQuotationDetails.status || 'Draft')}`}>
                  {selectedQuotationDetails.status || 'Draft'}
                </span>
              </div>
              <button
                onClick={handleCloseViewDetails}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Changes Required Banner */}
            {(selectedQuotationDetails.status?.toLowerCase() === 'changes required' || 
              selectedQuotationDetails.status?.toLowerCase() === 'changes_required') && (
              <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-bold text-orange-900 mb-1">Changes Required</h3>
                    <p className="text-sm text-orange-800">
                      Customer has requested modifications to this quotation. Please review and make necessary changes, then mark as "Sent" again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <RefreshCw size={16} />
                Status Timeline
              </h3>
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Draft */}
                <div className={`flex flex-col items-center ${
                  selectedQuotationDetails.status?.toLowerCase() === 'draft' || !selectedQuotationDetails.status
                    ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    selectedQuotationDetails.status?.toLowerCase() === 'draft' || !selectedQuotationDetails.status
                      ? 'bg-yellow-500 border-yellow-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    1
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">Draft</span>
                  {selectedQuotationDetails.createdAt && (
                    <span className="text-xs text-gray-500">{new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

                {/* Sent */}
                <div className={`flex flex-col items-center ${
                  ['sent', 'approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
                    ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    ['sent', 'approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    2
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">Sent</span>
                </div>

                {/* Arrow */}
                <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

                {/* Approved/Rejected/Changes Required */}
                <div className={`flex flex-col items-center ${
                  ['approved', 'rejected', 'changes required', 'converted'].includes(selectedQuotationDetails.status?.toLowerCase())
                    ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted'
                      ? 'bg-green-500 border-green-600 text-white'
                      : selectedQuotationDetails.status?.toLowerCase() === 'rejected'
                      ? 'bg-red-500 border-red-600 text-white'
                      : selectedQuotationDetails.status?.toLowerCase() === 'changes required'
                      ? 'bg-orange-500 border-orange-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    {selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted' ? (
                      <CheckCircle size={16} />
                    ) : selectedQuotationDetails.status?.toLowerCase() === 'rejected' ? (
                      <XCircle size={16} />
                    ) : selectedQuotationDetails.status?.toLowerCase() === 'changes required' ? (
                      <AlertCircle size={16} />
                    ) : (
                      '3'
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 mt-1">
                    {selectedQuotationDetails.status?.toLowerCase() === 'approved' || selectedQuotationDetails.status?.toLowerCase() === 'converted'
                      ? 'Approved'
                      : selectedQuotationDetails.status?.toLowerCase() === 'rejected'
                      ? 'Rejected'
                      : selectedQuotationDetails.status?.toLowerCase() === 'changes required'
                      ? 'Changes Req.'
                      : 'Pending'}
                  </span>
                </div>

                {/* Arrow - Only if Approved */}
                {(selectedQuotationDetails.status?.toLowerCase() === 'approved' || 
                  selectedQuotationDetails.status?.toLowerCase() === 'converted') && (
                  <>
                    <div className="flex-1 min-w-[20px] h-0.5 bg-gray-300"></div>

                    {/* Converted */}
                    <div className={`flex flex-col items-center ${
                      selectedQuotationDetails.status?.toLowerCase() === 'converted'
                        ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        selectedQuotationDetails.status?.toLowerCase() === 'converted'
                          ? 'bg-purple-500 border-purple-600 text-white'
                          : 'bg-gray-200 border-gray-300 text-gray-500'
                      }`}>
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 mt-1">Converted</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quotation Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quotation Number</label>
                <p className="text-gray-900">{selectedQuotationDetails.quotationNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                <p className="text-gray-900">{selectedQuotationDetails.partyName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quote Date</label>
                <p className="text-gray-900">
                  {selectedQuotationDetails.quotationDate 
                    ? new Date(selectedQuotationDetails.quotationDate).toLocaleDateString() 
                    : new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                <p className="text-gray-900">
                  {selectedQuotationDetails.validUntil 
                    ? new Date(selectedQuotationDetails.validUntil).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Created By</label>
                <p className="text-gray-900">{selectedQuotationDetails.createdBy?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Created Date</label>
                <p className="text-gray-900">
                  {new Date(selectedQuotationDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Subject */}
            {selectedQuotationDetails.subject && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <p className="text-gray-900">{selectedQuotationDetails.subject}</p>
              </div>
            )}

            {/* Item List Table */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Items</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Item Name</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Discount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedQuotationDetails.items && selectedQuotationDetails.items.length > 0 ? (
                      selectedQuotationDetails.items.map((item: any, index: number) => (
                        <React.Fragment key={index}>
                          {/* Item Row */}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.itemName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              ₹{(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.discount || 0}%</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                              ₹{(item.itemTotal || item.subTotal || item.lineTotal || item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          
                          {/* Item Processes */}
                          {item.processes && item.processes.length > 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-2 bg-blue-50">
                                <div className="pl-6">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">Item Processes:</p>
                                  <table className="min-w-full">
                                    <thead>
                                      <tr className="border-b border-blue-200">
                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">Process Name</th>
                                        <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Cost (₹)</th>
                                        <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Quantity</th>
                                        <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">Total (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.processes.map((process: any, pIndex: number) => (
                                        <tr key={pIndex} className="border-b border-blue-100">
                                          <td className="px-2 py-2 text-xs text-gray-700">{process.processName || 'N/A'}</td>
                                          <td className="px-2 py-2 text-xs text-gray-700 text-right">
                                            ₹{(process.processCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-2 py-2 text-xs text-gray-700 text-right">{process.quantity || 1}</td>
                                          <td className="px-2 py-2 text-xs font-semibold text-gray-900 text-right">
                                            ₹{(process.processTotal || ((process.processCost || 0) * (process.quantity || 1))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : selectedQuotationDetails.processes && selectedQuotationDetails.processes.length > 0 ? (
                      selectedQuotationDetails.processes.map((process: any, _index: number) => (
                        <tr key={_index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{process.processName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{process.quantity || 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ₹{(process.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">0%</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ₹{((process.rate || 0) * (process.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 text-center">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Product Amount:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{(selectedQuotationDetails.itemTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {(selectedQuotationDetails.processTotal || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Process Charges:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.processTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded">
                  <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{(selectedQuotationDetails.subtotal || selectedQuotationDetails.totalSubTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedQuotationDetails.gstPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      GST ({selectedQuotationDetails.gstPercent}%):
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.gst || selectedQuotationDetails.totalTaxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(selectedQuotationDetails.packagingCost || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Packaging:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.packagingCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {(selectedQuotationDetails.transportCost || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Transport:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.transportCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Final Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{(selectedQuotationDetails.finalTotal || selectedQuotationDetails.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {selectedQuotationDetails.tdsPercent > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm font-medium">
                      TDS ({selectedQuotationDetails.tdsPercent}%):
                    </span>
                    <span className="text-sm font-semibold">
                      -₹{(selectedQuotationDetails.tdsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {selectedQuotationDetails.tcsPercent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      TCS ({selectedQuotationDetails.tcsPercent}%):
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(selectedQuotationDetails.tcsAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {selectedQuotationDetails.remittanceCharges > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="text-sm font-medium">Remittance Charges:</span>
                    <span className="text-sm font-semibold">
                      -₹{(selectedQuotationDetails.remittanceCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Notes */}
            {selectedQuotationDetails.customerNotes && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Notes</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedQuotationDetails.customerNotes}</p>
              </div>
            )}

            {/* Terms and Conditions */}
            {selectedQuotationDetails.termsAndConditions && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedQuotationDetails.termsAndConditions}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-300">
              <button
                onClick={handleCloseViewDetails}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu Portal */}
      {openMenuId && dropdownPosition && createPortal(
        <div
          ref={menuRef}
          className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="py-1">
            {(() => {
              const quotation = quotations.find(q => q._id === openMenuId);
              if (!quotation) return null;
              const status = quotation.status || 'Draft';

              return (
                <>
                  {/* View Details */}
                  <button
                    onClick={() => handleView(quotation)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                  >
                    <Eye size={16} className="text-blue-600 flex-shrink-0" />
                    <span>View Details</span>
                  </button>

                  {/* Edit - Only if editable */}
                  {canEditQuotation(status) && (
                    <button
                      onClick={() => handleEdit(quotation)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                    >
                      <Edit size={16} className="text-green-600 flex-shrink-0" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Download PDF */}
                  <button
                    onClick={() => handleDownloadPDF(quotation)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Download size={16} className="text-green-600 flex-shrink-0" />
                    <span>Download PDF</span>
                  </button>

                  {/* Status Actions Divider */}
                  <div className="border-t border-gray-200 my-1"></div>

                  {/* Mark as Sent */}
                  {canMarkAsSent(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Sent')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      <Send size={16} className="text-blue-600 flex-shrink-0" />
                      <span>Mark as Sent</span>
                    </button>
                  )}

                  {/* Mark as Approved */}
                  {canMarkAsApproved(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Approved')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                      <span>Mark as Approved</span>
                    </button>
                  )}

                  {/* Mark as Rejected */}
                  {canMarkAsRejected(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Rejected')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} className="text-red-600 flex-shrink-0" />
                      <span>Mark as Rejected</span>
                    </button>
                  )}

                  {/* Request Changes */}
                  {canRequestChanges(status) && (
                    <button
                      onClick={() => handleStatusUpdate(quotation._id, 'Changes Required')}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle size={16} className="text-orange-600 flex-shrink-0" />
                      <span>Request Changes</span>
                    </button>
                  )}

                  {/* Convert to Order */}
                  {canConvertToOrder(status) && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          alert('Convert to Sales Order feature - Coming soon!\nThis will create a new order from this approved quotation.');
                          setOpenMenuId(null);
                          setDropdownPosition(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={16} className="text-purple-600 flex-shrink-0" />
                        <span>Convert to Order</span>
                      </button>
                    </>
                  )}

                  {/* Delete - Only if allowed */}
                  {canDeleteQuotation(status) && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => handleDelete(quotation)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} className="flex-shrink-0" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuotationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}
