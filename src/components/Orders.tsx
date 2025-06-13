import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  User, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import OrderModal from './OrderModal';

const Orders: React.FC = () => {
  const { orders, customers, searchOrders, deleteOrder } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'view'>('view');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'delivered' | 'emergency'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'material' | 'week'>('none');

  const filteredOrders = searchOrders(searchQuery);
  
  const getFilteredOrders = () => {
    let filtered = filteredOrders;
    
    switch (filterType) {
      case 'pending':
        filtered = filtered.filter(order => !order.isDelivered);
        break;
      case 'delivered':
        filtered = filtered.filter(order => order.isDelivered);
        break;
      case 'emergency':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        filtered = filtered.filter(order => 
          new Date(order.deliveryDate) <= tomorrow && !order.isDelivered
        );
        break;
    }
    
    return filtered;
  };

  const groupOrders = (orders: any[]) => {
    if (groupBy === 'none') return { 'All Orders': orders };
    
    if (groupBy === 'material') {
      const grouped: { [key: string]: any[] } = {};
      orders.forEach(order => {
        const material = order.materialType.charAt(0).toUpperCase() + order.materialType.slice(1);
        if (!grouped[material]) grouped[material] = [];
        grouped[material].push(order);
      });
      return grouped;
    }
    
    if (groupBy === 'week') {
      const grouped: { [key: string]: any[] } = {};
      orders.forEach(order => {
        const deliveryDate = new Date(order.deliveryDate);
        const today = new Date();
        const diffTime = deliveryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let week;
        if (diffDays <= 0) week = 'Overdue';
        else if (diffDays <= 3) week = 'This Week (3 days)';
        else if (diffDays <= 7) week = 'This Week';
        else if (diffDays <= 14) week = 'Next Week';
        else week = 'Later';
        
        if (!grouped[week]) grouped[week] = [];
        grouped[week].push(order);
      });
      return grouped;
    }
    
    return { 'All Orders': orders };
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(orderId);
    }
  };

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const getStatusColor = (order: any) => {
    if (order.isDelivered) return 'bg-green-100 text-green-800';
    
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 1) return 'bg-orange-100 text-orange-800';
    if (diffDays <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const processedOrders = getFilteredOrders();
  const groupedOrders = groupOrders(processedOrders);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Total: {processedOrders.length} orders
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or material type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="none">No Grouping</option>
              <option value="material">Group by Material</option>
              <option value="week">Group by Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {Object.entries(groupedOrders).map(([groupName, groupOrders]) => (
          <div key={groupName} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {groupBy !== 'none' && (
              <div className="bg-pink-50 px-6 py-3 border-b">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-pink-600" />
                  {groupName}
                  <span className="bg-pink-100 text-pink-800 text-sm font-medium px-2 py-1 rounded-full">
                    {groupOrders.length}
                  </span>
                </h2>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {groupOrders.map(order => {
                const customer = getCustomerById(order.customerId);
                return (
                  <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-bold text-pink-600">{order.orderId}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order)}`}>
                            {order.isDelivered ? 'Delivered' : order.currentStatus}
                          </span>
                          {new Date(order.deliveryDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && !order.isDelivered && (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span className="capitalize">{order.materialType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Given: {new Date(order.givenDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-gray-700 mt-2">{order.description}</p>
                        {order.approximateAmount > 0 && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Amount: ₹{order.approximateAmount}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {processedOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      )}

      {/* Order Modal */}
      {isModalOpen && selectedOrder && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customer={getCustomerById(selectedOrder.customerId)!}
          order={selectedOrder}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default Orders;