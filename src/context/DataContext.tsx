import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Order, MaterialType, OrderType, materialStages, OrderCreationData } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { checkMigrationNeeded, migrateOrderStatuses } from '../utils/statusMigration';

// Add Batch type
export interface Batch {
  batch_tag: string;
  batch_name: string;
  customer_id: string;
}

interface DataContextType {
  customers: Customer[];
  orders: Order[];
  batches: Batch[]; // <-- add this
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'currentStatus' | 'statusHistory' | 'isDelivered'>) => Promise<void>;
  addMultipleOrders: (orderData: OrderCreationData) => Promise<void>;
  addMultipleOrdersOptimized: (orderDataArray: OrderCreationData[]) => Promise<void>;
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
  updateOrderBatchTag: (orderId: string, batchTag: string | null) => Promise<void>;
  loadData: () => Promise<void>; // <-- expose loadData
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const generateCustomerId = (customers: Customer[]) => {
  const ids = customers
    .map((c: Customer) => c.customerId)
    .filter((id: string) => /^CUST\d+$/.test(id))
    .map((id: string) => parseInt(id.replace('CUST', ''), 10));
  const next = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return `CUST${String(next).padStart(2, '0')}`;
};

const generateOrderId = (orders: Order[], orderType: OrderType) => {
  let prefix = 'ORD';
  if (orderType === 'emergency') prefix = 'EMG';
  if (orderType === 'alter') prefix = 'ALT';
  const ids = orders
    .map((o: Order) => o.orderId)
    .filter((id: string) => id && id.startsWith(prefix))
    .map((id: string) => parseInt(id.replace(prefix, ''), 10))
    .filter((num: number) => !isNaN(num));
  const next = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return `${prefix}${String(next).padStart(2, '0')}`;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]); // <-- add this
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
        .select('id, order_id, customer_id, customer_name, material_type, order_type, given_date, delivery_date, current_status, status_history, is_delivered, created_at, hint, approximate_amount, batch_tag, size_book_no, blouse_material_category, lining_cloth_given, falls_cloth_given, saree_service_type, number_of_items, service_types')
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
          hint: order.hint,
          batch_tag: order.batch_tag,
                  sizeBookNo: order.size_book_no,
        blouseMaterialCategory: order.blouse_material_category,
          liningClothGiven: order.lining_cloth_given,
          fallsClothGiven: order.falls_cloth_given,
          sareeServiceType: order.saree_service_type,
          numberOfItems: order.number_of_items,
          serviceTypes: order.service_types || []
        }));
        setOrders(mappedOrders);
      }

      // Load batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('batch_tag, batch_name, customer_id');
      if (batchesError) {
        console.error('Error loading batches:', batchesError);
      } else {
        setBatches(batchesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'orders'>): Promise<Customer> => {
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        customerId: generateCustomerId(customers),
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
      return mappedCustomer;
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
        order_id: generateOrderId(orders, orderData.orderType),
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        order_type: orderData.orderType,
        material_type: orderData.materialType,
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
        is_delivered: false,
        service_types: orderData.serviceTypes || []
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
        hint: data.hint,
        serviceTypes: data.service_types || []
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
      if (orderData.hint !== undefined) updateData.hint = orderData.hint;
      if (orderData.description !== undefined) updateData.description = orderData.description;
      if (orderData.sizes !== undefined) updateData.sizes = orderData.sizes;
      if (orderData.referenceImage !== undefined) updateData.reference_image = orderData.referenceImage;
      if (orderData.notes !== undefined) updateData.notes = orderData.notes;
      if (orderData.approximateAmount !== undefined) updateData.approximate_amount = orderData.approximateAmount;
      if (orderData.currentStatus !== undefined) updateData.current_status = orderData.currentStatus;
      if (orderData.statusHistory !== undefined) updateData.status_history = orderData.statusHistory;
      if (orderData.isDelivered !== undefined) updateData.is_delivered = orderData.isDelivered;
      if (orderData.sizeBookNo !== undefined) updateData.size_book_no = orderData.sizeBookNo;
      if (orderData.blouseMaterialCategory !== undefined) updateData.blouse_material_category = orderData.blouseMaterialCategory;

      if (orderData.liningClothGiven !== undefined) updateData.lining_cloth_given = orderData.liningClothGiven;
      if (orderData.fallsClothGiven !== undefined) updateData.falls_cloth_given = orderData.fallsClothGiven;
      if (orderData.sareeServiceType !== undefined) updateData.saree_service_type = orderData.sareeServiceType;
      if (orderData.numberOfItems !== undefined) updateData.number_of_items = orderData.numberOfItems;
      if (orderData.serviceTypes !== undefined) updateData.service_types = orderData.serviceTypes;
      
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
        hint: data.hint,
        serviceTypes: data.service_types || []
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
    console.log('addMultipleOrders received:', orderData);
    
    // Generate order numbers locally instead of using RPC function
    const numberOfItems = parseInt(orderData.numberOfItems.toString(), 10);
    
    // Get the latest order number from existing orders
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('order_id')
      .or(`order_id.like.ORD%,order_id.like.EMG%,order_id.like.ALT%`)
      .order('order_id', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      throw new Error('Failed to fetch existing orders: ' + fetchError.message);
    }
    
    let nextOrderNumber = 1;
    if (existingOrders && existingOrders.length > 0) {
      const latestOrderId = existingOrders[0].order_id;
      const orderNumber = parseInt(latestOrderId.replace(/^(ORD|EMG|ALT)/, ''), 10);
      if (!isNaN(orderNumber)) {
        nextOrderNumber = orderNumber + 1;
      }
    }
    
    // Determine the correct prefix based on order type
    let prefix = 'ORD';
    if (orderData.orderType === 'emergency') prefix = 'EMG';
    if (orderData.orderType === 'alter') prefix = 'ALT';
    
    for (let i = 0; i < numberOfItems; i++) {
      const orderNumber = nextOrderNumber + i;
      const orderId = `${prefix}${String(orderNumber).padStart(2, '0')}`;
      const newOrder = {
        id: (Date.now() + i).toString(),
        order_id: orderId,
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        order_type: orderData.orderType,
        material_type: orderData.materialType,
        hint: orderData.hint || '',
        number_of_items: 1,
        lining_cloth_given: orderData.liningClothGiven,
        falls_cloth_given: orderData.fallsClothGiven,
        saree_service_type: orderData.sareeServiceType,

        batch_tag: orderData.batchTag || undefined,
        delivery_date: orderData.deliveryDate.toISOString(),
        given_date: orderData.givenDate.toISOString(),
        approximate_amount: orderData.approximateAmount,
        created_at: new Date().toISOString(),
        current_status: 'Order Received',
        status_history: [{
          stage: 'Order Received',
          completed_at: new Date().toISOString(),
          notes: 'Order created'
        }],
        is_delivered: false,
        size_book_no: orderData.sizeBookNo,
        blouse_material_category: orderData.blouseMaterialCategory,

      };
      console.log('Inserting newOrder:', newOrder);
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select();
      if (error) {
        console.error('Supabase error adding order:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      console.log('Order inserted successfully:', data);
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
        referenceImage: order.reference_image,
        approximateAmount: order.approximate_amount || 0,
        hint: order.hint,
        batch_tag: order.batch_tag,
        sizes: {},
        notes: '',
        sizeBookNo: order.size_book_no,
        blouseMaterialCategory: order.blouse_material_category,
        liningClothGiven: order.lining_cloth_given,
        fallsClothGiven: order.falls_cloth_given,
        sareeServiceType: order.saree_service_type,

        numberOfItems: order.number_of_items
      }));
      setOrders(prev => [...mappedOrders, ...prev]);
    }
  };

  // Optimized version for bulk order creation
  const addMultipleOrdersOptimized = async (orderDataArray: OrderCreationData[]) => {
    console.log(`addMultipleOrdersOptimized received ${orderDataArray.length} orders`);
    
    if (orderDataArray.length === 0) return;
    
    // Get all existing order IDs to ensure uniqueness
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('order_id')
      .or(`order_id.like.ORD%,order_id.like.EMG%,order_id.like.ALT%`)
      .order('order_id', { ascending: false });
    
    if (fetchError) {
      throw new Error('Failed to fetch existing orders: ' + fetchError.message);
    }
    
    // Get the highest order number from existing orders
    let maxOrderNumber = 0;
    if (existingOrders && existingOrders.length > 0) {
      const orderNumbers = existingOrders
        .map(order => {
          const match = order.order_id.match(/^(ORD|EMG|ALT)(\d+)$/);
          return match ? parseInt(match[2], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      if (orderNumbers.length > 0) {
        maxOrderNumber = Math.max(...orderNumbers);
      }
    }
    
    // Prepare all orders for bulk insert
    const ordersToInsert = [];
    const newOrders: Order[] = [];
    const generatedOrderIds = new Set(); // Track generated IDs to prevent duplicates
    
    for (let i = 0; i < orderDataArray.length; i++) {
      const orderData = orderDataArray[i];
      const orderNumber = maxOrderNumber + i + 1;
      
      // Determine the correct prefix based on order type
      let prefix = 'ORD';
      if (orderData.orderType === 'emergency') prefix = 'EMG';
      if (orderData.orderType === 'alter') prefix = 'ALT';
      
      const orderId = `${prefix}${String(orderNumber).padStart(2, '0')}`;
      
      // Check for duplicate order ID
      if (generatedOrderIds.has(orderId)) {
        throw new Error(`Duplicate order ID generated: ${orderId}`);
      }
      generatedOrderIds.add(orderId);
      
      console.log(`Creating order ${i + 1}/${orderDataArray.length}: ${orderId} (number: ${orderNumber})`);
      
      const newOrder = {
        id: (Date.now() + i).toString(),
        order_id: orderId,
        customer_id: orderData.customerId,
        customer_name: orderData.customerName,
        order_type: orderData.orderType,
        material_type: orderData.materialType,
        hint: orderData.hint || '',
        number_of_items: orderData.numberOfItems,
        lining_cloth_given: orderData.liningClothGiven,
        falls_cloth_given: orderData.fallsClothGiven,
        saree_service_type: orderData.sareeServiceType,
        batch_tag: orderData.batchTag || undefined,
        delivery_date: orderData.deliveryDate.toISOString(),
        given_date: orderData.givenDate.toISOString(),
        approximate_amount: orderData.approximateAmount,
        created_at: new Date().toISOString(),
        current_status: 'Order Received',
        status_history: [{
          stage: 'Order Received',
          completed_at: new Date().toISOString(),
          notes: 'Order created'
        }],
        is_delivered: false,
        size_book_no: orderData.sizeBookNo,
        blouse_material_category: orderData.blouseMaterialCategory,
        service_types: orderData.serviceTypes || [],
      };
      
      ordersToInsert.push(newOrder);
      
      // Prepare mapped order for state update
      const mappedOrder: Order = {
        id: newOrder.id,
        orderId: newOrder.order_id,
        customerId: newOrder.customer_id,
        customerName: newOrder.customer_name,
        materialType: newOrder.material_type,
        description: '',
        orderType: newOrder.order_type,
        givenDate: new Date(newOrder.given_date),
        deliveryDate: new Date(newOrder.delivery_date),
        currentStatus: newOrder.current_status,
        statusHistory: newOrder.status_history || [],
        isDelivered: newOrder.is_delivered,
        createdAt: new Date(newOrder.created_at),
        referenceImage: '',
        approximateAmount: newOrder.approximate_amount || 0,
        hint: newOrder.hint,
        batch_tag: newOrder.batch_tag,
        sizes: {},
        notes: '',
        sizeBookNo: newOrder.size_book_no,
        blouseMaterialCategory: newOrder.blouse_material_category,
        liningClothGiven: newOrder.lining_cloth_given,
        fallsClothGiven: newOrder.falls_cloth_given,
        sareeServiceType: newOrder.saree_service_type,
        numberOfItems: newOrder.number_of_items,
        serviceTypes: newOrder.service_types || []
      };
      
      newOrders.push(mappedOrder);
    }
    
    // Bulk insert all orders at once
    console.log(`Bulk inserting ${ordersToInsert.length} orders...`);
    const { data, error } = await supabase
      .from('orders')
      .insert(ordersToInsert)
      .select();
    
    if (error) {
      console.error('Supabase error bulk inserting orders:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`Successfully inserted ${data?.length || 0} orders`);
    
    // Update state once with all new orders
    setOrders(prev => [...newOrders, ...prev]);
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

  // Update batch_tag for an order
  const updateOrderBatchTag = async (orderId: string, batchTag: string | null) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ batch_tag: batchTag })
        .eq('id', orderId)
        .select()
        .single();
      if (error) {
        console.error('Error updating batch_tag:', error);
        throw error;
      }
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, batch_tag: batchTag || undefined } : order));
    } catch (error) {
      console.error('Error updating batch_tag:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      customers,
      orders,
      batches, // <-- add this
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
      addMultipleOrders,
      addMultipleOrdersOptimized,
      updateOrderBatchTag,
      loadData // <-- expose loadData
    }}>
      {children}
    </DataContext.Provider>
  );
};