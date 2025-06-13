import React, { createContext, useContext, useState } from 'react';
import { Customer, Order, MaterialType, materialStages } from '../types';

interface DataContextType {
  customers: Customer[];
  orders: Order[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'currentStatus' | 'statusHistory' | 'isDelivered'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (orderId: string, newStatus: string, notes?: string) => void;
  searchOrders: (query: string) => Order[];
  searchCustomers: (query: string) => Customer[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    customerId: 'CUST001',
    phone: '9876543210',
    whatsappNumber: '9876543210',
    whatsappEnabled: true,
    address: '123 Main Street, Chennai',
    notes: 'Regular customer',
    createdAt: new Date(),
    orders: []
  },
  {
    id: '2',
    name: 'Meera Rajesh',
    customerId: 'CUST002',
    phone: '9876543211',
    whatsappNumber: '9876543211',
    whatsappEnabled: true,
    address: '456 Oak Avenue, Chennai',
    notes: 'Prefers traditional designs',
    createdAt: new Date(),
    orders: []
  }
];

const mockOrders: Order[] = [
  {
    id: '1',
    orderId: 'ORD001',
    customerId: '1',
    customerName: 'Priya Sharma',
    materialType: 'blouse',
    description: 'Silk blouse with embroidery',
    sizes: { chest: '36', waist: '32', armLength: '15' },
    notes: 'Gold thread work required',
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    givenDate: new Date(),
    approximateAmount: 1500,
    currentStatus: 'Stitching',
    statusHistory: [
      { stage: 'Checking', completedAt: new Date(), notes: 'Measurements verified' },
      { stage: 'Cutting', completedAt: new Date(), notes: 'Fabric cut as per design' }
    ],
    isDelivered: false,
    createdAt: new Date()
  },
  {
    id: '2',
    orderId: 'ORD002',
    customerId: '2',
    customerName: 'Meera Rajesh',
    materialType: 'chudi',
    description: 'Cotton chudi set',
    sizes: { chest: '38', waist: '34', kurti: '42' },
    notes: 'Simple design preferred',
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    givenDate: new Date(),
    approximateAmount: 800,
    currentStatus: 'Checking',
    statusHistory: [],
    isDelivered: false,
    createdAt: new Date()
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const generateCustomerId = () => {
    return `CUST${String(customers.length + 1).padStart(3, '0')}`;
  };

  const generateOrderId = () => {
    return `ORD${String(orders.length + 1).padStart(3, '0')}`;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'orders'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      customerId: generateCustomerId(),
      createdAt: new Date(),
      orders: []
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...customerData } : customer
    ));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
    setOrders(prev => prev.filter(order => order.customerId !== id));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'currentStatus' | 'statusHistory' | 'isDelivered'>) => {
    const newOrder: Order = {
      ...orderData,
      id: Date.now().toString(),
      orderId: generateOrderId(),
      currentStatus: materialStages[orderData.materialType][0],
      statusHistory: [],
      isDelivered: false,
      createdAt: new Date()
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const updateOrder = (id: string, orderData: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...orderData } : order
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  const updateOrderStatus = (orderId: string, newStatus: string, notes?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.orderId === orderId) {
        const newStatusHistory = [...order.statusHistory, {
          stage: newStatus,
          completedAt: new Date(),
          notes
        }];
        return {
          ...order,
          currentStatus: newStatus,
          statusHistory: newStatusHistory,
          isDelivered: newStatus === 'Delivery'
        };
      }
      return order;
    }));
  };

  const searchOrders = (query: string): Order[] => {
    if (!query.trim()) return orders;
    const lowercaseQuery = query.toLowerCase();
    return orders.filter(order => 
      order.orderId.toLowerCase().includes(lowercaseQuery) ||
      order.customerName.toLowerCase().includes(lowercaseQuery) ||
      order.materialType.toLowerCase().includes(lowercaseQuery) ||
      order.description.toLowerCase().includes(lowercaseQuery)
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
      searchCustomers
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};