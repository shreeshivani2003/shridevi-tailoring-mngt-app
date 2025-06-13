import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { X, Calendar, DollarSign, FileText, Camera, Ruler } from 'lucide-react';
import { Customer, MaterialType, tamilSizeFields, SizeChart } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  order?: any;
  mode?: 'add' | 'edit';
}

const OrderModal: React.FC<OrderModalProps> = ({ 
  isOpen, 
  onClose, 
  customer, 
  order, 
  mode = 'add' 
}) => {
  const { addOrder, updateOrder } = useData();
  const [formData, setFormData] = useState({
    materialType: 'blouse' as MaterialType,
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

  React.useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        materialType: order.materialType,
        description: order.description,
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        approximateAmount: order.approximateAmount.toString(),
        notes: order.notes,
        referenceImage: order.referenceImage || ''
      });
      setSizes(order.sizes || {});
    }
  }, [order, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = {
      customerId: customer.id,
      customerName: customer.name,
      materialType: formData.materialType,
      description: formData.description,
      sizes,
      referenceImage: formData.referenceImage,
      notes: formData.notes,
      deliveryDate: new Date(formData.deliveryDate),
      givenDate: new Date(),
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'add' ? 'Add New Order' : 'Edit Order'}
            </h2>
            <p className="text-sm text-pink-600">{customer.name} ({customer.customerId})</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Material Type and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Delivery Date and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date *
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
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

          {/* Size Chart */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold text-gray-800">Measurements</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-pink-50 rounded-lg">
              {tamilSizeFields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {field.tamil} ({field.english})
                  </label>
                  <input
                    type="text"
                    value={sizes[field.key] || ''}
                    onChange={(e) => handleSizeChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="--"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Reference Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Image URL
            </label>
            <div className="relative">
              <Camera className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="url"
                value={formData.referenceImage}
                onChange={(e) => setFormData({ ...formData, referenceImage: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
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
              {mode === 'add' ? 'Create Order' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;