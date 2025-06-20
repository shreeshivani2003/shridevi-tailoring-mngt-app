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
  getCustomersWithOrderCounts: () => (Customer & { orderCount: number })[];
  getCustomerOrderCount: (customerId: string) => number;
  loading: boolean;
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
        throw customersError;
      }

      // Map Supabase data to our app format
      const mappedCustomers = (customersData || []).map((customer: any) => ({
        id: customer.id,
        customerId: customer.customer_id,
        name: customer.name,
        phone: customer.phone,
        whatsappNumber: customer.whatsapp_number,
        whatsappEnabled: customer.whatsapp_enabled,
        address: customer.address,
        notes: customer.notes,
        createdAt: new Date(customer.created_at),
        orders: []
      }));
      setCustomers(mappedCustomers);

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        throw ordersError;
      }

      // Map Supabase data to our app format
      const mappedOrders = (ordersData || []).map((order: any) => ({
        id: order.id,
        orderId: order.order_id,
        customerId: order.customer_id,
        customerName: order.customer_name,
        materialType: order.material_type,
        description: order.description,
        orderType: order.order_type,
        givenDate: new Date(order.given_date),
        deliveryDate: new Date(order.delivery_date),
        currentStatus: order.current_status,
        statusHistory: order.status_history || [],
        isDelivered: order.is_delivered,
        createdAt: new Date(order.created_at),
        sizes: order.sizes || {},
        referenceImage: order.reference_image,
        notes: order.notes,
        approximateAmount: order.approximate_amount || 0,
        sizeBookNo: order.size_book_no,
        hint: order.hint
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays on error
      setCustomers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => {
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        customerId: generateCustomerId(),
        createdAt: new Date(),
        orders: []
      };

      // Map to Supabase schema (snake_case)
      const supabaseCustomer = {
        id: newCustomer.id,
        customer_id: newCustomer.customerId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        whatsapp_number: newCustomer.whatsappNumber || null,
        whatsapp_enabled: newCustomer.whatsappEnabled,
        address: newCustomer.address || null,
        notes: newCustomer.notes || null,
        created_at: newCustomer.createdAt.toISOString()
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([supabaseCustomer])
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        throw error;
      }

      // Map back to our app's format
      const mappedCustomer: Customer = {
        id: data.id,
        customerId: data.customer_id,
        name: data.name,
        phone: data.phone,
        whatsappNumber: data.whatsapp_number,
        whatsappEnabled: data.whatsapp_enabled,
        address: data.address,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        orders: []
      };

      setCustomers(prev => [mappedCustomer, ...prev]);
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      // Convert camelCase to snake_case for Supabase
      const updateData: any = {};
      if (customerData.customerId !== undefined) updateData.customer_id = customerData.customerId;
      if (customerData.name !== undefined) updateData.name = customerData.name;
      if (customerData.phone !== undefined) updateData.phone = customerData.phone;
      if (customerData.whatsappNumber !== undefined) updateData.whatsapp_number = customerData.whatsappNumber;
      if (customerData.whatsappEnabled !== undefined) updateData.whatsapp_enabled = customerData.whatsappEnabled;
      if (customerData.address !== undefined) updateData.address = customerData.address;
      if (customerData.notes !== undefined) updateData.notes = customerData.notes;

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }

      // Map back to our app's format
      const mappedCustomer: Customer = {
        id: data.id,
        customerId: data.customer_id,
        name: data.name,
        phone: data.phone,
        whatsappNumber: data.whatsapp_number,
        whatsappEnabled: data.whatsapp_enabled,
        address: data.address,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        orders: []
      };

      setCustomers(prev => prev.map(customer => 
        customer.id === id ? mappedCustomer : customer
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
      
      // Convert camelCase to snake_case for all fields
      const newOrder = {
        id: Date.now().toString(),
        order_id: generateOrderId(orderData.orderType),
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        order_type: orderData.orderType,
        material_type: orderData.materialType,
        size_book_no: orderData.sizeBookNo,
        hint: orderData.hint,
        description: orderData.description,
        sizes: orderData.sizes,
        reference_image: orderData.referenceImage || null,
        notes: orderData.notes,
        delivery_date: orderData.deliveryDate.toISOString(),
        given_date: orderData.givenDate.toISOString(),
        approximate_amount: orderData.approximateAmount,
        created_at: new Date().toISOString(),
        current_status: initialStatus,
        status_history: [{
          stage: initialStatus,
          completed_at: new Date().toISOString(),
          notes: 'Order created'
        }],
        is_delivered: false
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

      // Map back to our app's format
      const mappedOrder: Order = {
        id: data.id,
        orderId: data.order_id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        materialType: data.material_type,
        description: data.description,
        orderType: data.order_type,
        givenDate: new Date(data.given_date),
        deliveryDate: new Date(data.delivery_date),
        currentStatus: data.current_status,
        statusHistory: data.status_history || [],
        isDelivered: data.is_delivered,
        createdAt: new Date(data.created_at),
        sizes: data.sizes || {},
        referenceImage: data.reference_image,
        notes: data.notes,
        approximateAmount: data.approximate_amount || 0,
        sizeBookNo: data.size_book_no,
        hint: data.hint
      };

      setOrders(prev => [mappedOrder, ...prev]);
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
      const updateData: any = {};
      
      // Convert camelCase to snake_case for all fields
      if (orderData.customerId !== undefined) updateData.customer_id = orderData.customerId;
      if (orderData.customerName !== undefined) updateData.customer_name = orderData.customerName;
      if (orderData.orderType !== undefined) updateData.order_type = orderData.orderType;
      if (orderData.materialType !== undefined) updateData.material_type = orderData.materialType;
      if (orderData.sizeBookNo !== undefined) updateData.size_book_no = orderData.sizeBookNo;
      if (orderData.hint !== undefined) updateData.hint = orderData.hint;
      if (orderData.description !== undefined) updateData.description = orderData.description;
      if (orderData.sizes !== undefined) updateData.sizes = orderData.sizes;
      if (orderData.referenceImage !== undefined) updateData.reference_image = orderData.referenceImage;
      if (orderData.notes !== undefined) updateData.notes = orderData.notes;
      if (orderData.approximateAmount !== undefined) updateData.approximate_amount = orderData.approximateAmount;
      if (orderData.currentStatus !== undefined) updateData.current_status = orderData.currentStatus;
      if (orderData.statusHistory !== undefined) updateData.status_history = orderData.statusHistory;
      if (orderData.isDelivered !== undefined) updateData.is_delivered = orderData.isDelivered;
      
      // Convert Date objects to ISO strings for Supabase
      if (orderData.deliveryDate) {
        updateData.delivery_date = orderData.deliveryDate.toISOString();
      }
      if (orderData.givenDate) {
        updateData.given_date = orderData.givenDate.toISOString();
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

      // Map back to our app's format
      const mappedOrder: Order = {
        id: data.id,
        orderId: data.order_id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        materialType: data.material_type,
        description: data.description,
        orderType: data.order_type,
        givenDate: new Date(data.given_date),
        deliveryDate: new Date(data.delivery_date),
        currentStatus: data.current_status,
        statusHistory: data.status_history || [],
        isDelivered: data.is_delivered,
        createdAt: new Date(data.created_at),
        sizes: data.sizes || {},
        referenceImage: data.reference_image,
        notes: data.notes,
        approximateAmount: data.approximate_amount || 0,
        sizeBookNo: data.size_book_no,
        hint: data.hint
      };

      setOrders(prev => prev.map(order => 
        order.id === id ? mappedOrder : order
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

      // Map back to our app's format
      const mappedOrder: Order = {
        id: data.id,
        orderId: data.order_id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        materialType: data.material_type,
        description: data.description,
        orderType: data.order_type,
        givenDate: new Date(data.given_date),
        deliveryDate: new Date(data.delivery_date),
        currentStatus: data.current_status,
        statusHistory: data.status_history || [],
        isDelivered: data.is_delivered,
        createdAt: new Date(data.created_at),
        sizes: data.sizes || {},
        referenceImage: data.reference_image,
        notes: data.notes,
        approximateAmount: data.approximate_amount || 0,
        sizeBookNo: data.size_book_no,
        hint: data.hint
      };

      setOrders(prev => prev.map(order => 
        order.orderId === orderId ? mappedOrder : order
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

  // Calculate order count for a customer
  const getCustomerOrderCount = (customerId: string): number => {
    return orders.filter(order => order.customerId === customerId).length;
  };

  // Get customers with their order counts
  const getCustomersWithOrderCounts = (): (Customer & { orderCount: number })[] => {
    return customers.map(customer => ({
      ...customer,
      orderCount: getCustomerOrderCount(customer.id)
    }));
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
      getCustomersWithOrderCounts,
      getCustomerOrderCount,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};