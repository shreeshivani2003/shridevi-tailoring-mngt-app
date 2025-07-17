import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Phone, 
  MessageCircle,
  Package,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';
import CustomerModal from './CustomerModal';
import OrderModal from './OrderModal';

const Customers: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { 
    getCustomersWithOrderCounts, 
    searchCustomers, 
    customers, 
    orders,
    addOrder 
  } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Get customers with their order counts
  const customersWithOrderCounts = getCustomersWithOrderCounts();
  const filteredCustomers = searchQuery.trim() 
    ? searchCustomers(searchQuery).map(customer => ({
        ...customer,
        orderCount: customersWithOrderCounts.find(c => c.id === customer.id)?.orderCount || 0
      }))
    : customersWithOrderCounts;

  // If customerId is provided, show customer detail view
  if (customerId) {
    const customer = customers.find(c => c.id === customerId);
    // Only show pending and ongoing orders (exclude delivered)
    const customerOrders = orders.filter(o => o.customerId === customerId && !o.isDelivered);
    
    if (!customer) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
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

    // Group orders by material type
    const ordersByMaterial = customerOrders.reduce((acc, order) => {
      if (!acc[order.materialType]) {
        acc[order.materialType] = [];
      }
      acc[order.materialType].push(order);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort orders by creation date (most recent first)
    Object.keys(ordersByMaterial).forEach(materialType => {
      ordersByMaterial[materialType].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    const handleAddOrder = () => {
      setIsOrderModalOpen(true);
    };

    const handleOrderClick = (order: any) => {
      navigate(`/orders/${order.orderId}`);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/customers')}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
                  <p className="text-pink-100">Customer ID: {customer.customerId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setModalMode('edit');
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleAddOrder}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-purple-600 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                    <User className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                    <Phone className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{customer.phone}</p>
                    </div>
                  </div>
                  
                  {customer.whatsappNumber && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <p className="font-semibold text-gray-900">{customer.whatsappNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.address && (
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                      <User className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold text-gray-900 text-sm">{customer.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                    <Package className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="font-semibold text-gray-900">{customerOrders.length}</p>
                    </div>
                  </div>
                  
                  {customer.notes && (
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
                      <User className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Notes</p>
                        <p className="font-semibold text-gray-900 text-sm">{customer.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                </div>
                
                {customerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">No orders yet</p>
                    <p className="text-sm text-gray-400">Create the first order for this customer</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(ordersByMaterial).map(([materialType, materialOrders]) => (
                      <div key={materialType} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="font-bold text-gray-900 capitalize">
                            {materialType} ({materialOrders.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {materialOrders.map(order => (
                            <div
                              key={order.id}
                              className="p-4 bg-white rounded-xl cursor-pointer hover:shadow-lg transition-all border border-gray-100 hover:border-pink-200"
                              onClick={() => handleOrderClick(order)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-gray-900">#{order.orderId}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      order.orderType === 'emergency' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    }`}>
                                      {order.orderType}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      order.isDelivered ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                      {order.isDelivered ? 'Delivered' : order.currentStatus}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3 font-medium">{order.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
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
                                  <div className="text-lg font-bold text-gray-900">
                                    ₹{order.approximateAmount}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

  // Main customers list view
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewCustomer = (customer: any) => {
    navigate(`/customers/${customer.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Customers</h1>
              <p className="text-pink-100">Manage your customer database</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-pink-100 text-sm">Total Customers</p>
                <p className="text-3xl font-bold text-white">{customers.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:ring-opacity-50 bg-white shadow-lg text-lg"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first customer'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddCustomer}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-lg"
                >
                  <Plus className="w-6 h-6 inline mr-2" />
                  Add First Customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] hover:border-pink-200 animate-fade-in"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate">
                          {customer.name}
                        </h3>
                        <p className="text-sm text-purple-600 font-semibold">ID: {customer.customerId}</p>
                      </div>
                      {customer.orderCount > 0 && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 rounded-full">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">{customer.orderCount} orders</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 rounded-lg">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{customer.phone}</span>
                      </div>
                      {customer.whatsappNumber && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{customer.whatsappNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-6">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
                      title="View Customer"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="p-3 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all shadow-lg"
                      title="Edit Customer"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={handleAddCustomer}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl shadow-2xl hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-110 flex items-center justify-center"
        title="Add New Customer"
      >
        <Plus className="w-8 h-8" />
      </button>

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