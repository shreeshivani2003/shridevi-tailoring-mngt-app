import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from './Layout';
import {
  Search,
  CheckCircle,
  Clock,
  Package,
  MessageCircle,
  Image as ImageIcon,
  Plus,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { materialStages, MaterialType, OrderType } from '../types';
import { useNavigate } from 'react-router-dom';

const Status: React.FC = () => {
  const { orders, updateOrderStatus, customers, getDeliveredOrders, getReadyForDeliveryOrders } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notification = useNotification();

  // Admin filters and state
  const [search, setSearch] = useState('');
  const [materialType, setMaterialType] = useState('all');
  const [section, setSection] = useState('all');
  const [statusStage, setStatusStage] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [waImages, setWaImages] = useState<{[orderId: string]: string[]}>({});
  const [waMsg, setWaMsg] = useState<{[orderId: string]: string}>({});
  const [showDeliveryBucket, setShowDeliveryBucket] = useState(false);
  const [multiStageSelection, setMultiStageSelection] = useState<{[orderId: string]: string[]}>({});

  // User-only state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [billImages, setBillImages] = useState<string[]>(['']);

  // Helper: get all unique status stages
  const allStages = useMemo(() => {
    const stages = new Set<string>();
    orders.forEach(o => {
      const stagesArr = materialStages[o.materialType as keyof typeof materialStages];
      if (stagesArr) {
        stagesArr.forEach(s => stages.add(s));
      } else {
        console.warn('Unknown material type:', o.materialType, o);
      }
    });
    return Array.from(stages);
  }, [orders]);

  // Helper: get phone from customer
  const getPhone = (order: any) => {
    const customer = customers.find(c => c.id === order.customerId);
    return customer?.phone || '';
  };

  // Get delivered and ready for delivery orders
  const deliveredOrders = useMemo(() => getDeliveredOrders(), [orders, getDeliveredOrders]);
  const readyForDeliveryOrders = useMemo(() => getReadyForDeliveryOrders(), [orders, getReadyForDeliveryOrders]);

  // Filtered orders for admin (excluding delivered orders)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (search) {
        const s = search.toLowerCase();
        if (!(
          order.customerName.toLowerCase().includes(s) ||
          getPhone(order).includes(s) ||
          order.orderId.toLowerCase().includes(s)
        )) return false;
      }
      if (materialType !== 'all' && order.materialType !== materialType) return false;
      if (section !== 'all' && order.orderType !== section) return false;
      if (statusStage !== 'all' && order.currentStatus !== statusStage) return false;
      return !order.isDelivered;
    });
  }, [orders, search, materialType, section, statusStage]);

  // Kanban data
  const kanban = useMemo(() => {
    const byStage: {[stage: string]: any[]} = {};
    allStages.forEach(stage => byStage[stage] = []);
    orders.forEach(order => {
      if (!order.isDelivered) byStage[order.currentStatus]?.push(order);
    });
    return byStage;
  }, [orders, allStages]);

  // Define the fixed order for process tracking
  const processStages = [
    'Initial Checking',
    'Marking',
    'Cutting',
    'Work',
    'Stitching',
    'In Process',
    'Hemming',
    'Final Checking',
  ];

  // Status update logic with automatic WhatsApp
  const handleStatusUpdate = async (order: any) => {
    console.log('handleStatusUpdate called for order:', order);
    // Find the next status
    const stages = materialStages[order.materialType as keyof typeof materialStages];
    let currentIdx = stages.indexOf(order.currentStatus);
    if (currentIdx === -1) currentIdx = 0;
    const nextIdx = currentIdx + 1;
    const nextStatus = stages[nextIdx];

    // Find customer and log
    const customer = customers.find(c => c.id === order.customerId);
    console.log('Customer found:', customer);
    const waNumber = customer ? (customer.whatsappNumber || customer.phone) : '';

    if (nextStatus) {
      if (customer) {
        console.log('whatsappEnabled:', customer.whatsappEnabled, 'whatsappNumber:', customer.whatsappNumber, 'waNumber used:', waNumber);
      }
      if (customer && customer.whatsappEnabled && waNumber) {
        const msg = `Hello ${order.customerName},%0AOrder ID: *${order.orderId}*%0AStatus: *${nextStatus}*%0AMaterial: ${order.materialType}`;
        const url = `https://wa.me/${waNumber}?text=${msg}`;
        console.log('Opening WhatsApp:', url);
        window.open(url, '_blank');
        notification.show(`WhatsApp message sent for status: ${nextStatus}`);
      }
      try {
        const result = await updateOrderStatus(order.orderId, 'next');
        if (result.isFinalStage) {
          const customer = customers.find(c => c.id === order.customerId);
          const waNumber = customer ? (customer.whatsappNumber || customer.phone) : '';
          if (customer && customer.whatsappEnabled && waNumber) {
            const defaultMessage = `Hello ${result.order.customerName}!\n\nYour order ${result.order.orderId} (${result.order.materialType}) is ready for delivery.\nThank you for choosing Shri Devi Tailoring!\nFor picking, please come to the shop between 10am-6pm.`;
            const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`;
            console.log('Opening WhatsApp for final stage:', url);
            window.open(url, '_blank');
            notification.show(`Order ${result.order.orderId} completed! WhatsApp message will be sent automatically.`);
          }
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        notification.show('Error updating order status');
      }
    } else {
      if (customer) {
        console.log('whatsappEnabled:', customer.whatsappEnabled, 'whatsappNumber:', customer.whatsappNumber, 'waNumber used:', waNumber);
      }
      // If already at final stage, still send the final WhatsApp message
      if (customer && customer.whatsappEnabled && waNumber) {
        const defaultMessage = `Hello ${order.customerName}!\n\nYour order ${order.orderId} (${order.materialType}) is ready for delivery.\nThank you for choosing Shri Devi Tailoring!\nFor picking, please come to the shop between 10am-6pm.`;
        const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`;
        console.log('Opening WhatsApp for final stage (already final):', url);
        window.open(url, '_blank');
        notification.show('Order is already at final stage. WhatsApp message sent.');
      } else {
        notification.show('Already at final stage.');
      }
    }
  };

  // WhatsApp logic
  const handleWhatsAppSend = (order: any) => {
    const phone = getPhone(order);
    const msg = waMsg[order.orderId] || `Hello ${order.customerName}!\n\nYour order ${order.orderId} (${order.materialType}) is ready for delivery.\nThank you for choosing Shri Devi Tailoring!\nFor picking, please come to the shop between 10am-6pm.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    notification.show('WhatsApp message sent!');
  };

  // User-only logic
  const handleUserSearch = () => {
    if (!searchQuery.trim()) return;
    const order = orders.find(o => o.orderId.toLowerCase() === searchQuery.toLowerCase().trim());
    if (order) {
      setSelectedOrder(order);
      setWhatsappMessage(`Hello ${order.customerName}!\n\nYour order ${order.orderId} (${order.materialType}) is ready for delivery.\nThank you for choosing Shri Devi Tailoring!\nFor picking, please come to the shop between 10am-6pm.`);
    } else {
      notification.show('Order not found. Please check the Order ID.');
      setSelectedOrder(null);
    }
  };

  const getStatusProgress = (order: any) => {
    const stages = materialStages[order.materialType as keyof typeof materialStages];
    let currentIndex = stages.indexOf(order.currentStatus);
    
    // If current status not found, try to migrate old status names
    if (currentIndex === -1) {
      // Handle old "Checking" status - determine if it's first or second checking
      if (order.currentStatus === 'Checking') {
        // Check status history to determine if this is first or second checking
        const hasCompletedStages = order.statusHistory.some((status: any) => 
          ['Cutting', 'Stitching', 'Hemming', 'Work'].includes(status.stage)
        );
        
        if (hasCompletedStages) {
          // This is likely the second checking (Final Checking)
          currentIndex = stages.indexOf('Final Checking');
        } else {
          // This is likely the first checking (Initial Checking)
          currentIndex = stages.indexOf('Initial Checking');
        }
      } else {
        // For other unknown statuses, default to first stage
        currentIndex = 0;
      }
    }
    
    return ((currentIndex + 1) / stages.length) * 100;
  };

  // Admin/super_admin view
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return (
      <div className="space-y-6">
        {/* Top: Filters & Search */}
        <div className="sticky top-0 z-10 bg-white shadow p-4 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search customer, phone, order ID"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <select value={materialType} onChange={e => setMaterialType(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
              <option value="all">All Materials</option>
              <option value="blouse">Blouse</option>
              <option value="chudi">Chudi</option>
              <option value="saree">Saree</option>
              <option value="works">Works</option>
              <option value="others">Others</option>
            </select>
            <select value={section} onChange={e => setSection(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
              <option value="all">All Sections</option>
              <option value="regular">Regular</option>
              <option value="emergency">Emergency</option>
              <option value="alter">Alter</option>
            </select>
            <select value={statusStage} onChange={e => setStatusStage(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
              <option value="all">All Stages</option>
              {allStages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>
          <button onClick={() => { setSearch(''); setMaterialType('all'); setSection('all'); setStatusStage('all'); }} className="px-3 py-1.5 bg-gray-100 rounded border text-sm">Clear Filters</button>
        </div>

        {/* Middle: Status Update Section */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold mb-4">Pending Orders</h2>
          <div className="space-y-2">
            {filteredOrders.length === 0 && (
              <div className="text-center py-6 text-gray-400">No orders found</div>
            )}
            {filteredOrders.map(order => {
              const isExpanded = expandedOrderId === order.orderId;
              const stages = materialStages[order.materialType as keyof typeof materialStages];
              let currentIdx = stages.indexOf(order.currentStatus);
              
              // If current status not found, try to migrate old status names
              if (currentIdx === -1) {
                // Handle old "Checking" status - determine if it's first or second checking
                if (order.currentStatus === 'Checking') {
                  // Check status history to determine if this is first or second checking
                  const hasCompletedStages = order.statusHistory.some((status: any) => 
                    ['Cutting', 'Stitching', 'Hemming', 'Work'].includes(status.stage)
                  );
                  
                  if (hasCompletedStages) {
                    // This is likely the second checking (Final Checking)
                    currentIdx = stages.indexOf('Final Checking');
                  } else {
                    // This is likely the first checking (Initial Checking)
                    currentIdx = stages.indexOf('Initial Checking');
                  }
                } else {
                  // For other unknown statuses, default to first stage
                  currentIdx = 0;
                }
              }
              
              const isFinal = currentIdx === stages.length - 1;
              const overdue = new Date(order.deliveryDate) < new Date() && !order.isDelivered;
              return (
                <div key={order.orderId} className={`border rounded-lg ${overdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  {/* Order Row */}
                  <div className="p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500 text-xs">Customer</div>
                        <div className="text-blue-700 underline cursor-pointer truncate" onClick={() => navigate(`/customers/${order.customerId}`)}>{order.customerName}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Order ID</div>
                        <div className="text-pink-700 underline cursor-pointer truncate" onClick={() => navigate(`/orders/${order.orderId}`)}>{order.orderId}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Material</div>
                        <div className="truncate">{order.materialType}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Section</div>
                        <div className="capitalize truncate">{order.orderType}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Status</div>
                        <div className="truncate">{order.currentStatus}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-gray-500 text-xs">Delivery</div>
                          <div className={`font-medium ${overdue ? 'text-red-600' : ''}`}>{new Date(order.deliveryDate).toLocaleDateString()}</div>
                        </div>
                        <button onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)} className="text-gray-500 hover:text-pink-600 ml-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-white p-3 border-t">
                      {/* Progress Bar & Checklist */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(((currentIdx + 1) / stages.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div className="bg-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentIdx + 1) / stages.length) * 100}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                          {stages.map((stage, idx) => (
                            <div key={stage} className={`text-center py-0.5 rounded text-xs ${idx < currentIdx ? 'bg-green-100 text-green-700' : idx === currentIdx ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}>{stage}</div>
                          ))}
                        </div>
                      </div>
                      {/* Status Update Button */}
                      {!isFinal && (
                        <button onClick={() => handleStatusUpdate(order)} className="bg-green-500 text-white px-3 py-1 rounded font-medium hover:bg-green-600 transition-all text-xs">Mark Next Step Complete</button>
                      )}
                      {/* WhatsApp on Final Stage */}
                      {isFinal && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-xs">Send WhatsApp Message</span>
                          </div>
                          <textarea
                            value={waMsg[order.orderId] || `Hello ${order.customerName}!\n\nYour order ${order.orderId} (${order.materialType}) is ready for delivery.\nThank you for choosing Shri Devi Tailoring!\nFor picking, please come to the shop between 10am-6pm.`}
                            onChange={e => setWaMsg(m => ({ ...m, [order.orderId]: e.target.value }))}
                            className="w-full px-2 py-1 border rounded mb-1 text-xs"
                            rows={2}
                          />
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">Bill Images (up to 10)</span>
                              <button onClick={() => setWaImages(imgs => ({ ...imgs, [order.orderId]: [...(imgs[order.orderId] || []), ''] }))} disabled={(waImages[order.orderId]?.length || 0) >= 10} className="text-pink-600 hover:text-pink-700 disabled:text-gray-400"><Plus className="w-3 h-3" /></button>
                            </div>
                            <div className="space-y-1">
                              {(waImages[order.orderId] || ['']).map((img, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <ImageIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <input
                                    type="url"
                                    value={img}
                                    onChange={e => setWaImages(imgs => ({ ...imgs, [order.orderId]: (imgs[order.orderId] || []).map((v, i) => i === idx ? e.target.value : v) }))}
                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                    placeholder="Image URL..."
                                  />
                                  <button onClick={() => setWaImages(imgs => ({ ...imgs, [order.orderId]: (imgs[order.orderId] || []).filter((_, i) => i !== idx) }))} className="text-red-500 hover:text-red-700 flex-shrink-0">×</button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => handleWhatsAppSend(order)} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded font-medium hover:from-green-600 hover:to-green-700 flex items-center gap-2 mt-1 text-xs"><Send className="w-3 h-3" />Send WhatsApp</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: Kanban/Pipeline View */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold mb-4">Process Tracking</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processStages.map(stage => (
              <div key={stage} className="bg-gray-50 rounded-lg border p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-700 text-sm">{stage}</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-bold">{kanban[stage]?.length || 0}</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {kanban[stage]?.map(order => {
                    const overdue = new Date(order.deliveryDate) < new Date() && !order.isDelivered;
                    return (
                      <div key={order.orderId} className={`p-2 rounded-lg border cursor-pointer ${overdue ? 'bg-red-100 border-red-400' : 'bg-white border-gray-200'} hover:shadow text-xs`}>
                        <div className="space-y-1">
                          <div className="text-pink-700 font-semibold underline cursor-pointer truncate" onClick={() => navigate(`/orders/${order.orderId}`)}>{order.orderId}</div>
                          <div className="text-blue-700 underline cursor-pointer truncate" onClick={() => navigate(`/customers/${order.customerId}`)}>{order.customerName}</div>
                          <div className="text-gray-500">{order.materialType} | {order.orderType}</div>
                          <div className={`font-bold ${overdue ? 'text-red-600' : 'text-gray-700'}`}>Due: {new Date(order.deliveryDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  {(!kanban[stage] || kanban[stage].length === 0) && (
                    <div className="text-center text-xs text-gray-400 py-4">No orders</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Bucket Section */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Delivery Management</h2>
            <button
              onClick={() => setShowDeliveryBucket(!showDeliveryBucket)}
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              {showDeliveryBucket ? 'Hide' : 'Show'} Delivery Bucket
            </button>
          </div>
          
          {showDeliveryBucket && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ready for Delivery */}
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-yellow-800">Ready for Delivery</h3>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                    {readyForDeliveryOrders.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {readyForDeliveryOrders.length === 0 ? (
                    <div className="text-center text-xs text-yellow-600 py-4">No orders ready for delivery</div>
                  ) : (
                    readyForDeliveryOrders.map(order => (
                      <div key={order.orderId} className="p-3 bg-white rounded-lg border border-yellow-300 hover:shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-pink-700 font-semibold text-sm underline cursor-pointer" onClick={() => navigate(`/orders/${order.orderId}`)}>
                              {order.orderId}
                            </div>
                            <div className="text-blue-700 text-sm underline cursor-pointer" onClick={() => navigate(`/customers/${order.customerId}`)}>
                              {order.customerName}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {order.materialType} | {order.orderType}
                            </div>
                            <div className="text-gray-500 text-xs">
                              Due: {new Date(order.deliveryDate).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleWhatsAppSend(order)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 transition-colors"
                          >
                            Send WA
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivered Orders */}
              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-green-800">Delivered Orders</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                    {deliveredOrders.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveredOrders.length === 0 ? (
                    <div className="text-center text-xs text-green-600 py-4">No delivered orders</div>
                  ) : (
                    deliveredOrders.slice(0, 10).map(order => (
                      <div key={order.orderId} className="p-3 bg-white rounded-lg border border-green-300 hover:shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-pink-700 font-semibold text-sm underline cursor-pointer" onClick={() => navigate(`/orders/${order.orderId}`)}>
                              {order.orderId}
                            </div>
                            <div className="text-blue-700 text-sm underline cursor-pointer" onClick={() => navigate(`/customers/${order.customerId}`)}>
                              {order.customerName}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {order.materialType} | {order.orderType}
                            </div>
                            <div className="text-gray-500 text-xs">
                              Delivered: {new Date(order.deliveryDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-green-600 text-xs font-medium">
                            ✓ Delivered
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {deliveredOrders.length > 10 && (
                    <div className="text-center text-xs text-green-600 py-2">
                      +{deliveredOrders.length - 10} more delivered orders
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User role: status check only
  if (user?.role === 'user') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Order Status</h1>
          <div className="text-sm text-gray-600">Status Check Only</div>
        </div>
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
                onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
              />
            </div>
            <button
              onClick={handleUserSearch}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105"
            >
              Search
            </button>
          </div>
        </div>
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
                  <p className="text-xl font-bold">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm text-pink-100 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(getStatusProgress(selectedOrder))}%</span>
                </div>
                <div className="w-full bg-pink-300 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${getStatusProgress(selectedOrder)}%` }}></div>
                </div>
              </div>
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
  }

  return null;
};

export default Status;