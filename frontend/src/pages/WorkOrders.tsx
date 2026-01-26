import { useState } from 'react';
import { Plus, Eye, X, FileText, Package, AlertCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

interface WorkOrder {
  id: string;
  workOrderId: string;
  orderId: string;
  itemName: string;
  quantity: number;
  inhouseQty: number;
  outsideQty: number;
  status: string;
  date: string;
}

interface InhouseProcess {
  srNo: number;
  processName: string;
  productName: string;
  quantity: number;
  status: string;
  department: string;
  startDate: string;
  targetDate: string;
}

interface OutsideJobWork {
  srNo: number;
  vendorName: string;
  process: string;
  productName: string;
  quantitySent: number;
  status: string;
}

export default function WorkOrders() {
  const [showModal, setShowModal] = useState(false);
  const [workOrders] = useState<WorkOrder[]>([]);

  const [isCreatingNewOrder, setIsCreatingNewOrder] = useState(false);

  const [formData, setFormData] = useState({
    orderId: '',
    itemName: '',
    quantity: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    startDate: '',
    targetDate: ''
  });

  const [workType, setWorkType] = useState({
    inhouse: false,
    outside: false
  });

  const defaultProcesses = ['Cutting', 'Bending', 'Drilling', 'Finishing', 'Packaging'];

  const [inhouseProcesses, setInhouseProcesses] = useState<InhouseProcess[]>([]);

  const [outsideJobData, setOutsideJobData] = useState({
    vendorName: '',
    challanNumber: '',
    process: '',
    quantitySent: '',
    expectedReturnDate: ''
  });

  const [outsideJobWorks, setOutsideJobWorks] = useState<OutsideJobWork[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);

  const departments: string[] = [];
  const vendors: string[] = [];
  const processes: string[] = [];
  const customers: string[] = [];

  const handleWorkTypeChange = (type: 'inhouse' | 'outside') => {
    const newWorkType = { ...workType, [type]: !workType[type] };
    setWorkType(newWorkType);

    if (type === 'inhouse' && newWorkType.inhouse && formData.itemName && formData.quantity) {
      initializeInhouseProcesses();
    }

    if (type === 'inhouse' && !newWorkType.inhouse) {
      setInhouseProcesses([]);
    }

    if (type === 'outside' && !newWorkType.outside) {
      setOutsideJobWorks([]);
      setOutsideJobData({
        vendorName: '',
        challanNumber: '',
        process: '',
        quantitySent: '',
        expectedReturnDate: ''
      });
    }
  };

  const initializeInhouseProcesses = () => {
    const processes: InhouseProcess[] = defaultProcesses.map((process, index) => ({
      srNo: index + 1,
      processName: process,
      productName: formData.itemName,
      quantity: parseInt(formData.quantity) || 0,
      status: 'Pending',
      department: '',
      startDate: '',
      targetDate: ''
    }));
    setInhouseProcesses(processes);
  };

  const handleItemChange = (itemName: string, quantity: string, customerName?: string) => {
    setFormData({ ...formData, itemName, quantity, customerName: customerName || formData.customerName });

    if (workType.inhouse && itemName && quantity) {
      const processes: InhouseProcess[] = defaultProcesses.map((process, index) => ({
        srNo: index + 1,
        processName: process,
        productName: itemName,
        quantity: parseInt(quantity) || 0,
        status: 'Pending',
        department: inhouseProcesses[index]?.department || '',
        startDate: inhouseProcesses[index]?.startDate || '',
        targetDate: inhouseProcesses[index]?.targetDate || ''
      }));
      setInhouseProcesses(processes);
    }
  };

  const toggleOrderCreationMode = () => {
    setIsCreatingNewOrder(!isCreatingNewOrder);
    setFormData({
      orderId: '',
      itemName: '',
      quantity: '',
      customerName: '',
      orderDate: new Date().toISOString().split('T')[0],
      startDate: '',
      targetDate: ''
    });
    setInhouseProcesses([]);
    setErrors([]);
  };

  const updateInhouseProcess = (index: number, field: keyof InhouseProcess, value: string | number) => {
    const updated = [...inhouseProcesses];
    updated[index] = { ...updated[index], [field]: value };
    setInhouseProcesses(updated);
  };

  const addOutsideJobWork = () => {
    if (!outsideJobData.vendorName || !outsideJobData.process || !outsideJobData.quantitySent) {
      return;
    }

    const newJob: OutsideJobWork = {
      srNo: outsideJobWorks.length + 1,
      vendorName: outsideJobData.vendorName,
      process: outsideJobData.process,
      productName: formData.itemName,
      quantitySent: parseInt(outsideJobData.quantitySent),
      status: 'Material Out'
    };

    setOutsideJobWorks([...outsideJobWorks, newJob]);
    setOutsideJobData({
      vendorName: '',
      challanNumber: '',
      process: '',
      quantitySent: '',
      expectedReturnDate: ''
    });
  };

  const handleRemoveClick = (index: number) => {
    setItemToRemove(index);
    setShowRemoveConfirm(true);
  };

  const removeOutsideJobWork = () => {
    if (itemToRemove === null) return;
    const updated = outsideJobWorks.filter((_, i) => i !== itemToRemove);
    const reindexed = updated.map((job, i) => ({ ...job, srNo: i + 1 }));
    setOutsideJobWorks(reindexed);
    setShowRemoveConfirm(false);
    setItemToRemove(null);
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (!workType.inhouse && !workType.outside) {
      validationErrors.push('Please select at least one work type (Inhouse or Outside)');
    }

    if (workType.inhouse) {
      const totalInhouseQty = inhouseProcesses.reduce((sum, p) => sum + p.quantity, 0);
      if (totalInhouseQty > parseInt(formData.quantity)) {
        validationErrors.push('Total inhouse quantity exceeds order quantity');
      }

      const missingDept = inhouseProcesses.some(p => !p.department);
      if (missingDept) {
        validationErrors.push('All inhouse processes must have an assigned department');
      }

      const missingDates = inhouseProcesses.some(p => !p.startDate || !p.targetDate);
      if (missingDates) {
        validationErrors.push('All inhouse processes must have start and target dates');
      }
    }

    if (workType.outside && outsideJobWorks.length === 0) {
      validationErrors.push('Please add at least one outside job work entry');
    }

    if (workType.outside) {
      const totalOutsideQty = outsideJobWorks.reduce((sum, j) => sum + j.quantitySent, 0);
      if (totalOutsideQty > parseInt(formData.quantity)) {
        validationErrors.push('Total outside quantity exceeds order quantity');
      }
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const workOrderId = `WO-${String(workOrders.length + 1).padStart(3, '0')}`;

    let orderId = formData.orderId;
    if (isCreatingNewOrder) {
      orderId = `ORD-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;

      console.log('New Order Created:', {
        orderId,
        customerName: formData.customerName,
        itemName: formData.itemName,
        quantity: formData.quantity,
        orderDate: formData.orderDate
      });
    }

    console.log('Work Order Created:', {
      workOrderId,
      orderId,
      customerName: formData.customerName,
      itemName: formData.itemName,
      quantity: formData.quantity,
      inhouseProcesses: workType.inhouse ? inhouseProcesses : null,
      outsideJobWorks: workType.outside ? outsideJobWorks : null
    });

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      itemName: '',
      quantity: '',
      customerName: '',
      orderDate: new Date().toISOString().split('T')[0],
      startDate: '',
      targetDate: ''
    });
    setWorkType({ inhouse: false, outside: false });
    setInhouseProcesses([]);
    setOutsideJobWorks([]);
    setOutsideJobData({
      vendorName: '',
      challanNumber: '',
      process: '',
      quantitySent: '',
      expectedReturnDate: ''
    });
    setErrors([]);
    setIsCreatingNewOrder(false);
  };

  const generateInhouseJobCard = (workOrderId: string) => {
    console.log('Generating inhouse job card for:', workOrderId);
  };

  const generateOutsideJobWork = (workOrderId: string) => {
    console.log('Generating outside job work for:', workOrderId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-500 mt-1">Manage production work orders</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          New Work Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Work Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Inhouse</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Outside</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{wo.workOrderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{wo.orderId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{wo.itemName}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{wo.quantity}</td>
                  <td className="py-3 px-4 text-sm text-blue-600 font-medium">{wo.inhouseQty}</td>
                  <td className="py-3 px-4 text-sm text-orange-600 font-medium">{wo.outsideQty}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      wo.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      wo.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{wo.date}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View">
                        <Eye size={18} />
                      </button>
                      {wo.inhouseQty > 0 && (
                        <button
                          onClick={() => generateInhouseJobCard(wo.workOrderId)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Generate Inhouse Job Card"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                      {wo.outsideQty > 0 && (
                        <button
                          onClick={() => generateOutsideJobWork(wo.workOrderId)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Generate Outside Job Work"
                        >
                          <Package size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => { setShowModal(false); resetForm(); }}
        >
          <div 
            className="bg-white rounded-lg max-w-6xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">Create Work Order</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="text-red-700 text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  <button
                    type="button"
                    onClick={toggleOrderCreationMode}
                    className="text-sm text-green-600 hover:text-green-700 font-semibold underline"
                  >
                    {isCreatingNewOrder ? '← Select Existing Order' : '+ Create New Order'}
                  </button>
                </div>

                {!isCreatingNewOrder ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Order *</label>
                      <select
                        value={formData.orderId}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setFormData({ ...formData, orderId: selected });

                          if (selected === 'ORD-001') handleItemChange('Metal Bracket', '500', 'ABC Industries');
                          else if (selected === 'ORD-002') handleItemChange('Steel Frame', '200', 'XYZ Manufacturing');
                          else if (selected === 'ORD-003') handleItemChange('Aluminum Panel', '1000', 'Tech Solutions Ltd');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select an order</option>
                        <option value="ORD-001">ORD-001 - Metal Bracket (Qty: 500) - ABC Industries</option>
                        <option value="ORD-002">ORD-002 - Steel Frame (Qty: 200) - XYZ Manufacturing</option>
                        <option value="ORD-003">ORD-003 - Aluminum Panel (Qty: 1000) - Tech Solutions Ltd</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                      <input
                        type="text"
                        value={formData.customerName}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name</label>
                      <input
                        type="text"
                        value={formData.itemName}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Order Quantity</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name *</label>
                      <select
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select customer</option>
                        {customers.map(customer => (
                          <option key={customer} value={customer}>{customer}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Order Date *</label>
                      <input
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                      <input
                        type="text"
                        value={formData.itemName}
                        onChange={(e) => {
                          const newItemName = e.target.value;
                          handleItemChange(newItemName, formData.quantity);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => {
                          const newQuantity = e.target.value;
                          handleItemChange(formData.itemName, newQuantity);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter quantity"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Type Selection *</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-3 px-6 py-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-white">
                    <input
                      type="checkbox"
                      checked={workType.inhouse}
                      onChange={() => handleWorkTypeChange('inhouse')}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">Inhouse</span>
                      <p className="text-xs text-gray-600">Process internally</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 px-6 py-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-white">
                    <input
                      type="checkbox"
                      checked={workType.outside}
                      onChange={() => handleWorkTypeChange('outside')}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">Outside</span>
                      <p className="text-xs text-gray-600">Send to vendor</p>
                    </div>
                  </label>
                </div>
              </div>

              {workType.inhouse && (
                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inhouse Job Card</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Sr No</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Process Name</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Product Name</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Quantity</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Department *</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Start Date *</th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Target Date *</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inhouseProcesses.map((process, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-sm text-gray-900">{process.srNo}</td>
                            <td className="py-2 px-3 text-sm font-medium text-gray-900">{process.processName}</td>
                            <td className="py-2 px-3 text-sm text-gray-700">{process.productName}</td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={process.quantity}
                                onChange={(e) => updateInhouseProcess(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                                {process.status}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={process.department}
                                onChange={(e) => updateInhouseProcess(index, 'department', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">Select</option>
                                {departments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={process.startDate}
                                onChange={(e) => updateInhouseProcess(index, 'startDate', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={process.targetDate}
                                onChange={(e) => updateInhouseProcess(index, 'targetDate', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {workType.outside && (
                <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Outside Job Work</h3>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Add Job Work</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name *</label>
                        <select
                          value={outsideJobData.vendorName}
                          onChange={(e) => setOutsideJobData({ ...outsideJobData, vendorName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select vendor</option>
                          {vendors.map(vendor => (
                            <option key={vendor} value={vendor}>{vendor}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Challan Number</label>
                        <input
                          type="text"
                          value={outsideJobData.challanNumber}
                          onChange={(e) => setOutsideJobData({ ...outsideJobData, challanNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="CH-2024-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Process *</label>
                        <select
                          value={outsideJobData.process}
                          onChange={(e) => setOutsideJobData({ ...outsideJobData, process: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select process</option>
                          {processes.map(process => (
                            <option key={process} value={process}>{process}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                        <input
                          type="text"
                          value={formData.itemName}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Sent *</label>
                        <input
                          type="number"
                          value={outsideJobData.quantitySent}
                          onChange={(e) => setOutsideJobData({ ...outsideJobData, quantitySent: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Return Date</label>
                        <input
                          type="date"
                          value={outsideJobData.expectedReturnDate}
                          onChange={(e) => setOutsideJobData({ ...outsideJobData, expectedReturnDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addOutsideJobWork}
                      className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Add to Job Work List
                    </button>
                  </div>

                  {outsideJobWorks.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Job Work Preview</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Sr No</th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Vendor Name</th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Process</th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Product Name</th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Quantity Sent</th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Status</th>
                              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outsideJobWorks.map((job, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-2 px-3 text-sm text-gray-900">{job.srNo}</td>
                                <td className="py-2 px-3 text-sm font-medium text-gray-900">{job.vendorName}</td>
                                <td className="py-2 px-3 text-sm text-gray-700">{job.process}</td>
                                <td className="py-2 px-3 text-sm text-gray-700">{job.productName}</td>
                                <td className="py-2 px-3 text-sm text-gray-900 font-semibold">{job.quantitySent}</td>
                                <td className="py-2 px-3">
                                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                                    {job.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveClick(index)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white pb-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg"
                >
                  Create Work Order
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
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
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setItemToRemove(null);
        }}
        onConfirm={removeOutsideJobWork}
        title="Remove Job Work"
        message="Are you sure you want to remove this outside job work entry? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
