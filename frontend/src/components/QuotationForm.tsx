import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Plus, Trash2, Info } from 'lucide-react';
import api from '../api/axios';
import CustomerForm from './CustomerForm';
import ItemForm from './ItemForm';

// Note: useNavigate is not used in this component - removed to fix ReferenceError

interface Customer {
  _id: string;
  customerId?: string;
  name?: string;
  customerName?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingAddressLine1?: string;
  gstNumber?: string;
  gstType?: string;
  additionalFields?: {
    email?: string;
    contactNumber?: string;
    state?: string;
    country?: string;
    billingAddress?: string;
    gstin?: string;
  };
}

interface Item {
  _id: string;
  name: string;
  additionalFields?: {
    rate?: number;
    unit?: string;
    description?: string;
  };
}

interface QuotationItem {
  itemId?: string;
  itemName: string;
  quantity: number;
  rate: number;
  discount: number;
  amount: number;
}

interface TaxOption {
  label: string;
  value: number;
}

interface QuotationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  quotationToEdit?: any;
}

export default function QuotationForm({ onClose, onSuccess, quotationToEdit }: QuotationFormProps) {
  // Form state
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [subject, setSubject] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Item state
  const [items, setItems] = useState<QuotationItem[]>([
    { itemName: '', quantity: 1, rate: 0, discount: 0, amount: 0 }
  ]);
  const [itemMasters, setItemMasters] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState<string[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState<boolean[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemDropdownPositions, setItemDropdownPositions] = useState<{ [key: number]: { top: number; left: number; width: number } }>({});
  const itemDropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const itemInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Tax state
  const [taxMode, setTaxMode] = useState<'TDS' | 'TCS'>('TDS');
  const [tdsPercent, setTdsPercent] = useState(0);
  const [tcsPercent, setTcsPercent] = useState(0);
  const [remittanceCharges, setRemittanceCharges] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  
  // Currency state
  const [currency, setCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState(1);

  // Tax options
  const tdsOptions: TaxOption[] = [
    { label: '1%', value: 1 },
    { label: '2%', value: 2 },
    { label: '5%', value: 5 },
    { label: '10%', value: 10 }
  ];

  const tcsOptions: TaxOption[] = [
    { label: '0.1%', value: 0.1 },
    { label: '0.5%', value: 0.5 },
    { label: '1%', value: 1 },
    { label: '2%', value: 2 }
  ];

  const gstOptions: TaxOption[] = [
    { label: '0%', value: 0 },
    { label: '5%', value: 5 },
    { label: '12%', value: 12 },
    { label: '18%', value: 18 },
    { label: '28%', value: 28 }
  ];

  // New item form
  const [newItem, setNewItem] = useState({
    name: '',
    rate: 0,
    unit: 'PCS',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchCustomers();
    fetchItems();
    if (!quotationToEdit) {
      fetchNextQuotationNumber();
    }
  }, []);

  // Load quotation data when editing
  useEffect(() => {
    if (quotationToEdit && customers.length > 0 && itemMasters.length > 0) {
      loadQuotationData();
    }
  }, [quotationToEdit, customers, itemMasters]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close dropdown if clicking on modal or modal trigger buttons
      const target = event.target as HTMLElement;
      if (target.closest('[data-customer-modal]') || target.closest('[data-add-customer-button]')) {
        return;
      }
      
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(target)) {
        setShowCustomerDropdown(false);
      }
      // Close item dropdowns when clicking outside
      Object.keys(itemDropdownRefs.current).forEach(key => {
        const ref = itemDropdownRefs.current[parseInt(key)];
        const inputRef = itemInputRefs.current[parseInt(key)];
        if (ref && !ref.contains(target) && 
            inputRef && !inputRef.contains(target)) {
          setShowItemDropdown(prev => {
            const newState = [...prev];
            newState[parseInt(key)] = false;
            return newState;
          });
          setItemDropdownPositions(prev => {
            const newPos = { ...prev };
            delete newPos[parseInt(key)];
            return newPos;
          });
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNextQuotationNumber = async () => {
    try {
      const response = await api.get('/quotations/next-number');
      if (response.data.success) {
        setQuotationNumber(response.data.data.quotationNumber || 'QT-000001');
      }
    } catch (err: any) {
      console.error('Error fetching quotation number:', err);
      setQuotationNumber('QT-000001');
    }
  };

  const fetchCustomers = async () => {
    try {
      // Try new customer API first, fallback to old masters API
      try {
        const response = await api.get('/customers/active');
        if (response.data.success) {
          // Transform new customer format to old format for compatibility
          const transformedCustomers = response.data.data.map((c: any) => ({
            _id: c._id,
            name: c.customerName,
            customerName: c.customerName,
            mobile: c.mobile,
            email: c.email,
            billingCity: c.billingCity,
            billingState: c.billingState,
            billingCountry: c.billingCountry,
            gstNumber: c.gstNumber,
            gstType: c.gstType,
            additionalFields: {
              email: c.email,
              contactNumber: c.mobile,
              state: c.billingState,
              country: c.billingCountry,
              gstin: c.gstNumber
            }
          }));
          setCustomers(transformedCustomers);
          return;
        }
      } catch (newApiError) {
        // Fallback to old API
        const response = await api.get('/masters/Customer?isActive=true');
        if (response.data.success) {
          setCustomers(response.data.data || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchItems = async () => {
    try {
      // Try new Item API first
      try {
        const response = await api.get('/items/active');
        if (response.data.success) {
          setItemMasters(response.data.data || []);
          return;
        }
      } catch (newApiError) {
        // Fallback to old masters API
        const response = await api.get('/masters/Item?isActive=true');
        if (response.data.success) {
          setItemMasters(response.data.data || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
    }
  };

  const loadQuotationData = () => {
    if (!quotationToEdit) return;
    
    setQuotationNumber(quotationToEdit.quotationNumber || '');
    setQuotationDate(quotationToEdit.quotationDate ? new Date(quotationToEdit.quotationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setExpiryDate(quotationToEdit.validUntil ? new Date(quotationToEdit.validUntil).toISOString().split('T')[0] : '');
    setSubject(quotationToEdit.subject || quotationToEdit.itemDescription || '');
    setCustomerNotes(quotationToEdit.customerNotes || quotationToEdit.remarks || '');
    setTermsAndConditions(quotationToEdit.termsAndConditions || '');
    
    // Load customer
    if (quotationToEdit.partyName && customers.length > 0) {
      const customer = customers.find(c => {
        const customerName = c.customerName || c.name || '';
        return customerName === quotationToEdit.partyName || c._id === quotationToEdit.customerId;
      });
      if (customer) {
        setSelectedCustomer(customer);
      }
    }
    
    // Load items
    if (quotationToEdit.items && quotationToEdit.items.length > 0) {
      const loadedItems = quotationToEdit.items.map((item: any) => ({
        itemId: item._id,
        itemName: item.itemName || '',
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.subTotal || item.lineTotal || ((item.quantity || 1) * (item.rate || 0))
      }));
      setItems(loadedItems);
      setItemSearch(new Array(loadedItems.length).fill(''));
      setShowItemDropdown(new Array(loadedItems.length).fill(false));
    }
    
    // Load tax data
    setGstPercent(quotationToEdit.gstPercent || 18);
    setTdsPercent(quotationToEdit.tdsPercent || 0);
    setTcsPercent(quotationToEdit.tcsPercent || 0);
    setRemittanceCharges(quotationToEdit.remittanceCharges || 0);
    if (quotationToEdit.tdsPercent > 0) {
      setTaxMode('TDS');
    } else if (quotationToEdit.tcsPercent > 0) {
      setTaxMode('TCS');
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const name = customer.customerName || customer.name || '';
    const email = customer.email || customer.additionalFields?.email || '';
    const mobile = customer.mobile || customer.additionalFields?.contactNumber || '';
    const searchLower = customerSearch.toLowerCase();
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) ||
           mobile.includes(customerSearch);
  });

  // Filter items based on search
  const getFilteredItems = (index: number) => {
    const search = itemSearch[index] || '';
    return itemMasters.filter(item => {
      const itemName = (item as any).itemName || item.name || '';
      const itemId = (item as any).itemId || '';
      const hsnSac = (item as any).hsnSacCode || '';
      return itemName.toLowerCase().includes(search.toLowerCase()) ||
             itemId.toLowerCase().includes(search.toLowerCase()) ||
             hsnSac.toLowerCase().includes(search.toLowerCase());
    });
  };

  // Calculations
  const calculateItemAmount = (quantity: number, rate: number, discount: number = 0): number => {
    const subtotal = quantity * rate;
    const discountAmount = (subtotal * discount) / 100;
    return Math.round((subtotal - discountAmount) * 100) / 100;
  };

  const baseAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const calculateGST = (): number => {
    if (!selectedCustomer) return 0;
    
    const customerState = selectedCustomer.additionalFields?.state || '';
    const customerCountry = selectedCustomer.additionalFields?.country || 'India';
    
    // If country is not India, GST = 0
    if (customerCountry !== 'India') return 0;
    
    // GST calculation:
    // - If customer state = Gujarat: Apply CGST + SGST (each = GST% / 2)
    // - If customer state ≠ Gujarat AND country = India: Apply IGST (full GST%)
    // For now, we calculate total GST amount (CGST+SGST or IGST)
    // The backend can split this into CGST/SGST if needed
    return Math.round((baseAmount * gstPercent / 100) * 100) / 100;
  };

  const calculateTDS = (): number => {
    if (taxMode !== 'TDS') return 0;
    if (!selectedCustomer) return 0;
    
    const customerCountry = selectedCustomer.additionalFields?.country || 'India';
    // TDS only applies if Currency = INR AND Country = India
    if (customerCountry !== 'India') return 0;
    
    return Math.round(((baseAmount * tdsPercent) / 100) * 100) / 100;
  };

  const calculateTCS = (): number => {
    if (taxMode !== 'TCS') return 0;
    if (!selectedCustomer) return 0;
    
    const customerCountry = selectedCustomer.additionalFields?.country || 'India';
    // TCS only applies if Currency = INR AND Country = India
    if (customerCountry !== 'India') return 0;
    
    return Math.round(((baseAmount * tcsPercent) / 100) * 100) / 100;
  };

  const gst = calculateGST();
  const tds = calculateTDS();
  const tcs = calculateTCS();
  const invoiceTotal = baseAmount + gst;
  const receivableAmount = invoiceTotal - tds - remittanceCharges;

  // Handlers
  const handleCustomerSelect = (customer: Customer) => {
    // Transform customer to match expected format
    const transformedCustomer: Customer = {
      _id: customer._id,
      customerId: customer.customerId,
      name: customer.customerName || customer.name || '',
      customerName: customer.customerName || customer.name || '',
      mobile: customer.mobile,
      email: customer.email,
      billingCity: customer.billingCity,
      billingState: customer.billingState,
      billingCountry: customer.billingCountry,
      billingAddressLine1: customer.billingAddressLine1,
      gstNumber: customer.gstNumber,
      gstType: customer.gstType,
      additionalFields: {
        email: customer.email || customer.additionalFields?.email,
        contactNumber: customer.mobile || customer.additionalFields?.contactNumber,
        state: customer.billingState || customer.additionalFields?.state,
        country: customer.billingCountry || customer.additionalFields?.country || 'India',
        gstin: customer.gstNumber || customer.additionalFields?.gstin
      }
    };
    setSelectedCustomer(transformedCustomer);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const handleCustomerFormSuccess = (newCustomer?: any) => {
    if (newCustomer) {
      // Transform new customer format
      const transformedCustomer: Customer = {
        _id: newCustomer._id,
        customerId: newCustomer.customerId,
        name: newCustomer.customerName,
        customerName: newCustomer.customerName,
        mobile: newCustomer.mobile,
        email: newCustomer.email,
        billingCity: newCustomer.billingCity,
        billingState: newCustomer.billingState,
        billingCountry: newCustomer.billingCountry,
        gstNumber: newCustomer.gstNumber,
        gstType: newCustomer.gstType,
        additionalFields: {
          email: newCustomer.email,
          contactNumber: newCustomer.mobile,
          state: newCustomer.billingState,
          country: newCustomer.billingCountry || 'India',
          gstin: newCustomer.gstNumber
        }
      };
      handleCustomerSelect(transformedCustomer);
      fetchCustomers(); // Refresh customer list
    }
    setShowAddCustomerModal(false);
  };

  const handleItemFormSuccess = (newItem?: any) => {
    if (newItem) {
      // Refresh items list to include the newly created item
      fetchItems();
    }
    setShowAddItemModal(false);
  };

  // Calculate dropdown position for item input
  const calculateItemDropdownPosition = (index: number) => {
    const input = itemInputRefs.current[index];
    if (input) {
      const rect = input.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 240; // max-h-60 = 240px
      const spacing = 4; // mt-1 spacing
      const minDropdownWidth = 300; // Minimum width for dropdown
      
      // Check if should open upward
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      // Calculate width (ensure minimum width)
      const calculatedWidth = Math.max(rect.width, minDropdownWidth);
      
      // Ensure dropdown doesn't go off-screen horizontally
      let leftPosition = rect.left;
      if (leftPosition + calculatedWidth > viewportWidth) {
        leftPosition = viewportWidth - calculatedWidth - 10; // 10px margin from edge
      }
      if (leftPosition < 10) {
        leftPosition = 10; // 10px margin from left edge
      }
      
      // Calculate top position
      let topPosition: number;
      if (openUpward) {
        topPosition = Math.max(10, rect.top - dropdownHeight - spacing); // Keep 10px from top
      } else {
        topPosition = Math.min(
          viewportHeight - dropdownHeight - 10, // Keep 10px from bottom
          rect.bottom + spacing
        );
      }
      
      setItemDropdownPositions(prev => ({
        ...prev,
        [index]: {
          top: topPosition,
          left: leftPosition,
          width: calculatedWidth
        }
      }));
    }
  };

  const handleItemSelect = (index: number, item: Item) => {
    const updatedItems = [...items];
    // Use new Item API structure if available, otherwise fallback to old structure
    const sellingPrice = (item as any).sellingPrice || item.additionalFields?.rate || 0;
    const itemName = (item as any).itemName || item.name;
    
    updatedItems[index] = {
      ...updatedItems[index],
      itemId: item._id,
      itemName: itemName,
      rate: sellingPrice,
      amount: calculateItemAmount(updatedItems[index].quantity, sellingPrice, updatedItems[index].discount || 0)
    };
    
    // Auto-fill GST if item has gstPercent
    if ((item as any).gstPercent !== undefined) {
      setGstPercent((item as any).gstPercent);
    }
    
    setItems(updatedItems);
    setShowItemDropdown(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
    setItemSearch(prev => {
      const newState = [...prev];
      newState[index] = '';
      return newState;
    });
    // Clear position
    setItemDropdownPositions(prev => {
      const newPos = { ...prev };
      delete newPos[index];
      return newPos;
    });
  };

  const handleItemChange = (index: number, field: 'quantity' | 'rate' | 'discount', value: number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      amount: calculateItemAmount(
        field === 'quantity' ? value : updatedItems[index].quantity,
        field === 'rate' ? value : updatedItems[index].rate,
        field === 'discount' ? value : (updatedItems[index].discount || 0)
      )
    };
    setItems(updatedItems);
  };

  const handleAddRow = () => {
    const newIndex = items.length;
    setItems([...items, { itemName: '', quantity: 1, rate: 0, discount: 0, amount: 0 }]);
    setItemSearch([...itemSearch, '']);
    setShowItemDropdown([...showItemDropdown, false]);
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all items?')) {
      setItems([{ itemName: '', quantity: 1, rate: 0, discount: 0, amount: 0 }]);
      setItemSearch(['']);
      setShowItemDropdown([false]);
    }
  };

  const handleRemoveRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setItemSearch(itemSearch.filter((_, i) => i !== index));
      setShowItemDropdown(showItemDropdown.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (items.length === 0 || items.some(item => !item.itemName || item.quantity <= 0 || item.rate <= 0)) {
      setError('Please add at least one item with valid quantity and rate');
      return;
    }

    try {
      setSaving(true);
      
      // Convert items to processes format (backend requires processes for validation)
      const processes = items
        .filter(item => item.itemName && item.itemName.trim() && item.rate > 0)
        .map(item => ({
          processName: item.itemName.trim(),
          rate: item.rate,
          quantity: item.quantity || 1
        }));
      
      if (processes.length === 0) {
        setError('Please add at least one item with valid name and rate');
        setSaving(false);
        return;
      }
      
      const quotationData = {
        quotationNumber,
        quotationDate: new Date(quotationDate),
        validUntil: expiryDate ? new Date(expiryDate) : undefined,
        partyName: selectedCustomer.customerName || selectedCustomer.name,
        customerId: selectedCustomer._id,
        email: selectedCustomer.email || selectedCustomer.additionalFields?.email || '',
        contactNumber: selectedCustomer.mobile || selectedCustomer.additionalFields?.contactNumber || '',
        billingAddress: selectedCustomer.billingAddressLine1 || selectedCustomer.additionalFields?.billingAddress || '',
        itemDescription: subject,
        subject: subject,
        customerNotes: customerNotes,
        termsAndConditions: termsAndConditions,
        items: items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount || 0,
          subTotal: item.amount,
          lineTotal: item.amount
        })),
        processes: processes, // Required by backend validation
        gstPercent,
        tdsPercent: taxMode === 'TDS' ? tdsPercent : 0,
        tdsAmount: tds,
        tcsPercent: taxMode === 'TCS' ? tcsPercent : 0,
        tcsAmount: tcs,
        remittanceCharges: remittanceCharges,
        totalSubTotal: baseAmount,
        totalTaxAmount: gst,
        invoiceTotal: invoiceTotal,
        receivableAmount: receivableAmount,
        totalAmount: receivableAmount,
        paymentTerms: '',
        remarks: customerNotes,
        currency: currency,
        exchangeRate: exchangeRate,
        status: 'Draft'
      };

      let response;
      if (quotationToEdit) {
        response = await api.put(`/quotations/${quotationToEdit._id}`, quotationData);
      } else {
        response = await api.post('/quotations', quotationData);
      }

      if (response.data.success) {
        if (quotationToEdit) {
          setSuccess('Quotation updated successfully!');
        } else {
          setSuccess('Quotation created successfully!');
        }
        // Clear success message after 2 seconds, then call onSuccess/onClose
        setTimeout(() => {
          setSuccess('');
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white">
      <form onSubmit={handleSubmit} className="p-6">
          {success && (
            <div className="mb-2 bg-green-50 border-2 border-green-300 text-green-700 px-3 py-2 rounded-lg flex items-center justify-between">
              <span>{success}</span>
              <button
                type="button"
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
                type="button"
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Close error message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
            <h2 className="text-2xl font-bold text-gray-900">
              {quotationToEdit ? 'Edit Quotation' : 'New Quotation'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <X size={24} />
            </button>
          </div>

          {/* Single Column Layout */}
          <div className="space-y-3 max-w-full">

              {/* Header Form Section */}
              <div className="space-y-2.5">
                {/* Customer Field */}
                <div>
                  <label className="block text-sm font-semibold text-red-700 mb-1.5">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={customerDropdownRef}>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={selectedCustomer?.name || customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                            if (!e.target.value) {
                              setSelectedCustomer(null);
                            }
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Select or add a customer"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {showCustomerDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto flex flex-col">
                            <div className="flex-1 overflow-y-auto">
                              {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                  <button
                                    key={customer._id}
                                    type="button"
                                    onClick={() => handleCustomerSelect(customer)}
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <span>{customer.customerName || customer.name}</span>
                                    {(customer.email || customer.additionalFields?.email) && (
                                      <span className="text-xs text-gray-500">({customer.email || customer.additionalFields?.email})</span>
                                    )}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500">
                                  No customers found
                                </div>
                              )}
                            </div>
                            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 sticky bottom-0">
                              <button
                                type="button"
                                data-add-customer-button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowCustomerDropdown(false);
                                  setTimeout(() => {
                                    setShowAddCustomerModal(true);
                                  }, 100);
                                }}
                                className="w-full text-left text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
                              >
                                <Plus size={16} />
                                <span>Add New Customer</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <Search size={18} />
                      </button>
                    </div>
                    {/* Customer Info Panel */}
                    {selectedCustomer && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fadeIn">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-semibold text-gray-900">{selectedCustomer.customerName || selectedCustomer.name}</span>
                          {(selectedCustomer.gstNumber || selectedCustomer.additionalFields?.gstin) && (
                            <span className="text-gray-600">GSTIN: <span className="font-medium">{selectedCustomer.gstNumber || selectedCustomer.additionalFields?.gstin}</span></span>
                          )}
                          {(selectedCustomer.billingState || selectedCustomer.additionalFields?.state) && (
                            <span className="text-gray-600">State: <span className="font-medium">{selectedCustomer.billingState || selectedCustomer.additionalFields?.state}</span></span>
                          )}
                          {(selectedCustomer.billingCountry || selectedCustomer.additionalFields?.country) && (
                            <span className="text-gray-600">Country: <span className="font-medium">{selectedCustomer.billingCountry || selectedCustomer.additionalFields?.country}</span></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quotation Number */}
                <div>
                  <label className="block text-sm font-semibold text-red-700 mb-1.5">
                    Quotation No <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quotationNumber}
                      onChange={(e) => setQuotationNumber(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Quote Date & Expiry Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-red-700 mb-1.5">
                      Quote Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={(e) => setQuotationDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    Subject
                    <Info size={14} className="text-gray-400" />
                  </label>
                  <textarea
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Let your customer know what this Quote is for"
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all duration-200"
                  />
                </div>
              </div>

              {/* Item Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Item Table</h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowAddItemModal(true);
                      }, 100);
                    }}
                    data-add-item-button
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 font-semibold transition-all"
                  >
                    <Plus size={18} />
                    <span>Add New Item</span>
                  </button>
                </div>

                <div className="border border-gray-300 rounded-lg overflow-visible">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-20">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-[40%]">ITEM DETAILS</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-[12%]">QUANTITY</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-[12%]">RATE</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-[12%]">DISCOUNT</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-[18%]">AMOUNT</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b w-[6%]"></th>
                      </tr>
                    </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-all duration-150 animate-fadeIn">
                            <td className="px-4 py-3">
                              <div className="relative">
                                <input
                                  ref={(el) => { itemInputRefs.current[index] = el; }}
                                  type="text"
                                  value={item.itemName}
                                  onChange={(e) => {
                                    const updatedItems = [...items];
                                    updatedItems[index].itemName = e.target.value;
                                    setItems(updatedItems);
                                    const newSearch = [...itemSearch];
                                    newSearch[index] = e.target.value;
                                    setItemSearch(newSearch);
                                    setShowItemDropdown(prev => {
                                      const newState = [...prev];
                                      newState[index] = true;
                                      return newState;
                                    });
                                    calculateItemDropdownPosition(index);
                                  }}
                                  onFocus={(e) => {
                                    e.target.classList.add('ring-2', 'ring-blue-500');
                                    setShowItemDropdown(prev => {
                                      const newState = [...prev];
                                      newState[index] = true;
                                      return newState;
                                    });
                                    calculateItemDropdownPosition(index);
                                  }}
                                  onBlur={(e) => {
                                    e.target.classList.remove('ring-2', 'ring-blue-500');
                                    // Delay closing dropdown to allow click events
                                    setTimeout(() => {
                                      const activeElement = document.activeElement;
                                      if (!itemDropdownRefs.current[index]?.contains(activeElement)) {
                                        setShowItemDropdown(prev => {
                                          const newState = [...prev];
                                          newState[index] = false;
                                          return newState;
                                        });
                                        setItemDropdownPositions(prev => {
                                          const newPos = { ...prev };
                                          delete newPos[index];
                                          return newPos;
                                        });
                                      }
                                    }, 200);
                                  }}
                                  placeholder="Type or click to select an item"
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                />
                                {showItemDropdown[index] && itemDropdownPositions[index] && createPortal(
                                  <div 
                                    ref={(el) => { itemDropdownRefs.current[index] = el; }}
                                    className="fixed z-[99999] bg-white border-2 border-gray-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto flex flex-col"
                                    style={{
                                      top: `${itemDropdownPositions[index].top}px`,
                                      left: `${itemDropdownPositions[index].left}px`,
                                      width: `${itemDropdownPositions[index].width}px`,
                                      minWidth: '200px'
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                  <div className="flex-1 overflow-y-auto">
                                    {getFilteredItems(index).length > 0 ? (
                                      getFilteredItems(index).map((itemMaster) => {
                                        const itemName = (itemMaster as any).itemName || itemMaster.name;
                                        const sellingPrice = (itemMaster as any).sellingPrice || itemMaster.additionalFields?.rate || 0;
                                        const unit = (itemMaster as any).unitOfMeasure || itemMaster.additionalFields?.unit || '';
                                        return (
                                      <button
                                        key={itemMaster._id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()} // Prevent blur on input
                                        onClick={() => handleItemSelect(index, itemMaster)}
                                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                                      >
                                            <div className="flex items-center justify-between">
                                              <span>{itemName}</span>
                                              <span className="text-xs text-gray-500 ml-2">
                                                ₹{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                {unit && ` / ${unit}`}
                                              </span>
                                            </div>
                                          </button>
                                        );
                                      })
                                    ) : (
                                      <div className="px-4 py-2 text-gray-500">
                                        No items found
                                      </div>
                                    )}
                                  </div>
                                  <div className="border-t-2 border-gray-200 px-4 py-3 bg-gray-50 sticky bottom-0">
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()} // Prevent blur on input
                                      onClick={() => {
                                        setShowItemDropdown(prev => {
                                          const newState = [...prev];
                                          newState[index] = false;
                                          return newState;
                                        });
                                        setShowAddItemModal(true);
                                      }}
                                      className="w-full text-left text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors"
                                    >
                                      <Plus size={16} />
                                      <span>Add New Item</span>
                                    </button>
                                  </div>
                                </div>,
                                document.body
                              )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.discount || 0}
                                  onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-2 border-2 border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  onWheel={(e) => e.currentTarget.blur()}
                                />
                                <span className="text-gray-600 text-sm">%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900 transition-all duration-300">
                              ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Add New Row Button */}
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm transition-all duration-200"
                  >
                    <Plus size={16} />
                    <span>Add New Row</span>
                  </button>
                </div>
              </div>

              {/* Calculation Inputs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Base Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={`₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST %</label>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {gstOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">TDS %</label>
                  <select
                    value={tdsPercent}
                    onChange={(e) => {
                      setTdsPercent(parseFloat(e.target.value));
                      if (parseFloat(e.target.value) > 0) setTaxMode('TDS');
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value={0}>Select TDS %</option>
                    {tdsOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">TCS %</label>
                  <select
                    value={tcsPercent}
                    onChange={(e) => {
                      setTcsPercent(parseFloat(e.target.value));
                      if (parseFloat(e.target.value) > 0) setTaxMode('TCS');
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value={0}>Select TCS %</option>
                    {tcsOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Exchange Rate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remittance Charges</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={remittanceCharges}
                    onChange={(e) => setRemittanceCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              </div>

              {/* Quotation Summary - Below Item Table, Above Terms & Conditions */}
              <div className="flex justify-end mt-4">
                <div className="w-full md:w-[35%] bg-gray-50 rounded-lg p-4 shadow-md border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Quotation Summary</h3>

                  {/* Base Amount */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-medium text-gray-700">Base Amount:</span>
                    <span className="font-semibold text-gray-900 transition-all duration-300">{currency} {baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* GST */}
                  {gst > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-300 bg-blue-50 px-2 rounded">
                      <span className="font-medium text-gray-700">GST ({gstPercent}%):</span>
                      <span className="font-semibold text-blue-700 transition-all duration-300">{currency} {gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* TDS */}
                  {taxMode === 'TDS' && tds > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-300 bg-red-50 px-2 rounded">
                      <span className="font-medium text-gray-700">TDS ({tdsPercent}%):</span>
                      <span className="font-semibold text-red-700 transition-all duration-300">- {currency} {tds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* TCS */}
                  {taxMode === 'TCS' && tcs > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-300 bg-blue-50 px-2 rounded">
                      <span className="font-medium text-gray-700">TCS ({tcsPercent}%):</span>
                      <span className="font-semibold text-blue-700 transition-all duration-300">{currency} {tcs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* Remittance Charges */}
                  {remittanceCharges > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-300 bg-orange-50 px-2 rounded">
                      <span className="font-medium text-gray-700">Remittance Charges:</span>
                      <span className="font-semibold text-orange-700 transition-all duration-300">- {currency} {remittanceCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* Quotation Total */}
                  <div className="flex justify-between items-center py-2 border-t-2 border-gray-400 pt-3 mt-2">
                    <span className="font-semibold text-gray-700">Quotation Total:</span>
                    <span className="font-bold text-lg text-gray-900 transition-all duration-300">{currency} {invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* Receivable Amount */}
                  <div className="flex justify-between items-center py-3 bg-blue-100 rounded-lg px-3 mt-2">
                    <span className="font-bold text-gray-900">Receivable Amount:</span>
                    <span className="font-bold text-lg text-gray-900 transition-all duration-300">{currency} {receivableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Customer Notes & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Notes</label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Looking forward for your business."
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Terms & Conditions</label>
                  <textarea
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="Enter the terms and conditions..."
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y transition-all duration-200"
                  />
                </div>
              </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {saving ? 'Saving...' : quotationToEdit ? 'Update Quotation' : 'Save Quotation'}
            </button>
          </div>
        </form>

      {/* Customer Form Modal */}
      {showAddCustomerModal && (
        <div 
          data-customer-modal
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddCustomerModal(false);
            }
          }}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl my-8 relative flex flex-col" style={{ maxHeight: '90vh' }}>
              <CustomerForm
                onClose={() => setShowAddCustomerModal(false)}
                onSuccess={handleCustomerFormSuccess}
                returnToQuotation={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showAddItemModal && (
        <div 
          data-item-modal
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddItemModal(false);
            }
          }}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl my-8 relative flex flex-col" style={{ maxHeight: '90vh' }}>
              <ItemForm
                onClose={() => setShowAddItemModal(false)}
                onSuccess={handleItemFormSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
