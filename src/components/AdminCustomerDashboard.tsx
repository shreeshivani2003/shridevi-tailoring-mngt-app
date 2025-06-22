import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  User, 
  Phone, 
  MessageCircle,
  Package,
  Calendar,
  Clock
} from 'lucide-react';
import CustomerModal from './CustomerModal';

const AdminCustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { customers, getCustomersWithOrderCounts, searchCustomers } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Get customers with order counts and sort by recent activity
  const customersWithOrders = getCustomersWithOrderCounts().sort((a, b) => {
    // Sort by most recent order first, then by name
    const aLatestOrder = a.orders.length > 0 ? Math.max(...a.orders.map(o => new Date(o.createdAt).getTime())) : 0;
    const bLatestOrder = b.orders.length > 0 ? Math.max(...b.orders.map(o => new Date(o.createdAt).getTime())) : 0;
    return bLatestOrder - aLatestOrder;
  });

  // Filter customers based on search query
  const filteredCustomers = searchQuery
    ? searchCustomers(searchQuery).map(customer => ({
        ...customer,
        orderCount: getCustomersWithOrderCounts().find(c => c.id === customer.id)?.orderCount || 0
      }))
    : customersWithOrders;

  const handleViewCustomer = (customer: any) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-600">Manage your customer database</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-pink-600">{customers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add First Customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {customer.name}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {customer.customerId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.whatsappNumber && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{customer.whatsappNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{customer.orderCount} orders</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Customer"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 transition-all transform hover:scale-110 flex items-center justify-center"
        title="Add New Customer"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Customer Modal */}
      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          customer={selectedCustomer}
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default AdminCustomerDashboard; 