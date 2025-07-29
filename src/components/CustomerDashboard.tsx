import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Package,
  Calendar
} from 'lucide-react';
import { Customer, Order, OrderType, MaterialType } from '../types';

const getDaysDiff = (date: Date) => {
  const now = new Date();
  const d = new Date(date);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const CustomerDashboard: React.FC = () => {
  const { customers, orders, updateOrderBatchTag } = useData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState({
    category: '',
    material: '',
    status: '',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [batches, setBatches] = useState<{ batch_tag: string, batch_name: string }[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Define material priority order for listing
  const MATERIAL_PRIORITY = ['blouse', 'saree', 'works', 'lehenga', 'chudi', 'others'];
  // Fetch batches for selected customer
  useEffect(() => {
    const fetchBatches = async () => {
      if (!selectedCustomer) return;
      setLoadingBatches(true);
      const { data, error } = await supabase
        .from('batches')
        .select('batch_tag, batch_name')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: true });
      if (!error && data) setBatches(data);
      setLoadingBatches(false);
    };
    fetchBatches();
  }, [selectedCustomer]);

  // --- SUMMARY CARDS ---
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return (now.getTime() - created.getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;
  const customerOrderCounts = customers.map(c => ({
    ...c,
    orderCount: c.orders.length,
    pendingCount: c.orders.filter(o => !o.isDelivered).length
  }));
  const mostRepeating = customerOrderCounts.reduce((max, c) => c.orderCount > (max?.orderCount || 0) ? c : max, null as any);
  const mostPending = customerOrderCounts.reduce((max, c) => c.pendingCount > (max?.pendingCount || 0) ? c : max, null as any);

  // --- SEARCH & FILTER ---
  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.customerId.toLowerCase().includes(q)
      );
    }
    if (filter.category) {
      list = list.filter(c => c.orders.some(o => o.orderType === filter.category));
    }
    if (filter.material) {
      list = list.filter(c => c.orders.some(o => o.materialType === filter.material));
    }
    if (filter.status) {
      if (filter.status === 'pending') {
        list = list.filter(c => c.orders.some(o => !o.isDelivered));
      } else if (filter.status === 'ready') {
        list = list.filter(c => c.orders.some(o => o.isDelivered));
      }
    }
    // Sort by order count descending
    list.sort((a, b) => b.orders.length - a.orders.length);
    return list;
  }, [customers, searchQuery, filter]);

  // --- MAIN LIST ---
  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedCustomer(null);
  };

  const handleOrderClick = (order: Order) => {
    console.log('Navigating to order:', order.orderId);
    navigate(`/orders/${order.orderId}`);
  };

  // --- GROUP ORDERS FOR DETAILS ---
  const groupOrdersByCategory = (orders: Order[]) => {
    const groups: Record<OrderType, Order[]> = { regular: [], emergency: [], alter: [] };
    orders.forEach(o => groups[o.orderType].push(o));
    return groups;
  };

  // --- UI ---
  const [showBatches, setShowBatches] = useState(false);
  // UI-only batch state
  const [batchAssignments, setBatchAssignments] = useState<Record<string, string>>(
    () => Object.fromEntries((selectedCustomer?.orders || []).filter(o => o.batch_tag).map(o => [o.id, o.batch_tag!]))
  );
  const [editingBatch, setEditingBatch] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState('');

  // Group orders by batch_tag for the selected customer (using UI state)
  const getBatches = (orders: Order[]) => {
    const batchesMap: Record<string, Order[]> = {};
    orders.forEach(order => {
      const tag = batchAssignments[order.id] || order.batch_tag || '';
      if (tag) {
        if (!batchesMap[tag]) batchesMap[tag] = [];
        batchesMap[tag].push(order);
      }
    });
    // Orders without batch_tag
    const unbatched = orders.filter(o => !(batchAssignments[o.id] || o.batch_tag));
    return { batches: batchesMap, unbatched };
  };

  // Add order to batch (backend persistence)
  const addOrderToBatch = async (orderId: string, batchTag: string) => {
    await updateOrderBatchTag(orderId, batchTag);
    setBatchAssignments(prev => ({ ...prev, [orderId]: batchTag }));
  };
  // Remove order from batch (backend persistence)
  const removeOrderFromBatch = async (orderId: string) => {
    await updateOrderBatchTag(orderId, null);
    setBatchAssignments(prev => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
  };
  // Delete batch (unbatch all orders in it, backend persistence)
  const deleteBatch = async (batchTag: string) => {
    const orderIds = Object.keys(batchAssignments).filter(orderId => batchAssignments[orderId] === batchTag);
    await Promise.all(orderIds.map(orderId => updateOrderBatchTag(orderId, null)));
    // Delete batch from backend
    if (selectedCustomer) {
      await supabase.from('batches').delete().eq('customer_id', selectedCustomer.id).eq('batch_tag', batchTag);
      setBatches(batches => batches.filter(b => b.batch_tag !== batchTag));
    }
    setBatchAssignments(prev => {
      const copy = { ...prev };
      orderIds.forEach(orderId => delete copy[orderId]);
      return copy;
    });
  };
  // Rename batch (backend persistence)
  const renameBatch = async (batchTag: string, newName: string) => {
    if (selectedCustomer) {
      await supabase.from('batches').update({ batch_name: newName }).eq('customer_id', selectedCustomer.id).eq('batch_tag', batchTag);
      setBatches(batches => batches.map(b => b.batch_tag === batchTag ? { ...b, batch_name: newName } : b));
    }
    setEditingBatch(null);
  };
  // Create new batch and assign order (backend persistence)
  const createBatchAndAssign = async (orderId: string) => {
    if (!selectedCustomer) return;
    const newTag = `batch_${Date.now()}`;
    const newName = `Batch ${batches.length + 1}`;
    await supabase.from('batches').insert({
      customer_id: selectedCustomer.id,
      batch_tag: newTag,
      batch_name: newName
    });
    setBatches(batches => [...batches, { batch_tag: newTag, batch_name: newName }]);
    await updateOrderBatchTag(orderId, newTag);
    setBatchAssignments(prev => ({ ...prev, [orderId]: newTag }));
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
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
        <h1 className="text-3xl font-bold text-gray-800">Customer Dashboard</h1>
        <div className="flex items-center gap-2 text-pink-600">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={totalCustomers} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="New Customers (30d)" value={newCustomers} icon={TrendingUp} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Most Repeating" value={mostRepeating ? mostRepeating.name : '-'} icon={Package} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard title="Most Pending Work" value={mostPending ? mostPending.name : '-'} icon={Clock} color="text-orange-600" bgColor="bg-orange-50" />
      </div>

      {/* Search & Filter Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or customer ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        <select
          className="border rounded-lg px-3 py-2"
          value={filter.category}
          onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          <option value="regular">Regular</option>
          <option value="emergency">Emergency</option>
          <option value="alter">Alter</option>
        </select>
        <select
          className="border rounded-lg px-3 py-2"
          value={filter.material}
          onChange={e => setFilter(f => ({ ...f, material: e.target.value }))}
        >
          <option value="">All Materials</option>
          <option value="blouse">Blouse</option>
          <option value="chudi">Chudi</option>
          <option value="saree">Saree</option>
          <option value="works">Works</option>
          <option value="lehenga">Lehenga</option>
          <option value="others">Others</option>
        </select>
        <select
          className="border rounded-lg px-3 py-2"
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="ready">Ready</option>
        </select>
      </div>

      {/* Main List View */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-pink-50">
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Phone</th>
                <th className="px-4 py-2 font-semibold">Total Orders</th>
                <th className="px-4 py-2 font-semibold">Pending Items</th>
                <th className="px-4 py-2 font-semibold">Due in 7 Days</th>
                <th className="px-4 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => {
                const pendingItems = customer.orders.filter(o => !o.isDelivered).length;
                const dueIn7 = customer.orders.some(o => !o.isDelivered && getDaysDiff(o.deliveryDate) <= 7 && getDaysDiff(o.deliveryDate) >= 0);
                return (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium text-gray-800">{customer.name}</td>
                    <td className="px-4 py-2">{customer.phone}</td>
                    <td className="px-4 py-2">{customer.orders.length}</td>
                    <td className="px-4 py-2">{pendingItems}</td>
                    <td className="px-4 py-2">
                      {dueIn7 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Due in 7 Days</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                        onClick={() => handleViewDetails(customer)}
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal/Page */}
      {showDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeDetails}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedCustomer.name} - Order History</h2>
            {/* Always show toggle for All Orders vs Grouped by Batches */}
            <div className="mb-4 flex gap-4 items-center">
              <button
                className={`px-4 py-2 rounded-lg font-medium ${!showBatches ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setShowBatches(false)}
              >
                All Orders
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium ${showBatches ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setShowBatches(true)}
              >
                Grouped by Batches
              </button>
            </div>
            {/* All Orders grouped by material type */}
            {!showBatches ? (
              <div className="space-y-6">
                {['blouse', 'chudi', 'saree', 'works', 'lehenga', 'others'].map(material => {
                  const materialOrders = selectedCustomer.orders.filter(o => o.materialType === material);
                  return (
                    <div key={material}>
                      <h3 className="text-lg font-semibold mb-2 capitalize text-pink-700">{material} Orders</h3>
                      <div className="space-y-2">
                        {materialOrders.length === 0 && <div className="text-gray-400 text-sm">No {material} orders</div>}
                        {materialOrders
                          .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                          .map(order => (
                            <div 
                              key={order.id} 
                              className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-pink-50 hover:bg-pink-100 cursor-pointer transition-colors"
                              onClick={() => handleOrderClick(order)}
                            >
                              <div>
                                <div className="font-medium text-gray-800">
                                  {order.materialType} (
                                                                     <span 
                                     className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                                     onClick={() => handleOrderClick(order)}
                                   >
                                    {order.orderId}
                                  </span>
                                  )
                                </div>
                                <div className="text-xs text-gray-600">Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-600">Status: {order.isDelivered ? 'Ready' : 'Pending'}</div>
                                {order.batch_tag && <div className="text-xs text-purple-600">Batch: {order.batch_tag}</div>}
                              </div>
                              <div className="mt-2 md:mt-0">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.isDelivered ? 'Ready' : 'Pending'}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Grouped by Batches view
              (() => {
                const { batches: batchMap, unbatched } = getBatches(selectedCustomer.orders);
                const batchTags = batches.map(b => b.batch_tag);
                return (
                  <div className="space-y-6">
                    {batchTags.length === 0 && <div className="text-gray-400 text-sm">No batches created yet.</div>}
                    {batchTags.map((tag, idx) => {
                      const batchName = batches.find(b => b.batch_tag === tag)?.batch_name || `Batch ${idx + 1}`;
                      return (
                        <div key={tag} className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-purple-700">
                              {editingBatch === tag ? (
                                <>
                                  <input
                                    type="text"
                                    value={newBatchName}
                                    onChange={e => setNewBatchName(e.target.value)}
                                    className="border rounded px-2 py-1 text-sm mr-2"
                                  />
                                  <button className="text-xs text-green-600 mr-2" onClick={() => renameBatch(tag, newBatchName)}>Save</button>
                                  <button className="text-xs text-gray-500" onClick={() => setEditingBatch(null)}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  {batchName} <span className="text-xs text-gray-500">({tag})</span>
                                  <button className="ml-2 text-xs text-blue-600 underline" onClick={() => { setEditingBatch(tag); setNewBatchName(batchName); }}>Rename</button>
                                  <button className="ml-2 text-xs text-red-600 underline" onClick={() => deleteBatch(tag)}>Delete</button>
                                </>
                              )}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {batchMap[tag]?.length === 0 && <div className="text-gray-400 text-sm">No orders in this batch</div>}
                            {MATERIAL_PRIORITY.map(materialType => {
                              const materialOrders = batchMap[tag]?.filter(order => order.materialType === materialType) || [];
                              
                              if (materialOrders.length === 0) return null;
                              
                              // Sort orders by delivery date (soonest first)
                              const sortedMaterialOrders = materialOrders.sort((a, b) => 
                                new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
                              );
                              
                              return (
                                <div key={materialType} className="mb-4">
                                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-2 rounded-lg mb-2">
                                    <h4 className="text-sm font-semibold text-gray-700 capitalize">
                                      {materialType} ({materialOrders.length})
                                    </h4>
                                  </div>
                                  <div className="space-y-2 ml-2">
                                    {sortedMaterialOrders.map(order => (
                                      <div 
                                        key={order.id} 
                                        className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-pink-50 hover:bg-pink-100 cursor-pointer transition-colors"
                                        onClick={() => handleOrderClick(order)}
                                      >
                                        <div>
                                          <div className="font-medium text-gray-800">
                                            {order.materialType} (
                                            <span 
                                              className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                                              onClick={() => handleOrderClick(order)}
                                            >
                                              {order.orderId}
                                            </span>
                                            )
                                          </div>
                                          <div className="text-xs text-gray-600">Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</div>
                                          <div className="text-xs text-gray-600">Status: {order.isDelivered ? 'Ready' : 'Pending'}</div>
                                        </div>
                                        <div className="mt-2 md:mt-0 flex flex-col md:flex-row md:items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.isDelivered ? 'Ready' : 'Pending'}</span>
                                          <select
                                            className="border rounded px-2 py-1 text-xs"
                                            value={batchAssignments[order.id] || order.batch_tag || ''}
                                            onChange={e => {
                                              const newTag = e.target.value;
                                              if (newTag === 'unbatch') {
                                                removeOrderFromBatch(order.id);
                                              } else {
                                                addOrderToBatch(order.id, newTag);
                                              }
                                            }}
                                          >
                                            {batches.map(b => (
                                              <option key={b.batch_tag} value={b.batch_tag}>{b.batch_name}</option>
                                            ))}
                                            <option value="unbatch">Unbatch</option>
                                          </select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {unbatched.length > 0 && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Unbatched Orders</h3>
                        <div className="space-y-4">
                          {MATERIAL_PRIORITY.map(materialType => {
                            const materialOrders = unbatched.filter(order => order.materialType === materialType);
                            
                            if (materialOrders.length === 0) return null;
                            
                            // Sort orders by delivery date (soonest first)
                            const sortedMaterialOrders = materialOrders.sort((a, b) => 
                              new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
                            );
                            
                            return (
                              <div key={materialType}>
                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 rounded-lg mb-2">
                                  <h4 className="text-sm font-semibold text-gray-700 capitalize">
                                    {materialType} ({materialOrders.length})
                                  </h4>
                                </div>
                                <div className="space-y-2 ml-2">
                                  {sortedMaterialOrders.map(order => (
                                    <div 
                                      key={order.id} 
                                      className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between bg-pink-50 hover:bg-pink-100 cursor-pointer transition-colors"
                                                                             onClick={() => handleOrderClick(order)}
                                    >
                                      <div>
                                        <div className="font-medium text-gray-800">
                                          {order.materialType} (
                                                                                     <span 
                                             className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                                             onClick={() => handleOrderClick(order)}
                                           >
                                            {order.orderId}
                                          </span>
                                          )
                                        </div>
                                        <div className="text-xs text-gray-600">Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-600">Status: {order.isDelivered ? 'Ready' : 'Pending'}</div>
                                      </div>
                                      <div className="mt-2 md:mt-0">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.isDelivered ? 'Ready' : 'Pending'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard; 