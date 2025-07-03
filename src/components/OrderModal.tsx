import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Calendar, DollarSign, FileText, Camera, Search, User, AlertTriangle, Package, Scissors } from 'lucide-react';
import { Customer, MaterialType, OrderType } from '../types';
import { useNavigate } from 'react-router-dom';

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
  const { addMultipleOrders, updateOrder, searchCustomers } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [formData, setFormData] = useState({
    orderType: 'regular' as OrderType,
    materialType: 'blouse' as MaterialType,
    sizeBookNo: '',
    description: '',
    deliveryDate: '',
    approximateAmount: '',
    notes: '',
    referenceImage: '',
    numberOfItems: 1,
    editDeliveryDate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        orderType: order.orderType,
        materialType: order.materialType,
        sizeBookNo: order.sizeBookNo || '',
        description: order.description,
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        approximateAmount: order.approximateAmount.toString(),
        notes: order.notes,
        referenceImage: order.referenceImage || '',
        numberOfItems: order.numberOfItems || 1,
        editDeliveryDate: false
      });
    } else if (mode === 'add') {
      // Reset form for new orders
      setFormData({
        orderType: 'regular' as OrderType,
        materialType: 'blouse' as MaterialType,
        sizeBookNo: '',
        description: '',
        deliveryDate: '',
        approximateAmount: '',
        notes: '',
        referenceImage: '',
        numberOfItems: 1,
        editDeliveryDate: false
      });
    }
  }, [order, mode, isOpen]);

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    setShowCustomerResults(true);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    setIsSubmitting(true);

    try {
      const givenDate = new Date();
      let deliveryDate: Date;
      
      // For regular orders, set delivery date to 7 days after given date
      if (formData.orderType === 'regular') {
        if (formData.editDeliveryDate && formData.deliveryDate) {
          // If edit delivery date is checked, use the selected date
          deliveryDate = new Date(formData.deliveryDate);
        } else {
          // Default to 7 days for regular orders
          deliveryDate = new Date();
          deliveryDate.setDate(givenDate.getDate() + 7);
        }
      } else if (formData.orderType === 'alter') {
        // For alter orders, allow editing delivery date
        if (formData.editDeliveryDate && formData.deliveryDate) {
          deliveryDate = new Date(formData.deliveryDate);
        } else {
          // Default to 7 days for alter orders if not edited
          deliveryDate = new Date();
          deliveryDate.setDate(givenDate.getDate() + 7);
        }
      } else {
        // For emergency orders, use the selected delivery date
        if (!formData.deliveryDate) {
          alert('Please select a delivery date for emergency orders');
          setIsSubmitting(false);
          return;
        }
        deliveryDate = new Date(formData.deliveryDate);
      }

      const orderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        orderType: formData.orderType,
        materialType: formData.materialType,
        sizeBookNo: formData.sizeBookNo,
        hint: '',
        description: formData.description,
        referenceImage: formData.referenceImage,
        notes: formData.notes,
        deliveryDate,
        givenDate,
        approximateAmount: parseFloat(formData.approximateAmount) || 0,
        numberOfItems: formData.numberOfItems,
        editDeliveryDate: formData.editDeliveryDate
      };

      console.log('Submitting order data:', orderData);

      if (mode === 'add') {
        await addMultipleOrders(orderData);
        alert(`Successfully created ${formData.numberOfItems} order(s)!`);
      } else if (mode === 'edit' && order) {
        await updateOrder(order.id, orderData);
        alert('Order updated successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save order. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Supabase not configured')) {
          errorMessage = 'Database not configured. Please create a .env file with your Supabase credentials:\n\nVITE_SUPABASE_URL=your_supabase_url\nVITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\nCheck SUPABASE_SETUP.md for detailed instructions.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Permission denied. Please check your database permissions.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'An order with this ID already exists. Please try again.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Customer not found. Please select a valid customer.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              <div className="flex gap-2 items-center">
                <span
                  className="text-sm text-pink-700 underline cursor-pointer hover:text-pink-900"
                  onClick={() => navigate(`/customers/${selectedCustomer.id}`)}
                >
                  {selectedCustomer.name}
                </span>
                {order?.orderId && (
                  <span
                    className="text-sm text-blue-700 underline cursor-pointer hover:text-blue-900"
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                  >
                    #{order.orderId}
                  </span>
                )}
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, orderType: 'regular' })}
                  className={`w-full p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center whitespace-normal break-words h-full min-h-[100px] max-w-full ${
                    formData.orderType === 'regular'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <Package className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Regular</span>
                  <p className="text-xs text-gray-500 mt-1 text-center">7 days delivery</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, orderType: 'emergency' })}
                  className={`w-full p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center whitespace-normal break-words h-full min-h-[100px] max-w-full ${
                    formData.orderType === 'emergency'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-200'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Emergency</span>
                  <p className="text-xs text-gray-500 mt-1 text-center">Custom delivery</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, orderType: 'alter' })}
                  className={`w-full p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center whitespace-normal break-words h-full min-h-[100px] max-w-full ${
                    formData.orderType === 'alter'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <Scissors className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-medium">Alter</span>
                  <p className="text-xs text-gray-500 mt-1 text-center">Editable delivery</p>
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
                <option value="lahenga">Lahenga</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. of Items *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 rounded-l-lg border border-gray-300 text-lg font-bold hover:bg-pink-100"
                  onClick={() => setFormData({ ...formData, numberOfItems: Math.max(1, formData.numberOfItems - 1) })}
                  tabIndex={-1}
                >
                  -
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.numberOfItems}
                  onChange={(e) => setFormData({ ...formData, numberOfItems: Math.max(1, Math.min(35, parseInt(e.target.value) || 1)) })}
                  className="w-20 text-center px-2 py-3 border-t border-b border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="1"
                  max="35"
                  required
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 rounded-r-lg border border-gray-300 text-lg font-bold hover:bg-pink-100"
                  onClick={() => setFormData({ ...formData, numberOfItems: Math.min(35, formData.numberOfItems + 1) })}
                  tabIndex={-1}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Size Book */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size Book No.
            </label>
            <input
              type="text"
              value={formData.sizeBookNo}
              onChange={(e) => setFormData({ ...formData, sizeBookNo: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter size book number"
            />
          </div>

          {/* Delivery Date and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.orderType === 'regular' ? 'Expected Delivery Date' : 
                 formData.orderType === 'alter' ? 'Delivery Date' : 'Delivery Date'} *
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.orderType === 'regular' && !formData.editDeliveryDate 
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : formData.deliveryDate
                  }
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    (formData.orderType === 'regular' && !formData.editDeliveryDate) ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  disabled={(formData.orderType === 'regular' && !formData.editDeliveryDate)}
                  required={formData.orderType === 'emergency' || 
                           (formData.orderType === 'regular' && formData.editDeliveryDate) ||
                           (formData.orderType === 'alter' && formData.editDeliveryDate)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {formData.orderType === 'regular' && !formData.editDeliveryDate && (
                <p className="text-sm text-gray-500 mt-1">
                  Delivery date will be automatically set to 7 days from given date
                </p>
              )}
              {(formData.orderType === 'regular' || formData.orderType === 'alter') && !formData.editDeliveryDate && (
                <p className="text-sm text-gray-500 mt-1">
                  Check "Edit Delivery Date" to set a custom delivery date
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
                <p className="text-xs text-gray-500 mt-1 ml-2">Per {formData.materialType ? formData.materialType.charAt(0).toUpperCase() + formData.materialType.slice(1) : 'Material'}</p>
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

          {/* Edit Delivery Date for Regular and Alter Orders */}
          {(formData.orderType === 'regular' || formData.orderType === 'alter') && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="editDeliveryDate"
                checked={formData.editDeliveryDate}
                onChange={(e) => setFormData({ ...formData, editDeliveryDate: e.target.checked })}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="editDeliveryDate" className="text-sm font-medium text-gray-700">
                Edit Delivery Date?
              </label>
            </div>
          )}

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
              disabled={isSubmitting}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === 'add' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'add' ? 'Create Order' : mode === 'edit' ? 'Update Order' : 'View Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;