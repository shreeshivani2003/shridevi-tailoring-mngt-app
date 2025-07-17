import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle,
  Upload,
  X,
  Calendar,
  DollarSign,
  User,
  Package,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  History,
  Edit,
  Copy,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { Order, Customer, MaterialType, materialStages } from '../types';
import OrderModal from './OrderModal';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, customers, deleteOrder, updateOrderStatus } = useData();
  const { user } = useAuth();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');

  const order = orders.find(o => o.orderId === orderId);
  const customer = order ? customers.find(c => c.id === order.customerId) : null;
  const customerOrders = customer && order ? orders.filter(o => o.customerId === customer.id && o.id !== order.id) : [];
  const isSuperAdmin = user?.role === 'super_admin';

  if (!order || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const getStagesForMaterial = (materialType: MaterialType) => {
    return materialStages[materialType] || [];
  };

  const getCurrentStageIndex = (stages: string[]) => {
    return stages.findIndex(stage => stage === order.currentStatus);
  };

  const isFinalStage = (stages: string[]) => {
    const currentIndex = getCurrentStageIndex(stages);
    return currentIndex === stages.length - 1;
  };

  const handleWhatsAppSend = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to send.');
      return;
    }

    const message = `Order ${order.orderId} - ${order.materialType} is ready for delivery!`;
    const whatsappNumber = customer.whatsappNumber || customer.phone;
    
    // Create WhatsApp URL with message and images
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            if (newImages.length === files.length) {
              setUploadedImages(prev => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl) 
        ? prev.filter(img => img !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleDuplicateOrder = () => {
    // Navigate to add order with pre-filled data
    navigate('/orders/add', { 
      state: { 
        duplicateFrom: order,
        customer: customer 
      } 
    });
  };

  const handleDeleteOrder = async () => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can delete orders');
      return;
    }
    
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await deleteOrder(order.id);
        alert('Order deleted successfully');
        navigate('/orders');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  const handleMarkAsDelivered = async () => {
    if (confirm('Mark this order as delivered?')) {
      try {
        const result = await updateOrderStatus(order.orderId, 'Delivery', 'Order marked as delivered');
        alert('Order marked as delivered successfully');
        
        // If this was the final stage, show WhatsApp message info
        if (result.isFinalStage) {
          const waNumber = customer?.whatsappNumber;
          const phone = customer?.phone || '';
          const defaultMessage = `Hello ${order.customerName}!\n\nYour order ${order.orderId} (${order.materialType}) is ready for delivery.\nThank you for choosing Shri Devi Tailoring!`;
          if (waNumber) {
            if (window.confirm('Send WhatsApp message to customer?')) {
              const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`;
              window.open(url, '_blank');
            }
          } else {
            alert('Customer does not have a WhatsApp number. Please call the customer at ' + phone + ' to notify about delivery.');
          }
        }
      } catch (error) {
        console.error('Error marking order as delivered:', error);
        alert('Failed to mark order as delivered');
      }
    }
  };

  const stages = getStagesForMaterial(order.materialType);
  const currentStageIndex = getCurrentStageIndex(stages);
  const isFinal = isFinalStage(stages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 px-4 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-800 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="font-medium">Back</span>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details & Customer Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => { setIsModalOpen(true); setModalMode('edit'); }}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{order.orderId}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Order Type</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.orderType === 'emergency' ? 'bg-red-100 text-red-800' : 
                      order.orderType === 'alter' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.orderType}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Material Type</p>
                    <p className="font-medium capitalize">{order.materialType}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Size Book No</p>
                    <p className="font-medium">{order.sizeBookNo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{order.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Given Date</p>
                    <p className="font-medium">{new Date(order.givenDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Date</p>
                    <p className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">₹{order.approximateAmount}</p>
                  </div>
                </div>
                
                {order.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium text-sm whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  </div>
                )}
                
                {order.referenceImage && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Reference Image</p>
                      <p className="font-medium text-sm text-blue-600">Available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Customer ID</p>
                    <p className="font-medium">{customer.customerId}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
                
                {customer.whatsappNumber && (
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <p className="font-medium">{customer.whatsappNumber}</p>
                    </div>
                  </div>
                )}
                
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-sm">{customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Order History */}
            {customerOrders.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Previous Orders</h2>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {customerOrders.length}
                  </span>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {customerOrders.map(prevOrder => (
                    <div key={prevOrder.orderId} className="bg-gray-50 rounded-lg p-3 flex items-center gap-4 border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{prevOrder.orderId}</p>
                        <p className="text-xs text-gray-600">{prevOrder.materialType} - {prevOrder.description}</p>
                        <p className="text-xs text-gray-500">{new Date(prevOrder.deliveryDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${prevOrder.isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{prevOrder.isDelivered ? 'Delivered' : prevOrder.currentStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Integration */}
            {isFinal && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Send selected images to customer via WhatsApp
                  </p>
                  <button
                    onClick={handleWhatsAppSend}
                    disabled={selectedImages.length === 0}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Send to WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status Tracker & Material Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Status Tracker */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Tracker</h2>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentStageIndex + 1) / stages.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stepper */}
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div key={stage} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      index < currentStageIndex 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : index === currentStageIndex 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {index < currentStageIndex ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        index <= currentStageIndex ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {stage}
                      </p>
                      {index === currentStageIndex && (
                        <p className="text-sm text-blue-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Current Stage
                        </p>
                      )}
                      {index < currentStageIndex && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reference Image Display */}
            {order.referenceImage && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reference Image</h2>
                <div className="relative">
                  <img
                    src={order.referenceImage}
                    alt="Reference"
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}

            {/* Bill Images */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Bill Images</h2>
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images
                </button>
              </div>
              
              {/* Image Upload Modal */}
              {showImageUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Upload Images</h3>
                      <button
                        onClick={() => setShowImageUpload(false)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full mb-4"
                    />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowImageUpload(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowImageUpload(false)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Bill ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => toggleImageSelection(image)}
                    />
                    
                    {/* Selection Overlay */}
                    {selectedImages.includes(image) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-50 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    {/* Watermark */}
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {order.orderId}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {/* Placeholder for more images */}
                {uploadedImages.length < 10 && (
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                       onClick={() => setShowImageUpload(true)}>
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Add Image</p>
                    </div>
                  </div>
                )}
              </div>
              
              {uploadedImages.length === 0 && (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No bill images uploaded yet</p>
                  <p className="text-sm text-gray-400">Upload up to 10 images</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <OrderModal
          isOpen={isModalOpen}
          order={order}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default OrderDetail; 