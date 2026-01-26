import { useState, useEffect } from 'react';
import { X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';

interface CustomerFormProps {
  customer?: any;
  onClose: () => void;
  onSuccess?: (customer?: any) => void;
  returnToQuotation?: boolean;
}

export default function CustomerForm({ customer, onClose, onSuccess, returnToQuotation = false }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [formData, setFormData] = useState({
    customerName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    customerType: 'Business',
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingState: '',
    billingCountry: 'India',
    billingPincode: '',
    isShippingSameAsBilling: true,
    shippingAddressLine1: '',
    shippingAddressLine2: '',
    shippingCity: '',
    shippingState: '',
    shippingCountry: 'India',
    shippingPincode: '',
    gstNumber: '',
    panNumber: '',
    placeOfSupply: '',
    gstType: 'Registered',
    paymentTerms: 'Net30',
    creditLimit: 0,
    currency: 'INR',
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customerName: customer.customerName || '',
        contactPerson: customer.contactPerson || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        customerType: customer.customerType || 'Business',
        billingAddressLine1: customer.billingAddressLine1 || '',
        billingAddressLine2: customer.billingAddressLine2 || '',
        billingCity: customer.billingCity || '',
        billingState: customer.billingState || '',
        billingCountry: customer.billingCountry || 'India',
        billingPincode: customer.billingPincode || '',
        isShippingSameAsBilling: customer.isShippingSameAsBilling !== undefined ? customer.isShippingSameAsBilling : true,
        shippingAddressLine1: customer.shippingAddressLine1 || '',
        shippingAddressLine2: customer.shippingAddressLine2 || '',
        shippingCity: customer.shippingCity || '',
        shippingState: customer.shippingState || '',
        shippingCountry: customer.shippingCountry || 'India',
        shippingPincode: customer.shippingPincode || '',
        gstNumber: customer.gstNumber || '',
        panNumber: customer.panNumber || '',
        placeOfSupply: customer.placeOfSupply || '',
        gstType: customer.gstType || 'Registered',
        paymentTerms: customer.paymentTerms || 'Net30',
        creditLimit: customer.creditLimit || 0,
        currency: customer.currency || 'INR',
        status: customer.status || 'Active',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'isShippingSameAsBilling' && checked ? {
          shippingAddressLine1: prev.billingAddressLine1,
          shippingAddressLine2: prev.billingAddressLine2,
          shippingCity: prev.billingCity,
          shippingState: prev.billingState,
          shippingCountry: prev.billingCountry,
          shippingPincode: prev.billingPincode
        } : {})
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...(name.startsWith('billing') && prev.isShippingSameAsBilling ? {
          [`shipping${name.substring(7)}`]: value
        } : {})
      }));
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Prepare data - exclude customerId for new customers (it will be auto-generated)
      const submitData = { ...formData };
      if (!customer?._id) {
        delete submitData.customerId; // Ensure customerId is not sent for new customers
      }

      let response;
      if (customer?._id) {
        response = await api.put(`/customers/${customer._id}`, submitData);
      } else {
        response = await api.post('/customers', submitData);
      }

      if (response.data.success) {
        if (customer?._id) {
          setSuccess('Customer updated successfully!');
        } else {
          setSuccess('Customer created successfully!');
        }
        // Clear success message after 2 seconds, then call onSuccess/onClose
        setTimeout(() => {
          setSuccess('');
          if (onSuccess) {
            onSuccess(response.data.data);
          } else {
            onClose();
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer');
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-4 py-3 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">
          {customer ? 'Edit Customer' : 'New Customer'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4">
          {success && (
            <div className="mb-4 bg-green-50 border-2 border-green-300 text-green-700 px-3 py-2 rounded-lg flex items-center justify-between">
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
            <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-700 px-3 py-2 rounded-lg flex items-center justify-between">
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

        {/* Section 1: Basic Information */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('basic')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            {expandedSections.includes('basic') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('basic') && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Customer Type
              </label>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="Dealer">Dealer</option>
              </select>
            </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Billing Address */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('billing')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>
            {expandedSections.includes('billing') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('billing') && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="billingAddressLine1"
                    value={formData.billingAddressLine1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="billingAddressLine2"
                    value={formData.billingAddressLine2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="billingCity"
                    value={formData.billingCity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    name="billingState"
                    value={formData.billingState}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    name="billingCountry"
                    value={formData.billingCountry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="billingPincode"
                    value={formData.billingPincode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Shipping Address */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('shipping')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
            {expandedSections.includes('shipping') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('shipping') && (
            <div className="p-4 bg-white">
              <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isShippingSameAsBilling"
                checked={formData.isShippingSameAsBilling}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Shipping address same as billing address</span>
            </label>
          </div>
          {!formData.isShippingSameAsBilling && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="shippingAddressLine1"
                  value={formData.shippingAddressLine1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="shippingAddressLine2"
                  value={formData.shippingAddressLine2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="shippingCity"
                  value={formData.shippingCity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  name="shippingState"
                  value={formData.shippingState}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  name="shippingCountry"
                  value={formData.shippingCountry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  name="shippingPincode"
                  value={formData.shippingPincode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
            </div>
          )}
        </div>

        {/* Section 4: GST & Payment */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('gst')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">GST & Payment</h3>
            {expandedSections.includes('gst') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('gst') && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                GST Type
              </label>
              <select
                name="gstType"
                value={formData.gstType}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Registered">Registered</option>
                <option value="Unregistered">Unregistered</option>
                <option value="Composition">Composition</option>
                <option value="SEZ">SEZ</option>
                <option value="Export">Export</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                maxLength={15}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Place of Supply
              </label>
              <input
                type="text"
                name="placeOfSupply"
                value={formData.placeOfSupply}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Advance">Advance</option>
                <option value="Net15">Net 15</option>
                <option value="Net30">Net 30</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Internal Notes */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('notes')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Internal Notes</h3>
            {expandedSections.includes('notes') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('notes') && (
            <div className="p-4 bg-white">
              <div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Add any internal notes about this customer..."
            />
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-auto pt-4 pb-4 border-t-2 border-gray-300 bg-white flex-shrink-0">
          <div className="flex justify-end gap-3 px-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Saving...' : customer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
