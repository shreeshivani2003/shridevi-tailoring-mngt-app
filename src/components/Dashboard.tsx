import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Search, 
  Calendar, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  TrendingUp
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { orders, customers, searchOrders } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const emergencyOrders = orders.filter(order => 
    new Date(order.deliveryDate) <= tomorrow && !order.isDelivered
  );

  const pendingOrders = orders.filter(order => 
    new Date(order.deliveryDate) <= threeDaysFromNow && !order.isDelivered
  );

  const weekOrders = orders.filter(order => 
    new Date(order.deliveryDate) <= weekFromNow && !order.isDelivered
  );

  const deliveredToday = orders.filter(order => 
    order.isDelivered && new Date(order.statusHistory[order.statusHistory.length - 1]?.completedAt).toDateString() === today.toDateString()
  );

  const totalDelivered = orders.filter(order => order.isDelivered);
  const totalPending = orders.filter(order => !order.isDelivered);

  const searchResults = searchOrders(searchQuery);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        <Icon className={`w-12 h-12 ${color} opacity-20`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2 text-pink-600">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">{today.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        
        {searchQuery && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map(order => (
              <div key={order.id} className="p-3 bg-pink-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{order.orderId} - {order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.materialType} • {order.currentStatus}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.isDelivered ? 'Delivered' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={Package}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Delivered Orders"
          value={totalDelivered.length}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Pending Orders"
          value={totalPending.length}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Order Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emergency Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800">Emergency Orders</h2>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {emergencyOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {emergencyOrders.map(order => (
              <div key={order.id} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <p className="font-medium text-gray-800">{order.orderId}</p>
                <p className="text-sm text-gray-600">{order.customerName}</p>
                <p className="text-xs text-red-600 font-medium">
                  Due: {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            ))}
            {emergencyOrders.length === 0 && (
              <p className="text-gray-500 text-sm">No emergency orders</p>
            )}
          </div>
        </div>

        {/* Pending Orders (3 days) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-800">Pending Orders</h2>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {pendingOrders.map(order => (
              <div key={order.id} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <p className="font-medium text-gray-800">{order.orderId}</p>
                <p className="text-sm text-gray-600">{order.customerName}</p>
                <p className="text-xs text-yellow-600 font-medium">
                  Due: {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-gray-500 text-sm">No pending orders</p>
            )}
          </div>
        </div>

        {/* This Week Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">This Week</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {weekOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {weekOrders.map(order => (
              <div key={order.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="font-medium text-gray-800">{order.orderId}</p>
                <p className="text-sm text-gray-600">{order.customerName}</p>
                <p className="text-xs text-blue-600 font-medium">
                  Due: {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            ))}
            {weekOrders.length === 0 && (
              <p className="text-gray-500 text-sm">No orders this week</p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Bucket */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Delivery Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{totalDelivered.length}</p>
            <p className="text-sm text-green-700 font-medium">Total Delivered</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{totalPending.length}</p>
            <p className="text-sm text-red-700 font-medium">Not Delivered</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{deliveredToday.length}</p>
            <p className="text-sm text-blue-700 font-medium">Delivered Today</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;