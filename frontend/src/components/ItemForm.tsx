import { useState, useEffect, useRef } from 'react';
import { X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';

interface ItemFormProps {
  item?: any;
  onClose: () => void;
  onSuccess?: (item?: any) => void;
}

export default function ItemForm({ item, onClose, onSuccess }: ItemFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [formData, setFormData] = useState({
    itemName: '',
    itemCategory: '',
    itemType: 'Finished Goods',
    description: '',
    sellingPrice: 0,
    purchasePrice: 0,
    gstPercent: 18,
    hsnSacCode: '',
    taxType: 'Taxable',
    unitOfMeasure: 'PCS',
    openingStock: 0,
    minimumStockLevel: 0,
    warehouseLocation: '',
    trackInventory: true,
    isManufacturable: false,
    defaultProcess: '',
    bomRequired: false,
    status: 'Active'
  });

  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName || '',
        itemCategory: item.itemCategory || '',
        itemType: item.itemType || 'Finished Goods',
        description: item.description || '',
        sellingPrice: item.sellingPrice || 0,
        purchasePrice: item.purchasePrice || 0,
        gstPercent: item.gstPercent || 18,
        hsnSacCode: item.hsnSacCode || '',
        taxType: item.taxType || 'Taxable',
        unitOfMeasure: item.unitOfMeasure || 'PCS',
        openingStock: item.openingStock || 0,
        minimumStockLevel: item.minimumStockLevel || 0,
        warehouseLocation: item.warehouseLocation || '',
        trackInventory: item.trackInventory !== undefined ? item.trackInventory : true,
        isManufacturable: item.isManufacturable || false,
        defaultProcess: item.defaultProcess || '',
        bomRequired: item.bomRequired || false,
        status: item.status || 'Active'
      });
    }
  }, [item]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Auto-disable inventory tracking for Service items
        ...(name === 'itemType' && value === 'Service' ? { trackInventory: false } : {})
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Auto-disable inventory tracking when itemType changes to Service
        ...(name === 'itemType' && value === 'Service' ? { trackInventory: false } : {})
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validation
      if (!formData.itemName.trim()) {
        setError('Item name is required');
        setLoading(false);
        return;
      }

      if (formData.gstPercent < 0 || formData.gstPercent > 28) {
        setError('GST percent must be between 0 and 28');
        setLoading(false);
        return;
      }

      if (formData.sellingPrice < 0) {
        setError('Selling price cannot be negative');
        setLoading(false);
        return;
      }

      // Prepare data - exclude itemId for new items (it will be auto-generated)
      const submitData = { ...formData };
      if (!item?._id) {
        delete submitData.itemId; // Ensure itemId is not sent for new items
      }

      let response;
      if (item?._id) {
        response = await api.put(`/items/${item._id}`, submitData);
      } else {
        response = await api.post('/items', submitData);
      }

      if (response.data.success) {
        if (item?._id) {
          setSuccess('Item updated successfully!');
        } else {
          setSuccess('Item created successfully!');
        }
        // Clear success message after 3 seconds, then call onSuccess/onClose
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
      setError(err.response?.data?.message || 'Failed to save item');
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-4 py-3 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">
          {item ? 'Edit Item' : 'New Item'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
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
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    name="itemCategory"
                    value={formData.itemCategory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="itemType"
                    value={formData.itemType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Semi Finished">Semi Finished</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Service">Service</option>
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
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    HSN/SAC Code
                  </label>
                  <input
                    type="text"
                    name="hsnSacCode"
                    value={formData.hsnSacCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="Enter HSN/SAC Code"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Pricing & Tax */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('pricing')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Pricing & Tax</h3>
            {expandedSections.includes('pricing') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('pricing') && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    GST % <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="gstPercent"
                    value={formData.gstPercent}
                    onChange={handleChange}
                    min="0"
                    max="28"
                    step="0.01"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    HSN/SAC Code
                  </label>
                  <input
                    type="text"
                    name="hsnSacCode"
                    value={formData.hsnSacCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tax Type
                  </label>
                  <select
                    name="taxType"
                    value={formData.taxType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Taxable">Taxable</option>
                    <option value="Exempt">Exempt</option>
                    <option value="Zero Rated">Zero Rated</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Inventory */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('inventory')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
            {expandedSections.includes('inventory') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('inventory') && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Unit of Measure <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="PCS">PCS</option>
                    <option value="KG">KG</option>
                    <option value="MTR">MTR</option>
                    <option value="BOX">BOX</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-1.5">
                    <input
                      type="checkbox"
                      name="trackInventory"
                      checked={formData.trackInventory}
                      onChange={handleChange}
                      disabled={formData.itemType === 'Service'}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Track Inventory
                      {formData.itemType === 'Service' && <span className="text-xs text-gray-500 ml-1">(Auto-disabled for Service)</span>}
                    </span>
                  </label>
                </div>
                {formData.trackInventory && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Opening Stock
                      </label>
                      <input
                        type="number"
                        name="openingStock"
                        value={formData.openingStock}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Minimum Stock Level
                      </label>
                      <input
                        type="number"
                        name="minimumStockLevel"
                        value={formData.minimumStockLevel}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Warehouse Location
                      </label>
                      <input
                        type="text"
                        name="warehouseLocation"
                        value={formData.warehouseLocation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Production Related */}
        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('production')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Production Related</h3>
            {expandedSections.includes('production') ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
          {expandedSections.includes('production') && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 mb-1.5">
                    <input
                      type="checkbox"
                      name="isManufacturable"
                      checked={formData.isManufacturable}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Is Manufacturable</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-1.5">
                    <input
                      type="checkbox"
                      name="bomRequired"
                      checked={formData.bomRequired}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">BOM Required</span>
                  </label>
                </div>
                {formData.isManufacturable && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Default Process
                    </label>
                    <input
                      type="text"
                      name="defaultProcess"
                      value={formData.defaultProcess}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
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
              {loading ? 'Saving...' : item ? 'Update Item' : 'Save Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
