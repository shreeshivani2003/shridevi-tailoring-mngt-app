import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  Calendar, 
  Package, 
  AlertTriangle,
  Plus,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import OrderModal from './OrderModal';

const ORDER_CATEGORIES = [
  'blouse',
  'saree',
  'work',
  'lehenga',
  'chudi',
  'other',
];

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, customers, searchOrders, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'view'>('view');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showViewOrders, setShowViewOrders] = useState(false);

  // Only ongoing (not finished) orders
  const ongoingOrders = orders.filter(order => !order.isDelivered);

  // Sort by delivery date (soonest first)
  const sortedOrders = [...ongoingOrders].sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());

  // Filter by category
  const filteredOrders = selectedCategory === 'all'
    ? sortedOrders
    : sortedOrders.filter(order => order.materialType === selectedCategory);

  // Search filter
  const searchFilteredOrders = searchQuery
    ? filteredOrders.filter(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return (
          order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer && customer.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : filteredOrders;

  // Category counts
  const categoryCounts = ORDER_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = ongoingOrders.filter(order => order.materialType === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Group orders by due date
  const getGroupedOrders = (orderType: 'regular' | 'emergency') => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const typeOrders = ongoingOrders.filter(order => order.orderType === orderType);

    return {
      'Past Due': typeOrders.filter(order => new Date(order.deliveryDate) < today),
      'Due in 1 Day': typeOrders.filter(order => {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate >= today && deliveryDate <= tomorrow;
      }),
      'Due in 2 Days': typeOrders.filter(order => {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate > tomorrow && deliveryDate <= twoDaysFromNow;
      }),
      'Due in 3 Days': typeOrders.filter(order => {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate > twoDaysFromNow && deliveryDate <= threeDaysFromNow;
      })
    };
  };

  // This week's orders (next 7 days)
  const getThisWeeksOrders = () => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return ongoingOrders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate >= today && deliveryDate <= weekFromNow;
    });
  };

  // Full Month Calendar helpers
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getOrdersForDate = (date: Date) => {
    return ongoingOrders.filter(order => {
      const orderDate = new Date(order.deliveryDate);
      return orderDate.toDateString() === date.toDateString();
    });
  };

  const handleOrderClick = (order: any) => {
    navigate(`/orders/${order.orderId}`);
  };

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleViewOrders = () => {
    setShowViewOrders(!showViewOrders);
  };

  const handleGroupClick = (groupName: string) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(selectedDate?.toDateString() === date.toDateString() ? null : date);
  };

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const regularGroups = getGroupedOrders('regular');
  const emergencyGroups = getGroupedOrders('emergency');
  const thisWeeksOrders = getThisWeeksOrders();
  const calendarDays = getCalendarDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Order Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={handleViewOrders}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showViewOrders 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              View Orders
            </button>
            <button
              onClick={handleAddOrder}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Order
            </button>
          </div>
        </div>
      </div>

      {/* View Orders Section */}
      {showViewOrders && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Overview</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>Total Orders: {ongoingOrders.length}</span>
            </div>
          </div>

          {/* Professional Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                All ({ongoingOrders.length})
              </button>
              {ORDER_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categoryCounts[cat] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchFilteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                searchFilteredOrders.map(order => {
                  const customer = customers.find(c => c.id === order.customerId);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{customer ? customer.name : 'Unknown'}</span>
                            <span className="text-sm text-gray-500">#{order.orderId}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.orderType === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.orderType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>{order.materialType}</span>
                            <span>Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{order.approximateAmount || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard - Order Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status Dashboard</h2>
        
        {/* Regular Orders */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Regular Orders</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(regularGroups).map(([groupName, groupOrders]) => (
              <button
                key={groupName}
                onClick={() => handleGroupClick(`regular-${groupName}`)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  expandedGroup === `regular-${groupName}` 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{groupName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    groupName === 'Past Due' ? 'bg-red-100 text-red-800' :
                    groupName === 'Due in 1 Day' ? 'bg-orange-100 text-orange-800' :
                    groupName === 'Due in 2 Days' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {groupOrders.length}
                  </span>
                </div>
                {expandedGroup === `regular-${groupName}` && groupOrders.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {groupOrders.slice(0, 3).map(order => {
                      const customer = getCustomerById(order.customerId);
                      return (
                        <div
                          key={order.id}
                          className="text-xs p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          {customer?.name} - #{order.orderId}
                        </div>
                      );
                    })}
                    {groupOrders.length > 3 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{groupOrders.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">Emergency Orders</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(emergencyGroups).map(([groupName, groupOrders]) => (
              <button
                key={groupName}
                onClick={() => handleGroupClick(`emergency-${groupName}`)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  expandedGroup === `emergency-${groupName}` 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 hover:border-red-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{groupName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    groupName === 'Past Due' ? 'bg-red-100 text-red-800' :
                    groupName === 'Due in 1 Day' ? 'bg-orange-100 text-orange-800' :
                    groupName === 'Due in 2 Days' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {groupOrders.length}
                  </span>
                </div>
                {expandedGroup === `emergency-${groupName}` && groupOrders.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {groupOrders.slice(0, 3).map(order => {
                      const customer = getCustomerById(order.customerId);
                      return (
                        <div
                          key={order.id}
                          className="text-xs p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          {customer?.name} - #{order.orderId}
                        </div>
                      );
                    })}
                    {groupOrders.length > 3 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{groupOrders.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Calendar & This Week's Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Small Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Month Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const ordersForDate = getOrdersForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`min-h-12 p-1 border-r border-b border-gray-200 text-left transition-all ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                    } ${
                      isToday ? 'bg-blue-100 border-blue-300' :
                      isSelected ? 'bg-blue-50 border-blue-200' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {date.getDate()}
                    </div>
                    {ordersForDate.length > 0 && (
                      <div className="w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Selected Date Orders */}
          {selectedDate && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">
                Orders for {selectedDate.toLocaleDateString()}
              </h4>
              <div className="space-y-1">
                {getOrdersForDate(selectedDate).map(order => {
                  const customer = getCustomerById(order.customerId);
                  return (
                    <div
                      key={order.id}
                      className="p-2 bg-white rounded cursor-pointer hover:bg-gray-100 border text-sm"
                      onClick={() => handleOrderClick(order)}
                    >
                      {customer?.name} - #{order.orderId}
                    </div>
                  );
                })}
                {getOrdersForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-2">No orders for this date</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* This Week's Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Orders</h2>
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Orders Due This Week ({thisWeeksOrders.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {thisWeeksOrders.map(order => {
                const customer = getCustomerById(order.customerId);
                return (
                  <div
                    key={order.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border border-gray-200"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-800">{customer?.name}</span>
                        <span className="ml-2 text-sm text-gray-500">#{order.orderId}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{order.materialType}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {thisWeeksOrders.length === 0 && (
                <div className="text-center py-6">
                  <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No orders due this week</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {isModalOpen && (
        <OrderModal
          isOpen={isModalOpen}
          order={selectedOrder}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default Orders;