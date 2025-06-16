import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Calendar, DollarSign, FileText, Camera, Ruler, Search, User, AlertTriangle, Package } from 'lucide-react';
import { Customer, MaterialType, tamilSizeFields, SizeChart, OrderType } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  order?: any;
  mode?: 'add' | 'edit' | 'view';
}

const OrderModal: React.FC<OrderModalProps> = ({ 
  isOpen, 
  onClose, 
  customer: initialCustomer, 
  order, 
  mode = 'add' 
}) => {
  const { addOrder, updateOrder, searchCustomers } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [formData, setFormData] = useState({
    orderType: 'regular' as OrderType,
    materialType: 'blouse' as MaterialType,
    sizeBookNo: '',
    hint: '',
    description: '',
    deliveryDate: '',
    approximateAmount: '',
    notes: '',
    referenceImage: ''
  });
  
  const [sizes, setSizes] = useState<SizeChart>(() => {
    const initialSizes: SizeChart = {};
    tamilSizeFields.forEach(field => {
      initialSizes[field.key] = '';
    });
    return initialSizes;
  });

  useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        orderType: order.orderType,
        materialType: order.materialType,
        sizeBookNo: order.sizeBookNo || '',
        hint: order.hint || '',
        description: order.description,
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        approximateAmount: order.approximateAmount.toString(),
        notes: order.notes,
        referenceImage: order.referenceImage || ''
      });
      setSizes(order.sizes || {});
    }
  }, [order, mode]);

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    setShowCustomerResults(true);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    const givenDate = new Date();
    const deliveryDate = new Date(formData.deliveryDate);
    
    // For regular orders, set delivery date to 7 days after given date
    if (formData.orderType === 'regular') {
      deliveryDate.setDate(givenDate.getDate() + 7);
    }

    const orderData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      orderType: formData.orderType,
      materialType: formData.materialType,
      sizeBookNo: formData.sizeBookNo,
      hint: formData.hint,
      description: formData.description,
      sizes,
      referenceImage: formData.referenceImage,
      notes: formData.notes,
      deliveryDate,
      givenDate,
      approximateAmount: parseFloat(formData.approximateAmount) || 0
    };

    if (mode === 'add') {
      addOrder(orderData);
    } else if (mode === 'edit' && order) {
      updateOrder(order.id, orderData);
    }
    
    onClose();
  };

  const handleSizeChange = (key: string, value: string) => {
    setSizes(prev => ({ ...prev, [key]: value }));
  };

  const customerSearchResults = searchCustomers(customerSearchQuery);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'add' ? 'Add New Order' : mode === 'edit' ? 'Edit Order' : 'View Order'}
            </h2>
            {selectedCustomer && (
              <p className="text-sm text-pink-600">{selectedCustomer.name} ({selectedCustomer.customerId})</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Search */}
          {mode === 'add' && !initialCustomer && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer *
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Search by customer name, phone number, or ID..."
                />
              </div>
              {showCustomerResults && customerSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {customerSearchResults.map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.phone} • {customer.customerId}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Order Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, orderType: 'regular' })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    formData.orderType === 'regular'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <Package className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Regular</span>
                  <p className="text-xs text-gray-500 mt-1">7 days delivery</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, orderType: 'emergency' })}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    formData.orderType === 'emergency'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-200'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Emergency</span>
                  <p className="text-xs text-gray-500 mt-1">Custom delivery</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Type *
              </label>
              <select
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value as MaterialType })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="blouse">Blouse</option>
                <option value="chudi">Chudi</option>
                <option value="saree">Saree</option>
                <option value="works">Works</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>

          {/* Size Book and Hint */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Book No. *
              </label>
              <input
                type="text"
                value={formData.sizeBookNo}
                onChange={(e) => setFormData({ ...formData, sizeBookNo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter size book number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hint *
              </label>
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter hint for identification"
                required
              />
            </div>
          </div>

          {/* Delivery Date and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.orderType === 'regular' ? 'Expected Delivery Date' : 'Delivery Date'} *
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    formData.orderType === 'regular' ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  disabled={formData.orderType === 'regular'}
                  required
                />
              </div>
              {formData.orderType === 'regular' && (
                <p className="text-sm text-gray-500 mt-1">
                  Delivery date will be automatically set to 7 days from given date
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approximate Amount (₹)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  value={formData.approximateAmount}
                  onChange={(e) => setFormData({ ...formData, approximateAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Silk blouse with embroidery"
              required
            />
          </div>

          {/* Size Chart */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size Chart
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tamilSizeFields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-600 mb-1">
                    {field.tamil} ({field.english})
                  </label>
                  <input
                    type="text"
                    value={sizes[field.key] || ''}
                    onChange={(e) => handleSizeChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="--"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={3}
                placeholder="Special instructions, color preferences, etc."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105"
            >
              {mode === 'add' ? 'Create Order' : mode === 'edit' ? 'Update Order' : 'View Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;