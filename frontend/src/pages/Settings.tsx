import { useState, useEffect } from 'react';
import { Building2, FileText, Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import api from '../api/axios';

interface CompanySettings {
  companyName?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  defaultGst?: number;
  quotationValidityDays?: number;
  defaultPaymentTerms?: string;
  footerNote?: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    gstin: '',
    pan: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    defaultGst: 18,
    quotationValidityDays: 30,
    defaultPaymentTerms: '',
    footerNote: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      if (response.data.success && response.data.data) {
        setCompanySettings({
          companyName: response.data.data.companyName || '',
          tagline: response.data.data.tagline || '',
          phone: response.data.data.phone || '',
          email: response.data.data.email || '',
          website: response.data.data.website || '',
          addressLine1: response.data.data.addressLine1 || '',
          addressLine2: response.data.data.addressLine2 || '',
          city: response.data.data.city || '',
          state: response.data.data.state || '',
          pincode: response.data.data.pincode || '',
          country: response.data.data.country || 'India',
          gstin: response.data.data.gstin || '',
          pan: response.data.data.pan || '',
          bankName: response.data.data.bankName || '',
          accountNumber: response.data.data.accountNumber || '',
          ifsc: response.data.data.ifsc || '',
          branch: response.data.data.branch || '',
          defaultGst: response.data.data.defaultGst || 18,
          quotationValidityDays: response.data.data.quotationValidityDays || 30,
          defaultPaymentTerms: response.data.data.defaultPaymentTerms || '',
          footerNote: response.data.data.footerNote || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await api.put('/settings', companySettings);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Company settings saved successfully!' });
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-500 mt-1">Manage your company profile and default settings</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companySettings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
              <input
                type="text"
                value={companySettings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your company tagline"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={companySettings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={companySettings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={companySettings.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </div>

        {/* Company Address */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Company Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
              <input
                type="text"
                value={companySettings.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
              <input
                type="text"
                value={companySettings.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={companySettings.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={companySettings.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                value={companySettings.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={companySettings.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Tax Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN</label>
              <input
                type="text"
                value={companySettings.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="27AABCU9603R1ZV"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number</label>
              <input
                type="text"
                value={companySettings.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="AABCU9603R"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
              <input
                type="text"
                value={companySettings.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
              <input
                type="text"
                value={companySettings.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
              <input
                type="text"
                value={companySettings.ifsc}
                onChange={(e) => handleChange('ifsc', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <input
                type="text"
                value={companySettings.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Default Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={companySettings.defaultGst || 18}
                onChange={(e) => handleChange('defaultGst', parseInt(e.target.value) || 18)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quotation Validity (Days)</label>
              <input
                type="number"
                min="1"
                value={companySettings.quotationValidityDays || 30}
                onChange={(e) => handleChange('quotationValidityDays', parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Payment Terms</label>
              <textarea
                value={companySettings.defaultPaymentTerms}
                onChange={(e) => handleChange('defaultPaymentTerms', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="e.g., 50% advance, 50% on delivery"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Note</label>
              <textarea
                value={companySettings.footerNote}
                onChange={(e) => handleChange('footerNote', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Note to appear at the bottom of PDFs"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Company Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
