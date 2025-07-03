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
  ChevronRight,
  Scissors
} from 'lucide-react';
import OrderModal from './OrderModal';

const ORDER_CATEGORIES = [
  'all',
  'blouse',
  'saree',
  'works',
  'lehenga',
  'lahenga',
  'chudi',
  'others',
];

const ORDER_TYPES = [
  { value: 'all', label: 'All Orders', icon: Package },
  { value: 'regular', label: 'Regular', icon: Package },
  { value: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { value: 'alter', label: 'Alter', icon: Scissors },
];

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, customers, searchOrders, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
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

  // Filter by order type
  const orderTypeFilteredOrders = selectedOrderType === 'all'
    ? filteredOrders
    : filteredOrders.filter(order => order.orderType === selectedOrderType);

  // Search filter
  const searchFilteredOrders = searchQuery
    ? orderTypeFilteredOrders.filter(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return (
          order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer && customer.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : orderTypeFilteredOrders;

  // Category counts
  const categoryCounts = ORDER_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = ongoingOrders.filter(order => order.materialType === cat).length;
    return acc;
  }, {} as Record<string, number>);

  // Group orders by due date
  const getGroupedOrders = (orderType: 'regular' | 'emergency' | 'alter', materialType?: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    let typeOrders = ongoingOrders.filter(order => order.orderType === orderType);
    if (materialType && materialType !== 'all') {
      typeOrders = typeOrders.filter(order => order.materialType === materialType);
    }

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
    setSelectedOrder(order);
    setModalMode('view');
    setIsModalOpen(true);
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

  // Add a function to get orders due in 7 days
  const getDueIn7DaysCount = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return ongoingOrders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate > today && deliveryDate <= sevenDaysFromNow;
    }).length;
  };

  const getDueIn7DaysOrders = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return ongoingOrders.filter(order => {
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate > today && deliveryDate <= sevenDaysFromNow;
    });
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

  const regularGroups = getGroupedOrders('regular', selectedCategory);
  const emergencyGroups = getGroupedOrders('emergency', selectedCategory);
  const alterGroups = getGroupedOrders('alter', selectedCategory);
  const thisWeeksOrders = getThisWeeksOrders();
  const calendarDays = getCalendarDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Order Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Total Pendings: {ongoingOrders.length}</p>
          </div>
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
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setShowViewOrders(false)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-pink-50 hover:text-pink-800 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="font-medium">Back</span>
            </button>
            <h2 className="text-xl font-semibold text-gray-900 ml-2">View Orders</h2>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex gap-2 flex-1">
              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Materials</option>
                  {ORDER_CATEGORIES.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={selectedOrderType}
                  onChange={e => setSelectedOrderType(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {ORDER_TYPES.map(({ value, label }) => (
                    value !== 'all' && <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedOrderType('all');
                }}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm border border-gray-300 hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {searchFilteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No orders found</td>
                  </tr>
                ) : (
                  searchFilteredOrders.map(order => {
                    const customer = customers.find(c => c.id === order.customerId);
                    return (
                      <tr key={order.id} className="hover:bg-pink-50 cursor-pointer" onClick={() => handleOrderClick(order)}>
                        <td className="px-4 py-2 font-mono text-pink-700">
                          <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}>{order.orderId}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/customers/${order.customerId}`); }}>{customer?.name}</span>
                        </td>
                        <td className="px-4 py-2 capitalize">{order.orderType}</td>
                        <td className="px-4 py-2 capitalize">{order.materialType}</td>
                        <td className="px-4 py-2">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">₹{order.approximateAmount || 0}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hide dashboard when viewing orders */}
      {!showViewOrders && (
        <>
          {/* Material Filter for Main Dashboard */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-2">
            <button
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All Materials ({ongoingOrders.length})
            </button>
            {ORDER_CATEGORIES.slice(1).map(cat => (
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
                              onClick={e => {
                                e.stopPropagation();
                                handleOrderClick(order);
                              }}
                            >
                              <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/customers/${order.customerId}`); }}>{customer?.name}</span>
                              <span className="text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}>#{order.orderId}</span>
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
            <div className="mb-8">
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
                              <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/customers/${order.customerId}`); }}>{customer?.name}</span>
                              <span className="text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}>#{order.orderId}</span>
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

            {/* Alter Orders */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Scissors className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Alter Orders</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(alterGroups).map(([groupName, groupOrders]) => (
                  <button
                    key={groupName}
                    onClick={() => handleGroupClick(`alter-${groupName}`)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      expandedGroup === `alter-${groupName}` 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
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
                    {expandedGroup === `alter-${groupName}` && groupOrders.length > 0 && (
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
                              <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/customers/${order.customerId}`); }}>{customer?.name}</span>
                              <span className="text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}>#{order.orderId}</span>
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

          {/* Compact Calendar & Due in 7 Days Side by Side */}
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
                          <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/customers/${order.customerId}`); }}>{customer?.name}</span>
                          <span className="text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}>#{order.orderId}</span>
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
            {/* Due in 7 Days Card */}
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6 h-fit">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Due in 7 Days</h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {getDueIn7DaysCount()}
                </span>
              </div>
              {/* Always show the list of orders, no expand/collapse */}
              <div className="p-4 rounded-lg border border-green-100 bg-green-50">
                {getDueIn7DaysOrders().length > 0 ? (
                  <div className="space-y-2">
                    {getDueIn7DaysOrders().slice(0, 10).map(order => {
                      const customer = getCustomerById(order.customerId);
                      return (
                        <div
                          key={order.id}
                          className="text-xs p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                          onClick={e => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          <span className="text-pink-700 underline cursor-pointer hover:text-pink-900 mr-1" onClick={e => { e.stopPropagation(); navigate(`/customers/${order.customerId}`); }}>{customer?.name}</span>
                          <span className="text-blue-700 underline cursor-pointer hover:text-blue-900" onClick={e => { e.stopPropagation(); navigate(`/orders/${order.orderId}`); }}>#{order.orderId}</span>
                        </div>
                      );
                    })}
                    {getDueIn7DaysOrders().length > 10 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{getDueIn7DaysOrders().length - 10} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">No orders due in the next 7 days</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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