import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Order, MaterialType, OrderType, materialStages } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  customers: Customer[];
  orders: Order[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'currentStatus' | 'statusHistory' | 'isDelivered'>) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string, notes?: string) => Promise<void>;
  searchOrders: (query: string) => Order[];
  searchCustomers: (query: string) => Customer[];
  loading: boolean;
  supabaseConfigured: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const generateCustomerId = () => {
  return `CUST${String(Date.now()).slice(-6)}`;
};

const generateOrderId = (orderType: OrderType) => {
  const prefix = orderType === 'regular' ? 'ORD' : 'EMG';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Load initial data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error('Error loading customers:', customersError);
        if (customersError.message.includes('Supabase not configured')) {
          setSupabaseConfigured(false);
        }
        // If Supabase is not configured, use empty array
        setCustomers([]);
      } else {
        setCustomers(customersData || []);
      }

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        if (ordersError.message.includes('Supabase not configured')) {
          setSupabaseConfigured(false);
        }
        // If Supabase is not configured, use empty array
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays as fallback
      setCustomers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => {
    try {
      const newCustomer = {
        ...customerData,
        id: Date.now().toString(),
        customerId: generateCustomerId(),
        createdAt: new Date().toISOString(),
        orders: []
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        throw error;
      }

      setCustomers(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }

      setCustomers(prev => prev.map(customer => 
        customer.id === id ? data : customer
      ));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      setOrders(prev => prev.filter(order => order.customerId !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'currentStatus' | 'statusHistory' | 'isDelivered'>) => {
    try {
      const initialStatus = 'Order Received';
      const newOrder = {
        ...orderData,
        id: Date.now().toString(),
        order_id: generateOrderId(orderData.orderType),
        created_at: new Date().toISOString(),
        current_status: initialStatus,
        status_history: [{
          stage: initialStatus,
          completed_at: new Date().toISOString(),
          notes: 'Order created'
        }],
        is_delivered: false,
        delivery_date: orderData.deliveryDate.toISOString(),
        given_date: orderData.givenDate.toISOString()
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) {
        console.error('Error adding order:', error);
        throw error;
      }

      setOrders(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
      const updateData: any = { ...orderData };
      
      // Convert Date objects to ISO strings for Supabase
      if (orderData.deliveryDate) {
        updateData.delivery_date = orderData.deliveryDate.toISOString();
        delete updateData.deliveryDate;
      }
      if (orderData.givenDate) {
        updateData.given_date = orderData.givenDate.toISOString();
        delete updateData.givenDate;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      setOrders(prev => prev.map(order => 
        order.id === id ? data : order
      ));
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting order:', error);
        throw error;
      }

      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      const order = orders.find(o => o.orderId === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const newStatusHistory = [
        ...order.statusHistory,
        {
          stage: newStatus,
          completed_at: new Date().toISOString(),
          notes
        }
      ];

      const { data, error } = await supabase
        .from('orders')
        .update({
          current_status: newStatus,
          status_history: newStatusHistory,
          is_delivered: newStatus === 'Delivery'
        })
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      setOrders(prev => prev.map(order => 
        order.orderId === orderId ? data : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const searchOrders = (query: string): Order[] => {
    if (!query.trim()) return orders;
    const lowercaseQuery = query.toLowerCase();
    return orders.filter(order => 
      order.orderId.toLowerCase().includes(lowercaseQuery) ||
      order.customerName.toLowerCase().includes(lowercaseQuery) ||
      order.materialType.toLowerCase().includes(lowercaseQuery) ||
      order.description.toLowerCase().includes(lowercaseQuery) ||
      order.sizeBookNo.toLowerCase().includes(lowercaseQuery) ||
      order.hint.toLowerCase().includes(lowercaseQuery)
    );
  };

  const searchCustomers = (query: string): Customer[] => {
    if (!query.trim()) return customers;
    const lowercaseQuery = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowercaseQuery) ||
      customer.customerId.toLowerCase().includes(lowercaseQuery) ||
      customer.phone.includes(query)
    );
  };

  return (
    <DataContext.Provider value={{
      customers,
      orders,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addOrder,
      updateOrder,
      deleteOrder,
      updateOrderStatus,
      searchOrders,
      searchCustomers,
      loading,
      supabaseConfigured
    }}>
      {children}
      {!supabaseConfigured && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Supabase not configured
              </p>
              <p className="text-sm mt-1">
                Data is not being saved to database. Please check SUPABASE_SETUP.md for instructions.
              </p>
            </div>
          </div>
        </div>
      )}
    </DataContext.Provider>
  );
};