import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, X, MoreVertical, Eye } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomerForm from '../components/CustomerForm';
import ItemForm from '../components/ItemForm';

type MasterType = 'customer' | 'vendor' | 'process' | 'transport' | 'item';

interface MasterData {
  _id: string;
  name: string;
  additionalFields?: {
    contact?: string;
    email?: string;
    address?: string;
  };
}

export default function Masters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as MasterType | null;
  const actionFromUrl = searchParams.get('action');
  
  const [activeTab, setActiveTab] = useState<MasterType>(tabFromUrl || 'customer');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number; openUpward: boolean } | null>(null);
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    rate: 0,
    unit: 'PCS',
    description: ''
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<MasterData[]>([]);
  const [processes, setProcesses] = useState<MasterData[]>([]);
  const [transports, setTransports] = useState<MasterData[]>([]);
  const [items, setItems] = useState<MasterData[]>([]);

  // Handle URL params for tab and action
  useEffect(() => {
    if (tabFromUrl && ['customer', 'item', 'vendor', 'process', 'transport'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Handle action from URL
  useEffect(() => {
    if (actionFromUrl === 'add') {
      if (activeTab === 'customer') {
        setSelectedCustomer(null);
        setShowCustomerForm(true);
      } else if (activeTab === 'item') {
        setSelectedItem(null);
        setShowItemForm(true);
      } else {
        setShowModal(true);
      }
      // Clear URL params after opening form
      setSearchParams({});
    }
  }, [actionFromUrl, activeTab]);

  // Fetch data when tab changes
  useEffect(() => {
    fetchMasters();
  }, [activeTab]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openMenuId && 
          !target.closest('[data-menu-button]') && 
          !target.closest('[data-dropdown-menu]')) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const getTypeName = (tab: MasterType): string => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const fetchMasters = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'customer') {
        // Use new customer API
        try {
          const response = await api.get('/customers');
          if (response.data.success) {
            setCustomers(response.data.data || []);
          }
        } catch (err: any) {
          // Fallback to old masters API if new API fails
          const response = await api.get('/masters/Customer');
          if (response.data.success) {
            setCustomers(response.data.data || []);
          }
        }
      } else {
        const type = getTypeName(activeTab);
        const response = await api.get(`/masters/${type}`);
        if (response.data.success) {
          const data = response.data.data || [];
          switch (activeTab) {
            case 'vendor':
              setVendors(data);
              break;
            case 'process':
              setProcesses(data);
              break;
            case 'transport':
              setTransports(data);
              break;
            case 'item':
              // Use new Item API if available
              try {
                const itemResponse = await api.get('/items');
                if (itemResponse.data.success) {
                  setItems(itemResponse.data.data || []);
                } else {
                  setItems(data);
                }
              } catch (err) {
                // Fallback to old masters API
                setItems(data);
              }
              break;
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch masters');
      console.error('Error fetching masters:', err);
    } finally {
      setLoading(false);
    }
  };

  const getData = () => {
    switch (activeTab) {
      case 'customer': return customers;
      case 'vendor': return vendors;
      case 'process': return processes;
      case 'transport': return transports;
      case 'item': return items;
      default: return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Customer creation is handled by CustomerForm component
    if (activeTab === 'customer') {
      return;
    }
    
    try {
      setLoading(true);
      const type = getTypeName(activeTab);
      const additionalFields: any = {};
      
      if (activeTab === 'item') {
        // Item-specific fields
        if (formData.rate) additionalFields.rate = formData.rate;
        if (formData.unit) additionalFields.unit = formData.unit;
        if (formData.description) additionalFields.description = formData.description;
      } else if (activeTab !== 'process') {
        if (formData.contact) additionalFields.contact = formData.contact;
        if (formData.email) additionalFields.email = formData.email;
      }
      
      if (activeTab === 'vendor') {
        if (formData.address) additionalFields.address = formData.address;
      }

      const response = await api.post(`/masters/${type}`, {
        name: formData.name,
        additionalFields: Object.keys(additionalFields).length > 0 ? additionalFields : undefined
      });

      if (response.data.success) {
        setShowModal(false);
        setFormData({ name: '', contact: '', email: '', address: '', rate: 0, unit: 'PCS', description: '' });
        await fetchMasters();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create master');
      console.error('Error creating master:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dropdown position and handle opening
  const handleMenuToggle = (itemId: string) => {
    if (openMenuId === itemId) {
      // Close menu
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      // Open menu
      const button = menuButtonRefs.current[itemId];
      if (button) {
        const rect = button.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 200;
        const spacing = 8;
        
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
        
        setOpenMenuId(itemId);
        setMenuPosition({
          top: Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8)),
          right: Math.max(8, right),
          openUpward
        });
      }
    }
  };

  const handleViewClick = (item: any) => {
    setViewingItem(item);
    setShowViewModal(true);
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleEditClick = (item: any) => {
    if (activeTab === 'customer') {
      setSelectedCustomer(item);
      setShowCustomerForm(true);
    } else if (activeTab === 'item') {
      setSelectedItem(item);
      setShowItemForm(true);
    }
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'customer') {
        // Use customer API for deletion
        const response = await api.delete(`/customers/${itemToDelete}`);
        if (response.data.success) {
          setShowDeleteModal(false);
          setItemToDelete(null);
          await fetchMasters();
        }
      } else if (activeTab === 'item') {
        // Use new item API for deletion
        const response = await api.delete(`/items/${itemToDelete}`);
        if (response.data.success) {
          setShowDeleteModal(false);
          setItemToDelete(null);
          await fetchMasters();
        }
      } else {
        const type = getTypeName(activeTab);
        const response = await api.delete(`/masters/${type}/${itemToDelete}`);
        if (response.data.success) {
          setShowDeleteModal(false);
          setItemToDelete(null);
          await fetchMasters();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete master');
      console.error('Error deleting master:', err);
      setShowDeleteModal(false);
      setItemToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'customer' as MasterType, label: 'Customer Master' },
    { id: 'item' as MasterType, label: 'Item Master' },
    { id: 'vendor' as MasterType, label: 'Vendor Master' },
    { id: 'process' as MasterType, label: 'Process Master' },
    { id: 'transport' as MasterType, label: 'Transport Master' }
  ];

  // If customer form is open, show only the form
  if (showCustomerForm) {
    return (
      <CustomerForm
        customer={selectedCustomer}
        onClose={() => {
          setShowCustomerForm(false);
          setSelectedCustomer(null);
        }}
        onSuccess={async (customer) => {
          setShowCustomerForm(false);
          setSelectedCustomer(null);
          await fetchMasters();
        }}
      />
    );
  }

  // If item form is open, show only the form
  if (showItemForm) {
    return (
      <ItemForm
        item={selectedItem}
        onClose={() => {
          setShowItemForm(false);
          setSelectedItem(null);
        }}
        onSuccess={async (item) => {
          setShowItemForm(false);
          setSelectedItem(null);
          await fetchMasters();
        }}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Masters</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Manage master data</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'customer') {
              setSelectedCustomer(null);
              setShowCustomerForm(true);
            } else if (activeTab === 'item') {
              setSelectedItem(null);
              setShowItemForm(true);
            } else {
              setShowModal(true);
            }
          }}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors w-full sm:w-auto"
        >
          <Plus size={20} className="w-4 h-4 md:w-5 md:h-5" />
          <span>Add New</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle px-3 md:px-0">
              <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b border-gray-200">
                  {activeTab === 'customer' ? (
                    <>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact Person</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mobile</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">City</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">State</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">GST Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </>
                  ) : activeTab === 'item' ? (
                    <>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Unit</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Selling Price</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">GST %</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      {activeTab !== 'process' && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                        </>
                      )}
                      {activeTab === 'vendor' && (
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Address</th>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && getData().length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'customer' ? 9 : activeTab === 'item' ? 10 : activeTab === 'process' ? 2 : activeTab === 'transport' ? 4 : 5} className="py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : getData().length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'customer' ? 9 : activeTab === 'item' ? 10 : activeTab === 'process' ? 2 : activeTab === 'transport' ? 4 : 5} className="py-8 text-center text-gray-500">
                      No {activeTab} found. Add your first one!
                    </td>
                  </tr>
                ) : (
                  getData().map((item) => (
                    <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      {activeTab === 'customer' ? (
                        <>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.customerName || item.name || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.contactPerson || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.mobile || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.email || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.billingCity || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.billingState || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.gstNumber || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <button 
                                ref={(el) => { menuButtonRefs.current[item._id || ''] = el; }}
                                onClick={() => handleMenuToggle(item._id || '')}
                                data-menu-button
                                className={`p-2 rounded transition-colors ${
                                  openMenuId === item._id 
                                    ? 'bg-gray-200 text-gray-800' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              {openMenuId === item._id && menuPosition && (
                                <div 
                                  data-dropdown-menu
                                  className="fixed w-48 bg-white rounded-lg shadow-xl border-2 border-gray-300 z-[9999] overflow-hidden transition-all duration-200 ease-out"
                                  style={{
                                    top: `${menuPosition.top}px`,
                                    right: `${menuPosition.right}px`,
                                    opacity: 1,
                                    transform: 'scale(1)',
                                    animation: 'fadeIn 0.2s ease-out'
                                  }}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleViewClick(item)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                    >
                                      <Eye size={18} className="text-blue-600" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(item)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                    >
                                      <Edit size={18} className="text-blue-600" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(item._id)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Trash2 size={18} className="text-red-600" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </>
                      ) : activeTab === 'item' ? (
                        <>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.itemId || item._id}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.itemName || item.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.itemCategory || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.itemType || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.unitOfMeasure || item.additionalFields?.unit || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">₹{(item.sellingPrice || item.additionalFields?.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {item.trackInventory !== false ? (item.currentStock || item.openingStock || 0) : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.gstPercent || item.additionalFields?.gstPercent || 0}%</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status === 'Active' ? 'bg-green-100 text-green-800' : 
                              item.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <button 
                                ref={(el) => { menuButtonRefs.current[item._id || item.itemId || ''] = el; }}
                                onClick={() => handleMenuToggle(item._id || item.itemId || '')}
                                data-menu-button
                                className={`p-2 rounded transition-colors ${
                                  openMenuId === (item._id || item.itemId) 
                                    ? 'bg-gray-200 text-gray-800' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              {openMenuId === (item._id || item.itemId) && menuPosition && (
                                <div 
                                  data-dropdown-menu
                                  className="fixed w-48 bg-white rounded-lg shadow-xl border-2 border-gray-300 z-[9999] overflow-hidden transition-all duration-200 ease-out"
                                  style={{
                                    top: `${menuPosition.top}px`,
                                    right: `${menuPosition.right}px`,
                                    opacity: 1,
                                    transform: 'scale(1)',
                                    animation: 'fadeIn 0.2s ease-out'
                                  }}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleViewClick(item)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                    >
                                      <Eye size={18} className="text-blue-600" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(item)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                    >
                                      <Edit size={18} className="text-blue-600" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(item._id || item.itemId || '')}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Trash2 size={18} className="text-red-600" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.name}</td>
                          {activeTab !== 'process' && (
                            <>
                              <td className="py-3 px-4 text-sm text-gray-700">{item.additionalFields?.contact || '-'}</td>
                              <td className="py-3 px-4 text-sm text-gray-700">{item.additionalFields?.email || '-'}</td>
                            </>
                          )}
                          {activeTab === 'vendor' && (
                            <td className="py-3 px-4 text-sm text-gray-700">{item.additionalFields?.address || '-'}</td>
                          )}
                          <td className="py-3 px-4">
                            <div className="relative">
                              <button 
                                ref={(el) => { menuButtonRefs.current[item._id || ''] = el; }}
                                onClick={() => handleMenuToggle(item._id || '')}
                                data-menu-button
                                className={`p-2 rounded transition-colors ${
                                  openMenuId === item._id 
                                    ? 'bg-gray-200 text-gray-800' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              {openMenuId === item._id && menuPosition && (
                                <div 
                                  data-dropdown-menu
                                  className="fixed w-48 bg-white rounded-lg shadow-xl border-2 border-gray-300 z-[9999] overflow-hidden transition-all duration-200 ease-out"
                                  style={{
                                    top: `${menuPosition.top}px`,
                                    right: `${menuPosition.right}px`,
                                    opacity: 1,
                                    transform: 'scale(1)',
                                    animation: 'fadeIn 0.2s ease-out'
                                  }}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleViewClick(item)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                    >
                                      <Eye size={18} className="text-blue-600" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(item)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors border-b border-gray-100"
                                    >
                                      <Edit size={18} className="text-blue-600" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(item._id)}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-gray-800 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Trash2 size={18} className="text-red-600" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && activeTab !== 'customer' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {activeTab === 'item' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rate</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="PCS, KG, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
                      rows={3}
                    />
                  </div>
                </>
              ) : activeTab !== 'process' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
                    <input
                      type="tel"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'vendor' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={loading}
      />

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'customer' ? 'Customer Details' : 
                 activeTab === 'item' ? 'Item Details' : 
                 `${getTypeName(activeTab)} Details`}
              </h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setViewingItem(null);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {activeTab === 'customer' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                    <p className="text-sm text-gray-900">{viewingItem.customerName || viewingItem.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person</label>
                    <p className="text-sm text-gray-900">{viewingItem.contactPerson || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
                    <p className="text-sm text-gray-900">{viewingItem.mobile || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{viewingItem.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                    <p className="text-sm text-gray-900">{viewingItem.billingCity || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                    <p className="text-sm text-gray-900">{viewingItem.billingState || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">GST Number</label>
                    <p className="text-sm text-gray-900">{viewingItem.gstNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      viewingItem.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingItem.status || 'Active'}
                    </span>
                  </div>
                </div>
              ) : activeTab === 'item' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Item Code</label>
                    <p className="text-sm text-gray-900">{viewingItem.itemId || viewingItem._id || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
                    <p className="text-sm text-gray-900">{viewingItem.itemName || viewingItem.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <p className="text-sm text-gray-900">{viewingItem.itemCategory || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <p className="text-sm text-gray-900">{viewingItem.itemType || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                    <p className="text-sm text-gray-900">{viewingItem.unitOfMeasure || viewingItem.additionalFields?.unit || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Selling Price</label>
                    <p className="text-sm text-gray-900">₹{(viewingItem.sellingPrice || viewingItem.additionalFields?.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stock</label>
                    <p className="text-sm text-gray-900">
                      {viewingItem.trackInventory !== false ? (viewingItem.currentStock || viewingItem.openingStock || 0) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">GST %</label>
                    <p className="text-sm text-gray-900">{viewingItem.gstPercent || viewingItem.additionalFields?.gstPercent || 0}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">HSN/SAC Code</label>
                    <p className="text-sm text-gray-900">{viewingItem.hsnSacCode || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      viewingItem.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      viewingItem.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {viewingItem.status || 'Active'}
                    </span>
                  </div>
                  {viewingItem.description && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{viewingItem.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{viewingItem.name || '-'}</p>
                  </div>
                  {activeTab !== 'process' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Contact</label>
                        <p className="text-sm text-gray-900">{viewingItem.additionalFields?.contact || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{viewingItem.additionalFields?.email || '-'}</p>
                      </div>
                    </>
                  )}
                  {activeTab === 'vendor' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                      <p className="text-sm text-gray-900">{viewingItem.additionalFields?.address || '-'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingItem(null);
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
