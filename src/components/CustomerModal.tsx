import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Phone, MessageCircle, MapPin, FileText, Plus, Trash2 } from 'lucide-react';
import { Customer } from '../types';
import OrderModal from './OrderModal';
import { useNotification } from './Layout';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  mode: 'add' | 'edit' | 'view';
}

interface PhoneNumber {
  id: string;
  number: string;
  isWhatsApp: boolean;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer, mode }) => {
  const { addCustomer, updateCustomer, getCustomerOrderCount, orders } = useData();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsappNumber: '',
    whatsappEnabled: false,
    address: '',
    notes: '',
    customerId: ''
  });
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    { id: '1', number: '', isWhatsApp: false }
  ]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notification = useNotification();

  // Get customer's orders and order count
  const customerOrders = customer ? orders.filter(order => order.customerId === customer.id) : [];
  const customerOrderCount = customer ? getCustomerOrderCount(customer.id) : 0;

  useEffect(() => {
    if (customer && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        whatsappNumber: customer.whatsappNumber || '',
        whatsappEnabled: customer.whatsappEnabled,
        address: customer.address || '',
        notes: customer.notes || '',
        customerId: customer.customerId
      });
      
      // Parse phone numbers from customer data
      if (customer.phone) {
        const numbers = customer.phone.split(',').map((num, index) => ({
          id: String(index + 1),
          number: num.trim(),
          isWhatsApp: customer.whatsappNumber === num.trim()
        }));
        setPhoneNumbers(numbers.length > 0 ? numbers : [{ id: '1', number: '', isWhatsApp: false }]);
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        whatsappNumber: '',
        whatsappEnabled: false,
        address: '',
        notes: '',
        customerId: ''
      });
      setPhoneNumbers([{ id: '1', number: '', isWhatsApp: false }]);
    }
  }, [customer, mode, isOpen]);

  const addPhoneNumber = () => {
    const newId = String(phoneNumbers.length + 1);
    setPhoneNumbers([...phoneNumbers, { id: newId, number: '', isWhatsApp: false }]);
  };

  const removePhoneNumber = (id: string) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter(phone => phone.id !== id));
    }
  };

  const updatePhoneNumber = (id: string, field: 'number' | 'isWhatsApp', value: string | boolean) => {
    setPhoneNumbers(phoneNumbers.map(phone => 
      phone.id === id ? { ...phone, [field]: value } : phone
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one phone number is provided
    const validPhoneNumbers = phoneNumbers.filter(phone => phone.number.trim() !== '');
    if (validPhoneNumbers.length === 0) {
      alert('Please enter at least one phone number.');
      return;
    }

    // Get the primary phone number (first one)
    const primaryPhone = validPhoneNumbers[0].number;
    
    // Get the WhatsApp number (the one marked as WhatsApp)
    const whatsAppPhone = validPhoneNumbers.find(phone => phone.isWhatsApp)?.number || primaryPhone;
    
    // Combine all phone numbers into a comma-separated string
    const allPhoneNumbers = validPhoneNumbers.map(phone => phone.number).join(', ');
    
    const submitData = {
      ...formData,
      phone: allPhoneNumbers,
      whatsappNumber: whatsAppPhone,
      whatsappEnabled: true
    };
    
    notification.show('Submitting customer form...');
    
    try {
      setIsSubmitting(true);
      
      if (mode === 'add') {
        notification.show('Adding customer...');
        await addCustomer(submitData);
        notification.show('Customer added successfully!');
      } else if (mode === 'edit' && customer) {
        notification.show('Updating customer...');
        await updateCustomer(customer.id, submitData);
        notification.show('Customer updated successfully');
        alert('Customer updated successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      if (error instanceof Error && error.message.includes('Supabase not configured')) {
        alert('Database not configured. Please create a .env file with your Supabase credentials:\n\nVITE_SUPABASE_URL=your_supabase_url\nVITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\nCheck SUPABASE_SETUP.md for detailed instructions.');
      } else {
        alert('Failed to save customer. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOrder = () => {
    setIsOrderModalOpen(true);
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const title = mode === 'add' ? 'Add New Customer' : mode === 'edit' ? 'Edit Customer' : 'Customer Details';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer ID Display */}
            {customer && (
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-pink-700 font-medium">Customer ID: {customer.customerId}</p>
                <p className="text-xs text-pink-600">Created: {new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 disabled:bg-gray-50"
                  required
                  disabled={isViewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Numbers *
                </label>
                <div className="space-y-3">
                  {phoneNumbers.map((phone, index) => (
                    <div key={phone.id} className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone.number}
                          onChange={(e) => updatePhoneNumber(phone.id, 'number', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 disabled:bg-gray-50"
                          placeholder="Enter phone number"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`whatsapp-${phone.id}`}
                          checked={phone.isWhatsApp}
                          onChange={(e) => {
                            // Uncheck all other checkboxes
                            setPhoneNumbers(phoneNumbers.map(p => ({
                              ...p,
                              isWhatsApp: p.id === phone.id ? e.target.checked : false
                            })));
                          }}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          disabled={isViewMode}
                        />
                        <label htmlFor={`whatsapp-${phone.id}`} className="text-sm text-gray-600 flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          WhatsApp
                        </label>
                      </div>
                      {phoneNumbers.length > 1 && !isViewMode && (
                        <button
                          type="button"
                          onClick={() => removePhoneNumber(phone.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove phone number"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addPhoneNumber}
                      className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Phone Number
                    </button>
                  )}
                </div>
              </div>
            </div>



            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 disabled:bg-gray-50"
                  rows={3}
                  placeholder="Enter customer address"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Order History for View Mode */}
            {isViewMode && customer && customerOrderCount > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Order History</h3>
                  <span className="bg-pink-100 text-pink-800 text-sm font-medium px-2 py-1 rounded-full">
                    {customerOrderCount} orders
                  </span>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {customerOrders.map(order => (
                    <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{order.orderId}</p>
                          <p className="text-sm text-gray-600">{order.materialType} - {order.description}</p>
                          <p className="text-xs text-gray-500">
                            Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.isDelivered ? 'Delivered' : order.currentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {isViewMode && customer && (
                  <button
                    type="button"
                    onClick={handleAddOrder}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Order
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>
                {!isViewMode && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {mode === 'add' ? 'Adding...' : 'Updating...'}
                      </>
                    ) : (
                      mode === 'add' ? 'Add Customer' : 'Update Customer'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Order Modal */}
      {isOrderModalOpen && customer && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          customer={customer}
        />
      )}
    </>
  );
};

export default CustomerModal;