import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Order, MaterialType, OrderType, materialStages, OrderCreationData } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { checkMigrationNeeded, migrateOrderStatuses } from '../utils/statusMigration';

interface DataContextType {
  customers: Customer[];
  orders: Order[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'currentStatus' | 'statusHistory' | 'isDelivered'>) => Promise<void>;
  addMultipleOrders: (orderData: OrderCreationData) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string, notes?: string) => Promise<{ order: Order; isFinalStage: boolean; nextStatus: string }>;
  searchOrders: (query: string) => Order[];
  searchCustomers: (query: string) => Customer[];
  getCustomersWithOrderCounts: () => (Customer & { orderCount: number })[];
  getCustomerOrderCount: (customerId: string) => number;
  getDeliveredOrders: () => Order[];
  getReadyForDeliveryOrders: () => Order[];
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
  // Shorter, simpler order ID: ORD12345 or EMG12345 or ALT12345
  let prefix = 'ORD';
  if (orderType === 'emergency') prefix = 'EMG';
  if (orderType === 'alter') prefix = 'ALT';
  const random = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `${prefix}${random}`;
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
    setLoading(true);
    try {
      // Check if Supabase is configured
      if (!isSupabaseReady) {
        console.warn('Supabase not configured. Please create a .env file with your Supabase credentials.');
        setLoading(false);
        return;
      }

      // Check if migration is needed and run it
      const needsMigration = await checkMigrationNeeded();
      if (needsMigration) {
        console.log('Status migration needed, running migration...');
        await migrateOrderStatuses();
      }

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) {
        console.error('Error loading customers:', customersError);
      } else {
        const mappedCustomers: Customer[] = (customersData || []).map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          customerId: customer.customer_id,
          phone: customer.phone,
          whatsappNumber: customer.whatsapp_number,
          whatsappEnabled: customer.whatsapp_enabled,
          address: customer.address,
          notes: customer.notes,
          createdAt: new Date(customer.created_at),
          orders: []
        }));
        setCustomers(mappedCustomers);
      }

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_id, customer_id, customer_name, material_type, description, order_type, given_date, delivery_date, current_status, status_history, is_delivered, created_at, size_book_no, hint, reference_image, approximate_amount, sizes, notes')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
      } else {
        const mappedOrders: Order[] = (ordersData || []).map((order: any) => ({
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
      // Check if Supabase is configured
      if (!isSupabaseReady) {
        throw new Error('Supabase not configured. Please create a .env file with your Supabase credentials.');
      }

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

      console.log('Attempting to insert order:', newOrder);

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding order:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Order inserted successfully:', data);

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

      // Get the stages for this material type
      const stages = materialStages[order.materialType as keyof typeof materialStages];
      if (!stages) {
        throw new Error('Invalid material type');
      }

      // Find current stage index, handling old status names
      let currentIndex = stages.indexOf(order.currentStatus);
      
      // If not found, try to migrate old status names
      if (currentIndex === -1) {
        currentIndex = migrateOldStatus(order.currentStatus, order.materialType);
      }

      // If still not found, default to first stage
      if (currentIndex === -1) {
        currentIndex = 0;
      }

      // Determine the next status
      let nextStatus = newStatus;
      if (newStatus === 'next') {
        if (currentIndex < stages.length - 1) {
          nextStatus = stages[currentIndex + 1];
        } else {
          throw new Error('Already at final stage');
        }
      }

      // Check if this is the final stage (Delivery)
      const isFinalStage = nextStatus === 'Delivery';
      const isDelivered = isFinalStage;

      const newStatusHistory = [
        ...order.statusHistory,
        {
          stage: nextStatus,
          completed_at: new Date().toISOString(),
          notes: notes || (isFinalStage ? 'Order completed and ready for delivery' : `Moved to ${nextStatus}`)
        }
      ];

      const { data, error } = await supabase
        .from('orders')
        .update({
          current_status: nextStatus,
          status_history: newStatusHistory,
          is_delivered: isDelivered
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

      // Return information about the update for UI handling
      return {
        order: mappedOrder,
        isFinalStage,
        nextStatus
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  // Helper function to migrate old status names to new ones
  const migrateOldStatus = (oldStatus: string, materialType: MaterialType): number => {
    const stages = materialStages[materialType];
    
    // Handle old "Checking" status migration
    if (oldStatus === 'Checking') {
      // Check if this is likely the first or second checking based on context
      // For now, we'll assume it's the first checking and migrate to "Initial Checking"
      return stages.indexOf('Initial Checking');
    }
    
    // Handle other potential old status names
    const statusMappings: Record<string, string> = {
      'Order Received': 'Initial Checking',
      'In Progress': 'In Process',
      'Final Check': 'Final Checking',
      'Final Inspection': 'Final Checking'
    };
    
    const mappedStatus = statusMappings[oldStatus];
    if (mappedStatus) {
      return stages.indexOf(mappedStatus);
    }
    
    return -1; // Not found
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

  const addMultipleOrders = async (orderData: OrderCreationData) => {
    try {
      if (!isSupabaseReady) {
        throw new Error('Supabase not configured. Please create a .env file with your Supabase credentials.');
      }
      const initialStatus = 'Order Received';
      const ordersToCreate = [];
      const usedIds = new Set();
      for (let i = 0; i < orderData.numberOfItems; i++) {
        let orderId;
        do {
          orderId = generateOrderId(orderData.orderType);
        } while (usedIds.has(orderId));
        usedIds.add(orderId);
        const newOrder = {
          id: (Date.now() + i).toString(),
          order_id: orderId,
          customer_id: orderData.customerId,
          customer_name: orderData.customerName,
          order_type: orderData.orderType,
          material_type: orderData.materialType,
          size_book_no: orderData.sizeBookNo,
          hint: orderData.hint || '',
          description: orderData.description,
          sizes: {},
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
        ordersToCreate.push(newOrder);
      }
      console.log(`Attempting to insert ${ordersToCreate.length} orders`);
      const { data, error } = await supabase
        .from('orders')
        .insert(ordersToCreate)
        .select();
      if (error) {
        console.error('Supabase error adding orders:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      console.log('Orders inserted successfully:', data);
      const mappedOrders: Order[] = (data || []).map((order: any) => ({
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
      setOrders(prev => [...mappedOrders, ...prev]);
    } catch (error) {
      console.error('Error adding multiple orders:', error);
      throw error;
    }
  };

  // Get delivered orders for the delivery bucket
  const getDeliveredOrders = (): Order[] => {
    return orders.filter(order => order.isDelivered);
  };

  // Get orders ready for delivery (completed all stages but not yet delivered)
  const getReadyForDeliveryOrders = (): Order[] => {
    return orders.filter(order => {
      const stages = materialStages[order.materialType as keyof typeof materialStages];
      if (!stages) {
        console.warn('Unknown material type in getReadyForDeliveryOrders:', order.materialType, order);
        return false;
      }
      const currentIndex = stages.indexOf(order.currentStatus);
      return currentIndex === stages.length - 2 && !order.isDelivered;
    });
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
      getDeliveredOrders,
      getReadyForDeliveryOrders,
      loading,
      addMultipleOrders
    }}>
      {children}
    </DataContext.Provider>
  );
};