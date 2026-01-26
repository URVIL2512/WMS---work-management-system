import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Eye, Edit, Trash2, MoreVertical, X, Filter, RotateCcw, CheckCircle, Package, Truck, FileText, AlertCircle, XCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomerForm from '../components/CustomerForm';
import ItemForm from '../components/ItemForm';

// Date formatting utility - DD-MM-YYYY format
const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

interface Order {
  _id: string;
  orderId: string;
  soNumber: string;
  customerName: string;
  itemName: string;
  quantity: number;
  status: string;
  createdAt: string;
}

export default function Orders() {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number; openUpward: boolean } | null>(null);
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [orderForAction, setOrderForAction] = useState<any>(null);
  const [holdReason, setHoldReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [dispatchInfo, setDispatchInfo] = useState({
    vehicleNumber: '',
    lrNumber: '',
    driverName: '',
    dispatchDate: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Item Master state
  const [itemMasters, setItemMasters] = useState<any[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemSearch, setItemSearch] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState<boolean[]>([]);
  const [itemDropdownPositions, setItemDropdownPositions] = useState<{ [key: number]: { top: number; left: number; width: number } }>({});
  const itemDropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const itemInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Process Master state
  const [processMasters, setProcessMasters] = useState<any[]>([]);
  const [processSearch, setProcessSearch] = useState<{ [key: string]: string }>({});
  const [showProcessDropdown, setShowProcessDropdown] = useState<{ [key: string]: boolean }>({});
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Order items structure: items[] with processes[]
  interface OrderItem {
    itemId: string;
    itemName: string;
    quantity: number;
    rate: number;
    itemTotal: number;
    processes: Array<{
      processId: string;
      processName: string;
      rate: number;
      quantity: number;
      amount: number;
    }>;
  }

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [formData, setFormData] = useState({
    quotationId: '',
    // Legacy fields for backward compatibility
    customerName: '',
    contactNumber: '',
    email: '',
    itemName: '',
    itemDescription: '',
    quantity: 1,
    processes: [{ processName: '', rate: '', quantity: 1 }],
    gstPercent: 0,
    packagingCost: 0,
    transportCost: 0,
    totalAmount: 0,
    paymentTerms: '',
    deliveryDate: '',
    deliveryAddress: '',
    expectedDispatchDate: '',
    remarks: ''
  });
  
  const [selectedQuotationData, setSelectedQuotationData] = useState<any>(null);
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [soNumber, setSoNumber] = useState<string>('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch orders and approved quotations on component mount
  useEffect(() => {
    fetchOrders();
    fetchApprovedQuotations();
    fetchCustomers();
    fetchItemMasters();
    fetchProcessMasters();
    
    // Cleanup search timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch customers from Customer Master
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      if (response.data.success) {
        setCustomers(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  };

  // Fetch items from Item Master
  const fetchItemMasters = async () => {
    try {
      const response = await api.get('/items?status=Active');
      if (response.data.success) {
        setItemMasters(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
    }
  };

  // Fetch processes from Process Master
  const fetchProcessMasters = async () => {
    try {
      const response = await api.get('/masters/Process');
      if (response.data.success) {
        setProcessMasters(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching processes:', err);
    }
  };

  // Refresh approved quotations and calculate next SO number when modal opens
  useEffect(() => {
    if (showModal) {
      fetchApprovedQuotations();
      // Calculate next SO number from existing orders
      calculateNextSONumber();
      // Reset form state
      setSelectedCustomer(null);
      setCustomerSearch('');
      setOrderItems([]);
      setExpandedItems(new Set());
    }
  }, [showModal, orders]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        if (customerInputRef.current && !customerInputRef.current.contains(event.target as Node)) {
          setShowCustomerDropdown(false);
        }
      }
    };
    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomerDropdown]);

  // Close item dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      orderItems.forEach((_, itemIndex) => {
        const dropdownRef = itemDropdownRefs.current[itemIndex];
        const inputRef = itemInputRefs.current[itemIndex];
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
          if (inputRef && !inputRef.contains(event.target as Node)) {
            setShowItemDropdown(prev => {
              const updated = [...prev];
              updated[itemIndex] = false;
              return updated;
            });
          }
        }
      });
    };
    if (showItemDropdown.some(Boolean)) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showItemDropdown, orderItems]);

  const calculateNextSONumber = () => {
    if (orders.length === 0) {
      setSoNumber('SO00001');
      return;
    }

    // Find the maximum SO number
    let maxNumber = 0;
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

    const nextNumber = maxNumber + 1;
    setSoNumber(`SO${String(nextNumber).padStart(5, '0')}`);
  };

  const fetchApprovedQuotations = async () => {
    try {
      const response = await api.get('/quotations?approvedOnly=true');
      if (response.data.success) {
        const quotations = response.data.data || [];
        console.log('✅ Fetched approved quotations:', quotations.length, quotations);
        setApprovedQuotations(quotations);
      }
    } catch (err: any) {
      console.error('❌ Error fetching approved quotations:', err);
      setError(err.response?.data?.message || 'Failed to fetch approved quotations');
    }
  };

  // Customer handlers
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setCustomerSearch(customer.customerName || customer.name || '');
    setFormData(prev => ({
      ...prev,
      customerName: customer.customerName || customer.name || '',
      contactNumber: customer.mobile || customer.contactNumber || '',
      email: customer.email || ''
    }));
  };

  const handleCustomerFormSuccess = async (newCustomer?: any) => {
    if (newCustomer) {
      await fetchCustomers(); // Refresh customer list
      handleCustomerSelect(newCustomer); // Auto-select newly created customer
    }
    setShowAddCustomerModal(false);
  };

  // Item handlers
  const handleAddItem = () => {
    setOrderItems(prev => [...prev, {
      itemId: '',
      itemName: '',
      quantity: 1,
      rate: 0,
      itemTotal: 0,
      processes: []
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
    // Clean up dropdown state
    setItemSearch(prev => prev.filter((_, i) => i !== index));
    setShowItemDropdown(prev => prev.filter((_, i) => i !== index));
    setExpandedItems(prev => {
      const updated = new Set(prev);
      updated.delete(index);
      // Adjust indices for items after removed one
      const newSet = new Set<number>();
      updated.forEach(idx => {
        if (idx > index) {
          newSet.add(idx - 1);
        } else {
          newSet.add(idx);
        }
      });
      return newSet;
    });
  };

  const handleItemSelect = (itemIndex: number, item: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[itemIndex] = {
        itemId: item._id || item.itemId || '',
        itemName: item.itemName || item.name || '',
        quantity: updated[itemIndex]?.quantity || 1,
        rate: item.sellingPrice || 0,
        itemTotal: 0,
        processes: updated[itemIndex]?.processes || []
      };
      return updated;
    });
    // Close dropdown and update search
    setShowItemDropdown(prev => {
      const updated = [...prev];
      updated[itemIndex] = false;
      return updated;
    });
    setItemSearch(prev => {
      const updated = [...prev];
      updated[itemIndex] = item.itemName || item.name || '';
      return updated;
    });
    // Auto-expand item to show processes section
    setExpandedItems(prev => new Set([...prev, itemIndex]));
  };

  const handleItemFormSuccess = async (newItem?: any) => {
    if (newItem) {
      await fetchItemMasters(); // Refresh item list
      // Auto-select newly created item in the last added item row
      if (orderItems.length > 0) {
        const lastIndex = orderItems.length - 1;
        handleItemSelect(lastIndex, newItem);
      }
    }
    setShowAddItemModal(false);
  };

  // Process handlers
  const handleAddProcess = (itemIndex: number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      if (!updated[itemIndex].processes) {
        updated[itemIndex].processes = [];
      }
      updated[itemIndex].processes.push({
        processId: '', // Will be filtered out if empty before submission
        processName: '',
        rate: 0,
        quantity: 1,
        amount: 0
      });
      return updated;
    });
  };

  const handleRemoveProcess = (itemIndex: number, processIndex: number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[itemIndex].processes = updated[itemIndex].processes.filter((_, i) => i !== processIndex);
      // Recalculate item total
      updated[itemIndex].itemTotal = updated[itemIndex].processes.reduce((sum, p) => sum + (p.amount || 0), 0);
      return updated;
    });
  };

  const handleProcessSelect = (itemIndex: number, processIndex: number, process: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const selectedProcess = updated[itemIndex].processes[processIndex];
      updated[itemIndex].processes[processIndex] = {
        processId: process._id || '',
        processName: process.name || '',
        rate: selectedProcess?.rate || process.additionalFields?.rate || 0,
        quantity: selectedProcess?.quantity || 1,
        amount: (selectedProcess?.rate || process.additionalFields?.rate || 0) * (selectedProcess?.quantity || 1)
      };
      // Recalculate item total
      updated[itemIndex].itemTotal = updated[itemIndex].processes.reduce((sum, p) => sum + (p.amount || 0), 0);
      return updated;
    });
    // Close process dropdown and clear search
    const processKey = `${itemIndex}-${processIndex}`;
    setShowProcessDropdown(prev => ({ ...prev, [processKey]: false }));
    setProcessSearch(prev => {
      const newSearch = { ...prev };
      delete newSearch[processKey]; // Clear the search term
      return newSearch;
    });
  };

  const handleProcessChange = (itemIndex: number, processIndex: number, field: string, value: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[itemIndex].processes[processIndex] = {
        ...updated[itemIndex].processes[processIndex],
        [field]: value
      };
      // Recalculate process amount
      const process = updated[itemIndex].processes[processIndex];
      process.amount = (process.rate || 0) * (process.quantity || 1);
      // Recalculate item total
      updated[itemIndex].itemTotal = updated[itemIndex].processes.reduce((sum, p) => sum + (p.amount || 0), 0);
      return updated;
    });
  };

  const handleItemQuantityChange = (itemIndex: number, quantity: number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[itemIndex].quantity = quantity;
      return updated;
    });
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    const itemsTotal = orderItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    const gstAmount = itemsTotal * ((formData.gstPercent || 0) / 100);
    return itemsTotal + gstAmount + (formData.packagingCost || 0) + (formData.transportCost || 0);
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const name = customer.customerName || customer.name || '';
    const email = customer.email || '';
    const mobile = customer.mobile || customer.contactNumber || '';
    const searchLower = customerSearch.toLowerCase();
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) ||
           mobile.includes(customerSearch);
  });

  const handleQuotationSelect = async (quotationId: string) => {
    if (!quotationId) {
      setSelectedQuotationData(null);
      setFormData(prev => ({
        ...prev,
        quotationId: '',
        // Keep manual entry fields when clearing quotation
      }));
      return;
    }

    try {
      const response = await api.get(`/quotations/${quotationId}`);
      if (response.data.success) {
        const quotation = response.data.data;
        setSelectedQuotationData(quotation);
        setFormData(prev => ({
          ...prev,
          quotationId: quotationId,
          deliveryDate: quotation.deliveryDate ? new Date(quotation.deliveryDate).toISOString().split('T')[0] : prev.deliveryDate,
          deliveryAddress: quotation.deliveryAddress || prev.deliveryAddress,
          // Clear manual entry fields when quotation is selected
          customerName: '',
          contactNumber: '',
          email: '',
          itemName: '',
          itemDescription: '',
          quantity: 1,
          processes: [{ processName: '', rate: '', quantity: 1 }],
          gstPercent: 0,
          packagingCost: 0,
          transportCost: 0,
          totalAmount: 0,
          paymentTerms: ''
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quotation details');
      console.error('Error fetching quotation:', err);
    }
  };

  const handleLegacyAddProcess = () => {
    setFormData(prev => ({
      ...prev,
      processes: [...prev.processes, { processName: '', rate: '', quantity: 1 }]
    }));
  };

  const handleLegacyRemoveProcess = (index: number) => {
    setFormData(prev => ({
      ...prev,
      processes: prev.processes.filter((_, i) => i !== index)
    }));
  };

  const handleLegacyProcessChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const updatedProcesses = [...prev.processes];
      updatedProcesses[index] = {
        ...updatedProcesses[index],
        [field]: value
      };
      
      // Calculate total amount
      const processTotal = updatedProcesses.reduce((sum, p) => {
        const rate = parseFloat(p.rate.toString()) || 0;
        const qty = parseFloat(p.quantity?.toString() || '1') || 1;
        return sum + (rate * qty);
      }, 0);
      const gstAmount = processTotal * ((prev.gstPercent || 0) / 100);
      const totalAmount = processTotal + gstAmount + (prev.packagingCost || 0) + (prev.transportCost || 0);
      
      return {
        ...prev,
        processes: updatedProcesses,
        totalAmount: totalAmount
      };
    });
  };

  const handleCostChange = (field: string, value: number) => {
    setFormData(prev => {
      const processTotal = prev.processes.reduce((sum, p) => {
        const rate = parseFloat(p.rate.toString()) || 0;
        const qty = parseFloat(p.quantity?.toString() || '1') || 1;
        return sum + (rate * qty);
      }, 0);
      const gstAmount = processTotal * ((prev.gstPercent || 0) / 100);
      const totalAmount = processTotal + gstAmount + 
        (field === 'packagingCost' ? value : (prev.packagingCost || 0)) + 
        (field === 'transportCost' ? value : (prev.transportCost || 0));
      
      return {
        ...prev,
        [field]: value,
        totalAmount: totalAmount
      };
    });
  };

  const fetchOrders = async (overrides?: { status?: string; startDate?: string; endDate?: string; search?: string }) => {
    try {
      setLoading(true);
      setError('');
      let url = '/orders?';
      const params = new URLSearchParams();
      
      // Use override values if provided, otherwise use state values
      const currentStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const currentStartDate = overrides?.startDate !== undefined ? overrides.startDate : dateRangeFilter.start;
      const currentEndDate = overrides?.endDate !== undefined ? overrides.endDate : dateRangeFilter.end;
      const currentSearch = overrides?.search !== undefined ? overrides.search : searchFilter;
      
      if (currentStatus && currentStatus !== 'all') {
        // Ensure exact status value is sent (no encoding issues)
        const statusValue = currentStatus.trim();
        params.append('status', statusValue);
        console.log('🔍 [FRONTEND] Order Status Filter:', statusValue, 'Type:', typeof statusValue);
      }
      if (currentStartDate) {
        params.append('startDate', currentStartDate);
      }
      if (currentEndDate) {
        params.append('endDate', currentEndDate);
      }
      if (currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }
      
      url += params.toString();
      console.log('🔍 [FRONTEND] Fetching orders with URL:', url);
      const response = await api.get(url);
      if (response.data.success) {
        console.log('✅ [FRONTEND] Received', response.data.data.length, 'orders');
        setOrders(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
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
    fetchOrders({ status: 'all', startDate: '', endDate: '', search: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.deliveryDate) {
      setError('Delivery Date is required');
      return;
    }

    // Validate quotation-based order
    if (formData.quotationId) {
      if (!selectedQuotationData) {
        setError('Quotation data not loaded. Please select quotation again.');
        return;
      }

      if (selectedQuotationData.status !== 'Approved') {
        setError('Selected quotation must be Approved to create an order');
        return;
      }

      if (!selectedQuotationData.processes || selectedQuotationData.processes.length === 0) {
        setError('Quotation must have at least one process/item');
        return;
      }
    } else {
      // Validate NEW STRUCTURE: items[] with processes[]
      if (orderItems && orderItems.length > 0) {
        // New structure validation
        if (!selectedCustomer && !formData.customerName) {
          setError('Customer is required');
          return;
        }

        if (orderItems.length === 0) {
          setError('At least one item is required');
          return;
        }

        // Validate each item
        for (let i = 0; i < orderItems.length; i++) {
          const item = orderItems[i];
          if (!item.itemId && !item.itemName) {
            setError(`Item ${i + 1}: Item selection is required`);
            return;
          }

          if (!item.quantity || item.quantity < 1) {
            setError(`Item ${i + 1}: Quantity must be at least 1`);
            return;
          }

          if (!item.processes || item.processes.length === 0) {
            setError(`Item "${item.itemName || 'Unknown'}" must have at least one process`);
            return;
          }

          // Validate processes
          for (let j = 0; j < item.processes.length; j++) {
            const process = item.processes[j];
            if (!process.processName || process.processName.trim() === '') {
              setError(`Item ${i + 1}, Process ${j + 1}: Process name is required`);
              return;
            }

            if (process.rate === undefined || process.rate < 0) {
              setError(`Item ${i + 1}, Process ${j + 1}: Rate must be >= 0`);
              return;
            }

            if (!process.quantity || process.quantity < 1) {
              setError(`Item ${i + 1}, Process ${j + 1}: Quantity must be >= 1`);
              return;
            }
          }
        }
      } else {
        // Legacy structure validation
        if (!formData.customerName || formData.customerName.trim() === '') {
          setError('Customer Name is required');
          return;
        }

        if (!formData.itemName || formData.itemName.trim() === '') {
          setError('Item Name is required');
          return;
        }

        if (!formData.processes || formData.processes.length === 0) {
          setError('At least one process/item is required');
          return;
        }

        const validProcesses = formData.processes.filter(p => p.processName && p.processName.trim() !== '' && p.rate && parseFloat(p.rate.toString()) > 0);
        if (validProcesses.length === 0) {
          setError('At least one process with a valid rate is required');
          return;
        }
      }
    }
    
    try {
      setLoading(true);
      const payload: any = {
        deliveryDate: formData.deliveryDate,
        deliveryAddress: formData.deliveryAddress,
        expectedDispatchDate: formData.expectedDispatchDate || undefined,
        remarks: formData.remarks
      };

      // Include SO number if provided
      if (soNumber && soNumber.trim() !== '') {
        payload.soNumber = soNumber.trim();
      }

      // Handle quotation-based order
      if (formData.quotationId) {
        payload.quotationId = formData.quotationId;
      } else if (orderItems && orderItems.length > 0) {
        // NEW STRUCTURE: items[] with processes[]
        payload.customerId = selectedCustomer?._id || null;
        payload.customerName = selectedCustomer?.customerName || selectedCustomer?.name || formData.customerName;
        payload.contactNumber = selectedCustomer?.mobile || selectedCustomer?.contactNumber || formData.contactNumber || undefined;
        payload.email = selectedCustomer?.email || formData.email || undefined;
        payload.items = orderItems.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate,
          itemTotal: item.itemTotal,
          processes: item.processes.map(p => {
            const process: any = {
              processName: p.processName,
              rate: p.rate,
              quantity: p.quantity,
              amount: p.amount
            };
            // Only include processId if it's not empty
            if (p.processId && p.processId.trim()) {
              process.processId = p.processId;
            }
            return process;
          })
        }));
        payload.gstPercent = formData.gstPercent || 0;
        payload.packagingCost = formData.packagingCost || 0;
        payload.transportCost = formData.transportCost || 0;
        payload.totalAmount = calculateOrderTotal();
        payload.paymentTerms = formData.paymentTerms || undefined;
      } else {
        // Legacy structure: single item with processes
        payload.customerName = formData.customerName;
        payload.contactNumber = formData.contactNumber || undefined;
        payload.email = formData.email || undefined;
        payload.itemName = formData.itemName;
        payload.itemDescription = formData.itemDescription || undefined;
        payload.quantity = formData.quantity;
        payload.processes = formData.processes.filter(p => p.processName && p.rate);
        payload.gstPercent = formData.gstPercent || 0;
        payload.packagingCost = formData.packagingCost || 0;
        payload.transportCost = formData.transportCost || 0;
        payload.totalAmount = formData.totalAmount || 0;
        payload.paymentTerms = formData.paymentTerms || undefined;
      }

      const response = await api.post('/orders', payload);

      if (response.data.success) {
        const createdOrder = response.data.data;
        setSuccess('Order created successfully!');
        // Update SO number preview with the actual generated number
        if (createdOrder.soNumber) {
          setSoNumber(createdOrder.soNumber);
        }
        // Clear form
        setShowModal(false);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setOrderItems([]);
        setFormData({
          quotationId: '',
          customerName: '',
          contactNumber: '',
          email: '',
          itemName: '',
          itemDescription: '',
          quantity: 1,
          processes: [{ processName: '', rate: '', quantity: 1 }],
          gstPercent: 0,
          packagingCost: 0,
          transportCost: 0,
          totalAmount: 0,
          paymentTerms: '',
          deliveryDate: '',
          deliveryAddress: '',
          expectedDispatchDate: '',
          remarks: ''
        });
        setSelectedQuotationData(null);
        // Refresh orders list and quotations list
        await fetchOrders();
        await fetchApprovedQuotations();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
      console.error('Error creating order:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dropdown position and handle opening
  const handleMenuToggle = (orderId: string) => {
    if (openMenuId === orderId) {
      // Close menu
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      // Open menu
      const button = menuButtonRefs.current[orderId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 200; // Approximate height of dropdown
        const spacing = 8; // mt-2 spacing
        
        // Check if should open upward
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        // Calculate horizontal position (right-aligned)
        const right = viewportWidth - rect.right;
        
        // Calculate vertical position
        const top = openUpward 
          ? rect.top - dropdownHeight - spacing
          : rect.bottom + spacing;
        
        setOpenMenuId(orderId);
        setMenuPosition({
          top: Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8)), // Keep within viewport
          right: Math.max(8, right), // Keep within viewport
          openUpward
        });
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuPosition) {
        const target = event.target as HTMLElement;
        // Check if click is outside the dropdown menu
        if (!target.closest('[data-dropdown-menu]') && !target.closest('[data-menu-button]')) {
          setOpenMenuId(null);
          setMenuPosition(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [openMenuId, menuPosition]);

  const handleViewClick = async (id: string) => {
    try {
      const response = await api.get(`/orders/${id}`);
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setShowViewModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
      console.error('Error fetching order:', err);
    }
  };

  const handleEditClick = async (id: string) => {
    try {
      const response = await api.get(`/orders/${id}`);
      if (response.data.success) {
        const order = response.data.data;
        setSelectedOrder(order);
        setFormData({
          quotationId: order.quotationId || '',
          customerName: order.customerName || '',
          contactNumber: order.contactNumber || '',
          email: order.email || '',
          itemName: order.itemName || '',
          itemDescription: order.itemDescription || '',
          quantity: order.quantity || 1,
          processes: order.processes || [{ processName: '', rate: '', quantity: 1 }],
          gstPercent: order.gstPercent || 0,
          packagingCost: order.packagingCost || 0,
          transportCost: order.transportCost || 0,
          totalAmount: order.totalAmount || 0,
          paymentTerms: order.paymentTerms || '',
          deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
          deliveryAddress: order.deliveryAddress || '',
          expectedDispatchDate: order.expectedDispatchDate ? new Date(order.expectedDispatchDate).toISOString().split('T')[0] : '',
          remarks: order.remarks || ''
        });
        // Fetch quotation data if quotationId exists
        if (order.quotationId) {
          try {
            const quotationResponse = await api.get(`/quotations/${order.quotationId}`);
            if (quotationResponse.data.success) {
              setSelectedQuotationData(quotationResponse.data.data);
            }
          } catch (err) {
            console.error('Error fetching quotation:', err);
          }
        }
        setShowEditModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
      console.error('Error fetching order:', err);
    }
  };

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/orders/${orderToDelete}`);
      
      if (response.data.success) {
        setShowDeleteModal(false);
        setOrderToDelete(null);
        // Refresh orders list
        await fetchOrders();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete order');
      console.error('Error deleting order:', err);
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // Status action handlers
  const handleConfirmOrder = async (orderId: string) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderId}/confirm`);
      if (response.data.success) {
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePutOnHold = async () => {
    if (!orderForAction || !holdReason.trim()) {
      setError('Hold reason is required');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderForAction._id}/hold`, { reason: holdReason });
      if (response.data.success) {
        setShowHoldModal(false);
        setOrderForAction(null);
        setHoldReason('');
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to put order on hold');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderForAction || !cancelReason.trim()) {
      setError('Cancel reason is required');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderForAction._id}/cancel`, { reason: cancelReason });
      if (response.data.success) {
        setShowCancelModal(false);
        setOrderForAction(null);
        setCancelReason('');
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderId}/deliver`);
      if (response.data.success) {
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark order as delivered');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseOrder = async (orderId: string) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderId}/status`, { status: 'Closed' });
      if (response.data.success) {
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to close order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchOrder = async () => {
    if (!orderForAction || !dispatchInfo.vehicleNumber || !dispatchInfo.lrNumber || !dispatchInfo.driverName) {
      setError('Vehicle number, LR number, and driver name are required');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderForAction._id}/dispatch`, {
        dispatchInfo: {
          ...dispatchInfo,
          dispatchDate: dispatchInfo.dispatchDate || new Date().toISOString().split('T')[0]
        }
      });
      if (response.data.success) {
        setShowDispatchModal(false);
        setOrderForAction(null);
        setDispatchInfo({ vehicleNumber: '', lrNumber: '', driverName: '', dispatchDate: '' });
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeOrder = async (orderId: string, resumeStatus: string) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/orders/${orderId}/status`, { status: resumeStatus });
      if (response.data.success) {
        await fetchOrders();
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resume order');
    } finally {
      setActionLoading(false);
    }
  };

  // Check if order can be edited
  const canEdit = (status: string) => {
    return status === 'Open' || status === 'Confirmed';
  };

  // Get status-specific action buttons
  const getStatusActions = (order: any) => {
    const actions = [];
    const status = order.status;

    // View is always available
    actions.push(
      <button
        key="view"
        onClick={() => {
          handleViewClick(order._id);
          setOpenMenuId(null);
          setMenuPosition(null);
        }}
        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
      >
        <Eye size={18} className="text-blue-600" />
        <span>View</span>
      </button>
    );

    // Edit (only for Open/Confirmed)
    if (canEdit(status)) {
      actions.push(
        <button
          key="edit"
          onClick={() => {
            handleEditClick(order._id);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <Edit size={18} className="text-green-600" />
          <span>Edit</span>
        </button>
      );
    }

    // Status-specific actions
    if (status === 'Open') {
      actions.push(
        <button
          key="confirm"
          onClick={() => {
            handleConfirmOrder(order._id);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          disabled={actionLoading}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition-colors border-b border-gray-100 disabled:opacity-50"
        >
          <CheckCircle size={18} className="text-purple-600" />
          <span>Confirm Order</span>
        </button>
      );
      actions.push(
        <button
          key="hold"
          onClick={() => {
            setOrderForAction(order);
            setShowHoldModal(true);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <AlertCircle size={18} className="text-orange-600" />
          <span>Put On Hold</span>
        </button>
      );
      actions.push(
        <button
          key="cancel"
          onClick={() => {
            setOrderForAction(order);
            setShowCancelModal(true);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <XCircle size={18} className="text-red-600" />
          <span>Cancel</span>
        </button>
      );
    }

    if (status === 'Confirmed') {
      actions.push(
        <button
          key="hold"
          onClick={() => {
            setOrderForAction(order);
            setShowHoldModal(true);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <AlertCircle size={18} className="text-orange-600" />
          <span>Put On Hold</span>
        </button>
      );
      actions.push(
        <button
          key="cancel"
          onClick={() => {
            setOrderForAction(order);
            setShowCancelModal(true);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <XCircle size={18} className="text-red-600" />
          <span>Cancel</span>
        </button>
      );
    }

    if (status === 'In Production') {
      actions.push(
        <button
          key="hold"
          onClick={() => {
            setOrderForAction(order);
            setShowHoldModal(true);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <AlertCircle size={18} className="text-orange-600" />
          <span>Put On Hold</span>
        </button>
      );
      // Note: Production modules (Job Cards, Job Work, Inspection) are accessed via their respective pages
      // These buttons would navigate to those pages filtered by orderId
    }

    if (status === 'Ready For Dispatch') {
      actions.push(
        <button
          key="dispatch"
          onClick={() => {
            setOrderForAction(order);
            setShowDispatchModal(true);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <Truck size={18} className="text-indigo-600" />
          <span>Dispatch Order</span>
        </button>
      );
      actions.push(
        <button
          key="invoice"
          onClick={() => {
            // TODO: Navigate to invoice generation
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors border-b border-gray-100"
        >
          <FileText size={18} className="text-teal-600" />
          <span>Generate Invoice</span>
        </button>
      );
    }

    if (status === 'Dispatched') {
      actions.push(
        <button
          key="delivered"
          onClick={() => {
            handleMarkDelivered(order._id);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          disabled={actionLoading}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors border-b border-gray-100 disabled:opacity-50"
        >
          <Package size={18} className="text-green-600" />
          <span>Mark Delivered</span>
        </button>
      );
    }

    if (status === 'Delivered') {
      actions.push(
        <button
          key="close"
          onClick={() => {
            handleCloseOrder(order._id);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          disabled={actionLoading}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-gray-700 flex items-center gap-3 transition-colors border-b border-gray-100 disabled:opacity-50"
        >
          <CheckCircle size={18} className="text-gray-600" />
          <span>Close Order</span>
        </button>
      );
    }

    // Resume from On Hold
    if (status === 'On Hold') {
      // Determine previous status from statusHistory or default to Open
      const previousStatus = order.statusHistory && order.statusHistory.length > 0 
        ? order.statusHistory[order.statusHistory.length - 2]?.status || 'Open'
        : 'Open';
      
      actions.push(
        <button
          key="resume"
          onClick={() => {
            // Resume to previous status or Open if unknown
            const resumeStatus = previousStatus === 'Open' || previousStatus === 'Confirmed' || previousStatus === 'In Production'
              ? previousStatus
              : 'Open';
            handleResumeOrder(order._id, resumeStatus);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          disabled={actionLoading}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors border-b border-gray-100 disabled:opacity-50"
        >
          <CheckCircle size={18} className="text-green-600" />
          <span>Resume Order</span>
        </button>
      );
    }

    // Delete (only for Open/Confirmed/Cancelled)
    if (status === 'Open' || status === 'Confirmed' || status === 'Cancelled') {
      actions.push(
        <button
          key="delete"
          onClick={() => {
            handleDeleteClick(order._id);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
        >
          <Trash2 size={18} className="text-red-600" />
          <span>Delete</span>
        </button>
      );
    }

    return actions;
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setError('');
    setSuccess('');
    
    try {
      setLoading(true);
      const response = await api.put(`/orders/${selectedOrder._id}`, {
        deliveryDate: formData.deliveryDate,
        deliveryAddress: formData.deliveryAddress,
        expectedDispatchDate: formData.expectedDispatchDate || undefined,
        remarks: formData.remarks
      });

      if (response.data.success) {
        setSuccess('Order updated successfully!');
        setShowEditModal(false);
        setSelectedOrder(null);
        setSelectedQuotationData(null);
        setFormData({
          quotationId: '',
          customerName: '',
          contactNumber: '',
          email: '',
          itemName: '',
          itemDescription: '',
          quantity: 1,
          processes: [{ processName: '', rate: '', quantity: 1 }],
          gstPercent: 0,
          packagingCost: 0,
          transportCost: 0,
          totalAmount: 0,
          paymentTerms: '',
          deliveryDate: '',
          deliveryAddress: '',
          expectedDispatchDate: '',
          remarks: ''
        });
        // Refresh orders list
        await fetchOrders();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order');
      console.error('Error updating order:', err);
    } finally {
      setLoading(false);
    }
  };

  // Main return with conditional rendering
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Create/Edit Order Form - Only shown when showModal or showEditModal is true */}
      {(showModal || showEditModal) && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={showModal ? handleSubmit : handleUpdateSubmit} className="p-6">
          {success && (
            <div className="mb-2 bg-green-50 border-2 border-green-300 text-green-700 px-3 py-2 rounded-lg flex items-center justify-between">
              <span>{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900 ml-2 p-1 hover:bg-green-100 rounded transition-colors"
                aria-label="Close success message"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="mb-2 bg-red-50 border-2 border-red-300 text-red-700 px-3 py-2 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Close error message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Single Column Layout */}
          <div className="space-y-3 max-w-full">
            {/* Page Title */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {showEditModal ? 'Edit Order' : 'Create New Order'}
              </h2>
              <button
                onClick={() => {
                  if (showModal) {
                    setShowModal(false);
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                    setOrderItems([]);
                    setFormData({
                      quotationId: '',
                      customerName: '',
                      contactNumber: '',
                      email: '',
                      itemName: '',
                      itemDescription: '',
                      quantity: 1,
                      processes: [{ processName: '', rate: '', quantity: 1 }],
                      gstPercent: 0,
                      packagingCost: 0,
                      transportCost: 0,
                      totalAmount: 0,
                      paymentTerms: '',
                      deliveryDate: '',
                      deliveryAddress: '',
                      expectedDispatchDate: '',
                      remarks: ''
                    });
                  }
                  if (showEditModal) {
                    setShowEditModal(false);
                    setSelectedOrder(null);
                  }
                }}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form content starts here */}
            {/* TOP SECTION */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Order Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sales Order No</label>
                  <input
                    type="text"
                    value={soNumber}
                    onChange={(e) => setSoNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter Sales Order No"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order Date</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quotation No</label>
                  <input
                    type="text"
                    value={selectedQuotationData?.quotationNumber || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* QUOTATION SELECTION */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Approved Quotation <span className="text-gray-500 text-xs">(Optional - Leave blank to create order manually)</span>
              </label>
              <select
                value={formData.quotationId}
                onChange={(e) => handleQuotationSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select Approved Quotation (Optional) --</option>
                {approvedQuotations.map((quotation) => (
                  <option key={quotation._id} value={quotation._id}>
                    {quotation.quotationNumber} - {quotation.partyName}
                  </option>
                ))}
              </select>
              {approvedQuotations.length === 0 && !formData.quotationId && (
                <p className="text-sm text-gray-500 mt-1">No approved quotations available. You can create order manually below.</p>
              )}
            </div>

            {/* CUSTOMER SECTION - From Quotation */}
            {selectedQuotationData && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={selectedQuotationData.partyName || ''}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="text"
                        value={selectedQuotationData.contactNumber || ''}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* ITEM SECTION */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Item & Pricing</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Process</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Rate (₹)</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedQuotationData.processes && selectedQuotationData.processes.length > 0 ? (
                          selectedQuotationData.processes.map((process: any, index: number) => {
                            const quantity = process.quantity || 1;
                            const rate = process.rate || 0;
                            const amount = rate * quantity;
                            return (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900 font-medium">{process.processName || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{process.description || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{rate.toLocaleString() || '0'}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">{amount.toLocaleString() || '0'}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 text-center">No processes found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOTAL SECTION */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Total Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Sub Total</label>
                      <input
                        type="text"
                        value={`₹${(() => {
                          const processesTotal = selectedQuotationData.processes?.reduce((sum: number, p: any) => sum + (p.rate || 0), 0) || 0;
                          return processesTotal.toLocaleString();
                        })()}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">GST ({selectedQuotationData.gstPercent || 0}%)</label>
                      <input
                        type="text"
                        value={`₹${((selectedQuotationData.totalAmount * (selectedQuotationData.gstPercent || 0)) / 100).toLocaleString()}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Packaging Cost</label>
                      <input
                        type="text"
                        value={`₹${(selectedQuotationData.packagingCost || 0).toLocaleString()}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Cost</label>
                      <input
                        type="text"
                        value={`₹${(selectedQuotationData.transportCost || 0).toLocaleString()}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Final Total</label>
                      <input
                        type="text"
                        value={`₹${(selectedQuotationData.totalAmount || 0).toLocaleString()}`}
                        readOnly
                        className="w-full px-4 py-2 border-2 border-green-500 rounded-lg bg-green-50 text-green-900 font-bold text-lg cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={selectedQuotationData.paymentTerms || 'N/A'}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* MANUAL ENTRY SECTION - When no quotation is selected */}
            {!selectedQuotationData && (
              <>
                {/* CUSTOMER DROPDOWN */}
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Information</h3>
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={customerInputRef}
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Search customer..."
                        required={!formData.quotationId}
                      />
                      {showCustomerDropdown && (
                        <div
                          ref={customerDropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                        >
                          {filteredCustomers.length > 0 ? (
                            <>
                              {filteredCustomers.map((customer) => (
                                <button
                                  key={customer._id}
                                  type="button"
                                  onClick={() => handleCustomerSelect(customer)}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 transition-colors"
                                >
                                  <div className="font-medium text-gray-900">{customer.customerName || customer.name}</div>
                                  {customer.email && (
                                    <div className="text-sm text-gray-500">{customer.email}</div>
                                  )}
                                </button>
                              ))}
                              <div className="border-t border-gray-200 p-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowCustomerDropdown(false);
                                    setShowAddCustomerModal(true);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                                >
                                  <Plus size={18} />
                                  Add New Customer
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              <div className="mb-2">No customers found</div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowCustomerDropdown(false);
                                  setShowAddCustomerModal(true);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold mx-auto"
                              >
                                <Plus size={18} />
                                Add New Customer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ITEMS TABLE WITH PROCESSES */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Items <span className="text-red-500">*</span></h3>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all font-bold flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Plus size={18} />
                      Add New Item
                    </button>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No items added. Click "Add New Item" to start.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orderItems.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                          {/* Item Header Badge */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-300">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-bold text-sm">
                                {itemIndex + 1}
                              </span>
                              <span className="font-bold text-gray-900 text-lg">
                                {item.itemName || 'New Item'}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              ₹{item.itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Item Row */}
                          <div className="grid grid-cols-12 gap-4 items-start mb-4">
                            <div className="col-span-12 md:col-span-4">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Item Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  ref={(el) => { itemInputRefs.current[itemIndex] = el; }}
                                  type="text"
                                  value={itemSearch[itemIndex] || ''}
                                  onChange={(e) => {
                                    const newSearch = [...itemSearch];
                                    newSearch[itemIndex] = e.target.value;
                                    setItemSearch(newSearch);
                                    const newShow = [...showItemDropdown];
                                    newShow[itemIndex] = true;
                                    setShowItemDropdown(newShow);
                                  }}
                                  onFocus={() => {
                                    const newShow = [...showItemDropdown];
                                    newShow[itemIndex] = true;
                                    setShowItemDropdown(newShow);
                                  }}
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="Search item..."
                                  required
                                />
                                {showItemDropdown[itemIndex] && (
                                  <div
                                    ref={(el) => { itemDropdownRefs.current[itemIndex] = el; }}
                                    className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                                  >
                                    {itemMasters
                                      .filter((im) => im.status === 'Active')
                                      .filter((im) => 
                                        !itemSearch[itemIndex] || 
                                        (im.name && im.name.toLowerCase().includes(itemSearch[itemIndex].toLowerCase()))
                                      )
                                      .map((im) => (
                                        <button
                                          key={im._id}
                                          type="button"
                                          onClick={() => handleItemSelect(itemIndex, im)}
                                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 transition-colors"
                                        >
                                          <div className="font-medium text-gray-900">{im.name || 'Unnamed Item'}</div>
                                          <div className="text-sm text-gray-500">
                                            ₹{im.sellingPrice?.toLocaleString() || '0'} / {im.unitOfMeasure || 'PCS'}
                                          </div>
                                        </button>
                                      ))}
                                    <div className="border-t border-gray-200 p-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const newShow = [...showItemDropdown];
                                          newShow[itemIndex] = false;
                                          setShowItemDropdown(newShow);
                                          setShowAddItemModal(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                                      >
                                        <Plus size={18} />
                                        Add New Item
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Rate (₹)</label>
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleItemQuantityChange(itemIndex, parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemQuantityChange(itemIndex, parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                                min="1"
                              />
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Total</label>
                              <input
                                type="text"
                                value={`₹${item.itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-right font-semibold"
                              />
                            </div>
                            <div className="col-span-12 md:col-span-2 flex items-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(itemIndex)}
                                className="w-full px-4 py-2 bg-red-100 text-red-700 border-2 border-red-300 rounded-lg hover:bg-red-200 hover:border-red-400 transition-colors font-semibold"
                              >
                                <X size={18} className="inline mr-1" />
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Processes Section - Expandable */}
                          <div className="border-t-2 border-gray-300 pt-4 mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                const newExpanded = new Set(expandedItems);
                                if (newExpanded.has(itemIndex)) {
                                  newExpanded.delete(itemIndex);
                                } else {
                                  newExpanded.add(itemIndex);
                                }
                                setExpandedItems(newExpanded);
                              }}
                              className="w-full flex items-center justify-between text-sm font-bold text-gray-800 hover:text-green-600 mb-3 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <Package size={16} />
                                Processes ({item.processes.length})
                              </span>
                              {expandedItems.has(itemIndex) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {expandedItems.has(itemIndex) && (
                              <div className="space-y-3 mt-3">
                                {item.processes.map((process, processIndex) => (
                                  <div key={processIndex} className="grid grid-cols-12 gap-4 items-center bg-white border border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <div className="col-span-12 md:col-span-4">
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Process Name</label>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={process.processName || ''}
                                          onChange={(e) => {
                                            // Update the actual process name
                                            handleProcessChange(itemIndex, processIndex, 'processName', e.target.value);
                                            // Show dropdown for suggestions
                                            const newShow = { ...showProcessDropdown };
                                            newShow[`${itemIndex}-${processIndex}`] = true;
                                            setShowProcessDropdown(newShow);
                                          }}
                                          onFocus={() => {
                                            // Show dropdown
                                            const newShow = { ...showProcessDropdown };
                                            newShow[`${itemIndex}-${processIndex}`] = true;
                                            setShowProcessDropdown(newShow);
                                          }}
                                          onBlur={() => {
                                            // Close dropdown after a short delay to allow click on dropdown items
                                            setTimeout(() => {
                                              const newShow = { ...showProcessDropdown };
                                              newShow[`${itemIndex}-${processIndex}`] = false;
                                              setShowProcessDropdown(newShow);
                                            }, 200);
                                          }}
                                          className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                          placeholder="Type or search process..."
                                        />
                                        {showProcessDropdown[`${itemIndex}-${processIndex}`] && (
                                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {processMasters
                                              .filter((pm) => 
                                                !process.processName || 
                                                (pm.name && pm.name.toLowerCase().includes(process.processName.toLowerCase()))
                                              )
                                              .map((pm) => (
                                                <button
                                                  key={pm._id}
                                                  type="button"
                                                  onClick={() => handleProcessSelect(itemIndex, processIndex, pm)}
                                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 transition-colors text-sm"
                                                >
                                                  {pm.name || 'Unnamed Process'}
                                                </button>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Rate (₹)</label>
                                      <input
                                        type="number"
                                        value={process.rate}
                                        onChange={(e) => handleProcessChange(itemIndex, processIndex, 'rate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right text-sm"
                                        min="0"
                                        step="0.01"
                                      />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                                      <input
                                        type="number"
                                        value={process.quantity}
                                        onChange={(e) => handleProcessChange(itemIndex, processIndex, 'quantity', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right text-sm"
                                        min="1"
                                      />
                                    </div>
                                    <div className="col-span-12 md:col-span-2">
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Amount</label>
                                      <input
                                        type="text"
                                        value={`₹${process.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        readOnly
                                        className="w-full px-3 py-1 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-right text-sm font-semibold"
                                      />
                                    </div>
                                    <div className="col-span-12 md:col-span-2 flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveProcess(itemIndex, processIndex)}
                                        className="w-full px-3 py-1 bg-red-50 text-red-600 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-colors text-sm font-semibold"
                                      >
                                        <X size={16} className="inline mr-1" />
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddProcess(itemIndex)}
                                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                  <Plus size={18} />
                                  Add Process
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PRICING & TAX */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Pricing & Tax</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GST %</label>
                      <input
                        type="number"
                        value={formData.gstPercent}
                        onChange={(e) => {
                          const gst = parseFloat(e.target.value) || 0;
                          setFormData(prev => {
                            const itemsTotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
                            const gstAmount = itemsTotal * (gst / 100);
                            const totalAmount = itemsTotal + gstAmount + (prev.packagingCost || 0) + (prev.transportCost || 0);
                            return { ...prev, gstPercent: gst, totalAmount };
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        max="28"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Packaging Cost (₹)</label>
                      <input
                        type="number"
                        value={formData.packagingCost}
                        onChange={(e) => handleCostChange('packagingCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Cost (₹)</label>
                      <input
                        type="number"
                        value={formData.transportCost}
                        onChange={(e) => handleCostChange('transportCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter payment terms (optional)"
                    />
                  </div>
                </div>

                {/* TOTAL SUMMARY */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Total Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Sub Total</label>
                      <input
                        type="text"
                        value={`₹${(() => {
                          const itemsTotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
                          return itemsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">GST ({formData.gstPercent}%)</label>
                      <input
                        type="text"
                        value={`₹${(() => {
                          const itemsTotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
                          const gstAmount = itemsTotal * ((formData.gstPercent || 0) / 100);
                          return gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Packaging Cost</label>
                      <input
                        type="text"
                        value={`₹${(formData.packagingCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Cost</label>
                      <input
                        type="text"
                        value={`₹${(formData.transportCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Final Total</label>
                      <input
                        type="text"
                        value={`₹${(formData.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        readOnly
                        className="w-full px-4 py-2 border-2 border-green-500 rounded-lg bg-green-50 text-green-900 font-bold text-lg cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

              {/* DELIVERY SECTION */}
            <div className="bg-yellow-50 p-4 rounded-lg space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Delivery Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Dispatch Date</label>
                  <input
                    type="date"
                    value={formData.expectedDispatchDate}
                    onChange={(e) => setFormData({ ...formData, expectedDispatchDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter delivery address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Additional remarks or notes"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-4 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (showEditModal ? 'Updating Order...' : 'Creating Order...') : (showEditModal ? 'Update Order' : 'Create Order')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showModal) {
                    setShowModal(false);
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                    setOrderItems([]);
                    setFormData({
                      quotationId: '',
                      customerName: '',
                      contactNumber: '',
                      email: '',
                      itemName: '',
                      itemDescription: '',
                      quantity: 1,
                      processes: [{ processName: '', rate: '', quantity: 1 }],
                      gstPercent: 0,
                      packagingCost: 0,
                      transportCost: 0,
                      totalAmount: 0,
                      paymentTerms: '',
                      deliveryDate: '',
                      deliveryAddress: '',
                      expectedDispatchDate: '',
                      remarks: ''
                    });
                  }
                  if (showEditModal) {
                    setShowEditModal(false);
                    setSelectedOrder(null);
                  }
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </form>
        </div>
      )}

      {/* Orders List View - Only shown when BOTH showModal AND showEditModal are false */}
      {!showModal && !showEditModal && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Track and manage customer orders</p>
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
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors flex-1 sm:flex-initial"
          >
            <Plus size={20} className="w-4 h-4 md:w-5 md:h-5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

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

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setStatusFilter(newValue);
                  // Pass new value directly to avoid stale state
                  fetchOrders({ status: newValue });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="Ready For Dispatch">Ready For Dispatch</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Closed">Closed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
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
                  // Pass new value directly to avoid stale state
                  fetchOrders({ startDate: newStartDate, endDate: dateRangeFilter.end });
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
                  // Pass new value directly to avoid stale state
                  fetchOrders({ startDate: dateRangeFilter.start, endDate: newEndDate });
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
                    fetchOrders({ search: newSearchValue });
                  }, 300);
                }}
                placeholder="Search by SO No, Order ID, or Customer"
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto -mx-3 md:mx-0">
          <div className="inline-block min-w-full align-middle px-3 md:px-0">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SO Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quotation No</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Summary</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Delivery Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-500">
                    No orders found. Create your first order!
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{order.soNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.orderId}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.quotationId?.quotationNumber || order.quotationNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{order.customerName}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{order.itemName || order.itemDescription || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">{order.quantity}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-semibold">₹{order.totalAmount?.toLocaleString() || '0'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-700' :
                        order.status === 'Ready For Dispatch' ? 'bg-teal-100 text-teal-700' :
                        order.status === 'In Production' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Confirmed' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'On Hold' ? 'bg-orange-100 text-orange-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.orderDate ? formatDate(order.orderDate) : formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.createdBy?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative">
                        <button 
                          ref={(el) => { menuButtonRefs.current[order._id] = el; }}
                          onClick={() => handleMenuToggle(order._id)}
                          data-menu-button
                          className={`p-2 rounded transition-colors ${
                            openMenuId === order._id 
                              ? 'bg-gray-200 text-gray-800' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === order._id && menuPosition && (
                          <div 
                            data-dropdown-menu
                            className="fixed w-52 bg-white rounded-lg shadow-xl border-2 border-gray-300 z-[9999] overflow-hidden transition-all duration-200 ease-out"
                            style={{
                              top: `${menuPosition.top}px`,
                              right: `${menuPosition.right}px`,
                              opacity: 1,
                              transform: 'scale(1)',
                              animation: 'fadeIn 0.2s ease-out'
                            }}
                          >
                            <div className="py-1">
                              {getStatusActions(order)}
                            </div>
                          </div>
                        )}
                      </div>
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

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button onClick={() => { setShowViewModal(false); setSelectedOrder(null); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order ID</label>
                  <p className="text-sm text-gray-900">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">SO Number</label>
                  <p className="text-sm text-gray-900">{selectedOrder.soNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                  <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
                  <p className="text-sm text-gray-900">{selectedOrder.itemName}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                  <p className="text-sm text-gray-900">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    selectedOrder.status === 'Closed' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                {(selectedOrder as any).remarks && (
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                    <p className="text-sm text-gray-900">{(selectedOrder as any).remarks || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => { setShowViewModal(false); setSelectedOrder(null); }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal - PLACEHOLDER - Currently using form conditional */}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        type="danger"
      />

      {/* Hold Order Modal */}
      {showHoldModal && orderForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Put Order On Hold</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: <strong>{orderForAction.soNumber}</strong> - {orderForAction.customerName}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="Enter reason for putting order on hold..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePutOnHold}
                disabled={actionLoading || !holdReason.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Put On Hold'}
              </button>
              <button
                onClick={() => {
                  setShowHoldModal(false);
                  setOrderForAction(null);
                  setHoldReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && orderForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: <strong>{orderForAction.soNumber}</strong> - {orderForAction.customerName}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="Enter reason for canceling order..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Cancel Order'}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setOrderForAction(null);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Order Modal */}
      {showDispatchModal && orderForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Dispatch Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              Order: <strong>{orderForAction.soNumber}</strong> - {orderForAction.customerName}
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dispatchInfo.vehicleNumber}
                  onChange={(e) => setDispatchInfo({ ...dispatchInfo, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., GJ01AB1234"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  LR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dispatchInfo.lrNumber}
                  onChange={(e) => setDispatchInfo({ ...dispatchInfo, lrNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Lorry Receipt Number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={dispatchInfo.driverName}
                  onChange={(e) => setDispatchInfo({ ...dispatchInfo, driverName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Driver's Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dispatch Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dispatchInfo.dispatchDate}
                  onChange={(e) => setDispatchInfo({ ...dispatchInfo, dispatchDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDispatchOrder}
                disabled={actionLoading || !dispatchInfo.vehicleNumber || !dispatchInfo.lrNumber || !dispatchInfo.dispatchDate}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Dispatch Order'}
              </button>
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  setOrderForAction(null);
                  setDispatchInfo({ vehicleNumber: '', lrNumber: '', driverName: '', dispatchDate: '' });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
