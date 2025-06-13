import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  CheckCircle, 
  Clock, 
  Package, 
  MessageCircle, 
  Image as ImageIcon,
  Plus,
  Send
} from 'lucide-react';
import { materialStages } from '../types';

const Status: React.FC = () => {
  const { orders, updateOrderStatus } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [billImages, setBillImages] = useState<string[]>(['']);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const order = orders.find(o => 
      o.orderId.toLowerCase() === searchQuery.toLowerCase().trim()
    );
    
    if (order) {
      setSelectedOrder(order);
      setWhatsappMessage(generateDefaultMessage(order));
    } else {
      alert('Order not found. Please check the Order ID.');
      setSelectedOrder(null);
    }
  };

  const generateDefaultMessage = (order: any) => {
    return `Hello ${order.customerName}! 

Your order ${order.orderId} (${order.materialType}) is ready for delivery.

Thank you for choosing Shri Devi Tailoring!`;
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!selectedOrder) return;
    
    updateOrderStatus(selectedOrder.orderId, newStatus, statusNotes);
    
    // Refresh the selected order
    const updatedOrder = orders.find(o => o.orderId === selectedOrder.orderId);
    setSelectedOrder(updatedOrder);
    setStatusNotes('');
  };

  const handleImageAdd = () => {
    if (billImages.length < 10) {
      setBillImages([...billImages, '']);
    }
  };

  const handleImageRemove = (index: number) => {
    setBillImages(billImages.filter((_, i) => i !== index));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...billImages];
    newImages[index] = value;
    setBillImages(newImages);
  };

  const handleWhatsAppSend = () => {
    if (!selectedOrder) return;
    
    const validImages = billImages.filter(img => img.trim() !== '');
    const phone = selectedOrder.whatsappNumber || selectedOrder.phone;
    
    // In a real app, this would integrate with WhatsApp Business API
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    alert('WhatsApp message sent successfully!');
  };

  const getStatusProgress = (order: any) => {
    const stages = materialStages[order.materialType];
    const currentIndex = stages.indexOf(order.currentStatus);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const canUpdateStatus = user?.role === 'super_admin' || user?.role === 'admin';
  const isDeliveryStage = selectedOrder?.currentStatus === 'Delivery';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Order Status</h1>
        <div className="text-sm text-gray-600">
          {user?.role === 'user' ? 'Status Check Only' : 'Status Management'}
        </div>
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Order ID (e.g., ORD001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105"
          >
            Search
          </button>
        </div>
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedOrder.orderId}</h2>
                <p className="text-pink-100">{selectedOrder.customerName}</p>
                <p className="text-pink-100 capitalize">{selectedOrder.materialType} - {selectedOrder.description}</p>
              </div>
              <div className="text-right">
                <p className="text-pink-100">Delivery Date</p>
                <p className="text-xl font-bold">
                  {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-pink-100 mb-2">
                <span>Progress</span>
                <span>{Math.round(getStatusProgress(selectedOrder))}%</span>
              </div>
              <div className="w-full bg-pink-300 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getStatusProgress(selectedOrder)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Status Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Timeline</h3>
              <div className="space-y-4">
                {materialStages[selectedOrder.materialType].map((stage, index) => {
                  const isCompleted = selectedOrder.statusHistory.some((h: any) => h.stage === stage);
                  const isCurrent = selectedOrder.currentStatus === stage;
                  const statusEntry = selectedOrder.statusHistory.find((h: any) => h.stage === stage);
                  
                  return (
                    <div key={stage} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCompleted ? 'text-green-700' : isCurrent ? 'text-yellow-700' : 'text-gray-500'
                        }`}>
                          {stage}
                        </p>
                        {statusEntry && (
                          <div className="text-sm text-gray-600">
                            <p>{new Date(statusEntry.completedAt).toLocaleString()}</p>
                            {statusEntry.notes && <p className="italic">{statusEntry.notes}</p>}
                          </div>
                        )}
                      </div>

                      {canUpdateStatus && !isCompleted && (
                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <>
                              <input
                                type="text"
                                placeholder="Optional notes..."
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                              />
                              <button
                                onClick={() => handleStatusUpdate(stage)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          
                          {!isCurrent && index === materialStages[selectedOrder.materialType].findIndex(s => s === selectedOrder.currentStatus) + 1 && (
                            <button
                              onClick={() => handleStatusUpdate(stage)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              Mark as Current
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WhatsApp Section - Only for Delivery Stage */}
            {isDeliveryStage && canUpdateStatus && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-800">WhatsApp Notification</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      rows={4}
                      placeholder="Enter WhatsApp message..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Bill Images (up to 10)
                      </label>
                      <button
                        onClick={handleImageAdd}
                        disabled={billImages.length >= 10}
                        className="text-pink-600 hover:text-pink-700 disabled:text-gray-400"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {billImages.map((image, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <input
                            type="url"
                            value={image}
                            onChange={(e) => handleImageChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                            placeholder="Enter image URL..."
                          />
                          <button
                            onClick={() => handleImageRemove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleWhatsAppSend}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send WhatsApp Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedOrder && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Enter an Order ID to check status</p>
        </div>
      )}
    </div>
  );
};

export default Status;