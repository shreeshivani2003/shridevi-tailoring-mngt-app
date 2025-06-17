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
  AlertTriangle,
  Plus
} from 'lucide-react';
import OrderModal from './OrderModal';

const Orders: React.FC = () => {
  const { orders, customers, searchOrders, deleteOrder, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'view' | 'add'>('view');
  const [activeTab, setActiveTab] = useState<'regular' | 'emergency'>('regular');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const filteredOrders = searchOrders(searchQuery);
  
  const getGroupedOrders = (orderType: 'regular' | 'emergency') => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const typeOrders = filteredOrders.filter(order => 
      order.orderType === orderType && !order.isDelivered
    );

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

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        setDeletingOrderId(orderId);
        await deleteOrder(orderId);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      } finally {
        setDeletingOrderId(null);
      }
    }
  };

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setModalMode('add');
    setIsModalOpen(true);
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

  const groupedOrders = getGroupedOrders(activeTab);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <button
          onClick={handleAddOrder}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Order
        </button>
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
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
      </div>

      {/* Order Type Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('regular')}
              className={`flex-1 px-6 py-4 text-center font-medium text-sm ${
                activeTab === 'regular'
                  ? 'border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-5 h-5 mx-auto mb-2" />
              Regular Orders
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className={`flex-1 px-6 py-4 text-center font-medium text-sm ${
                activeTab === 'emergency'
                  ? 'border-b-2 border-red-500 text-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
              Emergency Orders
            </button>
          </nav>
        </div>

        {/* Orders List */}
        <div className="divide-y divide-gray-200">
          {Object.entries(groupedOrders).map(([groupName, groupOrders]) => (
            <div key={groupName} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{groupName}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  groupName === 'Past Due' ? 'bg-red-100 text-red-800' :
                  groupName === 'Due in 1 Day' ? 'bg-orange-100 text-orange-800' :
                  groupName === 'Due in 2 Days' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {groupOrders.length} orders
                </span>
              </div>

              <div className="space-y-4">
                {groupOrders.map(order => {
                  const customer = getCustomerById(order.customerId);
                  const isDeleting = deletingOrderId === order.id;
                  
                  return (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-pink-600">{order.orderId}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.orderType === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.orderType === 'emergency' ? 'Emergency' : 'Regular'}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{customer?.name || 'Unknown Customer'}</span>
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

                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">{order.sizeBookNo} - {order.hint}</p>
                            <p className="mt-1">{order.description}</p>
                            {order.approximateAmount > 0 && (
                              <p className="text-green-600 font-medium mt-1">
                                Amount: ₹{order.approximateAmount}
                              </p>
                            )}
                          </div>
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
                            disabled={isDeleting}
                            className={`p-2 rounded-lg transition-colors ${
                              isDeleting 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Delete Order"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {groupOrders.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No orders in this category</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Modal */}
      {isModalOpen && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customer={selectedOrder ? getCustomerById(selectedOrder.customerId) : undefined}
          order={selectedOrder}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default Orders;