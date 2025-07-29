import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import CustomerModal from './CustomerModal';
import OrderModal from './OrderModal';
import { 
  User, 
  Phone, 
  MessageCircle, 
  Package, 
  TrendingUp, 
  Eye, 
  Edit, 
  Plus, 
  Search, 
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  MoreVertical,
  Star,
  MapPin,
  Mail
} from 'lucide-react';
import { Customer, Order } from '../types';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { 
    getCustomersWithOrderCounts, 
    searchCustomers, 
    customers, 
    orders,
    addOrder,
    batches,
    loading
  } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDeliveryInfo | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBatches, setShowBatches] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const { customerId } = useParams<{ customerId: string }>();

  // Define material priority order for listing
  const MATERIAL_PRIORITY = ['blouse', 'saree', 'works', 'lehenga', 'chudi', 'others'];

  // Extended customer type with delivery info
  type CustomerWithDeliveryInfo = Customer & {
    orderCount: number;
    nearestDelivery: Date | null;
    hasPendingOrders: boolean;
  };

  // Get customers with their order counts and sort by nearest delivery date
  const customersWithOrderCounts = getCustomersWithOrderCounts();
  
  // Get customers with their nearest delivery date
  const customersWithDeliveryInfo: CustomerWithDeliveryInfo[] = customersWithOrderCounts.map(customer => {
    const customerOrders = orders.filter(o => o.customerId === customer.id && !o.isDelivered);
    const nearestDelivery = customerOrders.length > 0 
      ? new Date(Math.min(...customerOrders.map(o => new Date(o.deliveryDate).getTime())))
      : null;
    
    return {
      ...customer,
      orderCount: customer.orderCount,
      nearestDelivery,
      hasPendingOrders: customerOrders.length > 0
    };
  });

  // Sort by nearest delivery date (customers with pending orders first, then by delivery date)
  const sortedCustomers = customersWithDeliveryInfo.sort((a, b) => {
    if (a.hasPendingOrders && !b.hasPendingOrders) return -1;
    if (!a.hasPendingOrders && b.hasPendingOrders) return 1;
    if (a.hasPendingOrders && b.hasPendingOrders) {
      return new Date(a.nearestDelivery!).getTime() - new Date(b.nearestDelivery!).getTime();
    }
    return 0;
  });

  const filteredCustomers: CustomerWithDeliveryInfo[] = searchQuery.trim() 
    ? searchCustomers(searchQuery).map(customer => {
        const fullCustomer = sortedCustomers.find(c => c.id === customer.id);
        return fullCustomer || { ...customer, orderCount: 0, nearestDelivery: null, hasPendingOrders: false };
      })
    : sortedCustomers;

  // If customerId is provided, show customer detail view
  if (customerId) {
    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer details...</p>
          </div>
        </div>
      );
    }
    
    const customer = customers.find(c => String(c.id) === String(customerId));
    const customerOrders = orders.filter(o => o.customerId === customerId && !o.isDelivered);
    const customerBatches = batches.filter(b => b.customer_id === customerId);
    
    const getBatches = (orders: Order[]): { batches: Record<string, Order[]>; unbatched: Order[] } => {
      const batchesMap: Record<string, Order[]> = {};
      orders.forEach((order: Order) => {
        const tag = order.batch_tag || '';
        if (tag) {
          if (!batchesMap[tag]) batchesMap[tag] = [];
          batchesMap[tag].push(order);
        }
      });
      const unbatched = orders.filter((o: Order) => !o.batch_tag);
      return { batches: batchesMap, unbatched };
    };
    
    if (!customer) {
      return (
        <div className="h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Customer Not Found</h2>
            <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/customers')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Back to Customers
            </button>
          </div>
        </div>
      );
    }

    const handleAddOrder = () => {
      setIsOrderModalOpen(true);
    };

    const handleOrderClick = (order: any) => {
      console.log('Navigating to order:', order.orderId);
      navigate(`/orders/${order.orderId}`);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/customers')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                  <p className="text-sm text-gray-600">Customer ID: {customer.customerId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const customerWithInfo: CustomerWithDeliveryInfo = {
                      ...customer,
                      orderCount: customerOrders.length,
                      nearestDelivery: customerOrders.length > 0 
                        ? new Date(Math.min(...customerOrders.map(o => new Date(o.deliveryDate).getTime())))
                        : null,
                      hasPendingOrders: customerOrders.length > 0
                    };
                    setSelectedCustomer(customerWithInfo);
                    setModalMode('edit');
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Customer
                </button>
                <button
                  onClick={handleAddOrder}
                  className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                    <p className="text-sm text-gray-600">Personal details and contact info</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Full Name</p>
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                      <p className="font-semibold text-gray-900">{customer.phone}</p>
                    </div>
                  </div>
                  
                  {customer.whatsappNumber && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">WhatsApp</p>
                        <p className="font-semibold text-gray-900">{customer.whatsappNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.address && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Address</p>
                        <p className="font-semibold text-gray-900 text-sm">{customer.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Package className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                      <p className="font-semibold text-gray-900">{customerOrders.length}</p>
                    </div>
                  </div>
                  
                  {customerBatches.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Active Batches</p>
                        <p className="font-semibold text-gray-900 text-sm">{customerBatches.map(b => b.batch_name).join(', ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                      <p className="text-sm text-gray-600">Current and completed orders</p>
                    </div>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        !showBatches ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setShowBatches(false)}
                    >
                      All Orders
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        showBatches ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                      onClick={() => setShowBatches(true)}
                    >
                      By Batch
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                      <p className="text-gray-600 mb-6">This customer hasn't placed any orders yet.</p>
                      <button
                        onClick={handleAddOrder}
                        className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
                      >
                        Create First Order
                      </button>
                    </div>
                  ) : showBatches ? (
                    // Grouped by Batch View
                    (() => {
                      const { batches: batchMap, unbatched } = getBatches(customerOrders);
                      const batchTags = customerBatches.map(b => b.batch_tag);
                      return (
                        <div className="space-y-4">
                          {batchTags.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No batches created yet.</p>
                            </div>
                          )}
                          {batchTags.map((tag, idx) => {
                            const batchName = customerBatches.find(b => b.batch_tag === tag)?.batch_name || `Batch ${idx + 1}`;
                            return (
                              <div key={tag} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-sm font-semibold text-purple-800">
                                    {batchName} <span className="text-xs text-purple-600">({tag})</span>
                                  </h3>
                                </div>
                                <div className="space-y-2">
                                  {batchMap[tag]?.map(order => (
                                    <div 
                                      key={order.id} 
                                      className="bg-white rounded-lg p-3 border border-purple-100 cursor-pointer hover:shadow-md transition-all"
                                      onClick={() => handleOrderClick(order)}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-sm">#{order.orderId}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                              order.materialType === 'blouse' ? 'bg-pink-100 text-pink-700' :
                                              order.materialType === 'saree' ? 'bg-purple-100 text-purple-700' :
                                              order.materialType === 'works' ? 'bg-blue-100 text-blue-700' :
                                              order.materialType === 'lehenga' ? 'bg-green-100 text-green-700' :
                                              order.materialType === 'chudi' ? 'bg-orange-100 text-orange-700' :
                                              'bg-gray-100 text-gray-700'
                                            }`}>
                                              {order.materialType}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600 mb-2">{order.description}</p>
                                          <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              <span>Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              <span>₹{order.approximateAmount}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            order.isDelivered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {order.isDelivered ? 'Ready' : 'Pending'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {unbatched.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <h3 className="text-sm font-semibold text-gray-700 mb-3">Unbatched Orders</h3>
                              <div className="space-y-2">
                                {unbatched.map(order => (
                                  <div 
                                    key={order.id} 
                                    className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                                    onClick={() => handleOrderClick(order)}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-bold text-gray-900 text-sm">#{order.orderId}</span>
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            order.materialType === 'blouse' ? 'bg-pink-100 text-pink-700' :
                                            order.materialType === 'saree' ? 'bg-purple-100 text-purple-700' :
                                            order.materialType === 'works' ? 'bg-blue-100 text-blue-700' :
                                            order.materialType === 'lehenga' ? 'bg-green-100 text-green-700' :
                                            order.materialType === 'chudi' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            {order.materialType}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">{order.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>₹{order.approximateAmount}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          order.isDelivered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {order.isDelivered ? 'Ready' : 'Pending'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    // All Orders View
                    <div className="space-y-4">
                      {MATERIAL_PRIORITY.map(materialType => {
                        const materialOrders = customerOrders.filter(order => order.materialType === materialType);
                        
                        if (materialOrders.length === 0) return null;
                        
                        const sortedMaterialOrders = materialOrders.sort((a, b) => 
                          new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
                        );
                        
                        return (
                          <div key={materialType} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-800 capitalize">
                                {materialType} Orders ({materialOrders.length})
                              </h3>
                            </div>
                            <div className="space-y-2">
                              {sortedMaterialOrders.map(order => (
                                <div
                                  key={order.id}
                                  className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-gray-200"
                                  onClick={() => handleOrderClick(order)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900 text-sm">#{order.orderId}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          order.orderType === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {order.orderType}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          order.isDelivered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {order.isDelivered ? 'Delivered' : order.currentStatus}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">{order.description}</p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>Given: {new Date(order.givenDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-gray-900">₹{order.approximateAmount}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Modal */}
        {isModalOpen && (
          <CustomerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            customer={selectedCustomer}
            mode={modalMode}
          />
        )}

        {/* Order Modal */}
        {isOrderModalOpen && (
          <OrderModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            customer={customer}
            mode="add"
          />
        )}
      </div>
    );
  }

  // Main customers list view - List View Only
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: CustomerWithDeliveryInfo) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewCustomer = (customer: CustomerWithDeliveryInfo) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleSelectCustomer = (customer: CustomerWithDeliveryInfo) => {
    setSelectedCustomer(customer);
  };

  const handleOrderClick = (order: any) => {
    console.log('Navigating to order:', order.orderId);
    navigate(`/orders/${order.orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-600">Manage your customer database</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-pink-600">{customers.length}</p>
              </div>
              <button
                onClick={handleAddCustomer}
                className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Get started by adding your first customer'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddCustomer}
                className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                const hasUrgentDelivery = customer.hasPendingOrders && customer.nearestDelivery;
                const daysUntilDelivery = hasUrgentDelivery 
                  ? Math.ceil((new Date(customer.nearestDelivery!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div
                    key={customer.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-pink-50 border-l-4 border-pink-500' : ''
                    }`}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                          {hasUrgentDelivery && daysUntilDelivery !== null && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              daysUntilDelivery <= 1 ? 'bg-red-100 text-red-700' :
                              daysUntilDelivery <= 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {daysUntilDelivery === 0 ? 'Today' :
                               daysUntilDelivery === 1 ? 'Tomorrow' :
                               `${daysUntilDelivery} days`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1 truncate">{customer.phone}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Orders: {customer.orderCount}</span>
                          <span>ID: {customer.customerId}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCustomer(customer);
                          }}
                          className="px-3 py-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-xs font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                          className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customer={selectedCustomer}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default Customers;