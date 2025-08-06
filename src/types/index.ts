export interface User {
  id: string;
  username: string;
  password: string;
  role: 'super_admin' | 'admin' | 'user';
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  customerId: string;
  phone: string;
  whatsappNumber?: string;
  whatsappEnabled: boolean;
  address?: string;
  notes?: string;
  createdAt: Date;
  orders: Order[];
}

export type MaterialType = 'blouse' | 'chudi' | 'saree' | 'works' | 'others' | 'lehenga';

export type OrderType = 'regular' | 'emergency' | 'alter';

export type BlouseMaterialCategory = 'normal' | 'piping';

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  orderType: OrderType;
  materialType: MaterialType;
  hint: string;
  description: string;
  sizes: SizeChart;
  referenceImage?: string;
  notes: string;
  deliveryDate: Date;
  givenDate: Date;
  approximateAmount: number;
  currentStatus: string;
  statusHistory: StatusUpdate[];
  isDelivered: boolean;
  createdAt: Date;
  batch_tag?: string;
  // New fields for enhanced features
  sizeBookNo?: string; // Page number where customer size is noted
  blouseMaterialCategory?: BlouseMaterialCategory; // 'normal' or 'piping'
  liningClothGiven?: boolean;
  fallsClothGiven?: boolean;
  sareeServiceType?: string;
  numberOfItems?: number;
  serviceTypes?: string[];
}

export interface StatusUpdate {
  stage: string;
  completedAt: Date;
  notes?: string;
}

export interface SizeChart {
  [key: string]: string | number | null;
}

export const materialStages: Record<MaterialType, string[]> = {
  blouse: ['Initial Checking', 'Cutting', 'Stitching', 'Hemming', 'Final Checking', 'Delivery'],
  chudi: ['Initial Checking', 'Cutting', 'Stitching', 'Final Checking', 'Delivery'],
  works: ['Initial Checking', 'Marking', 'Work', 'Cutting', 'Stitching', 'Hemming', 'Final Checking', 'Delivery'],
  saree: ['Initial Checking', 'In Process', 'Delivery'],
  others: ['Cutting', 'In Process', 'Delivery'],
  lehenga: ['Initial Checking', 'Cutting', 'Stitching', 'Hemming', 'Final Checking', 'Delivery'],
};

export const materialServiceTypes: Record<MaterialType, string[]> = {
  blouse: ['lining blouse', 'princess cut', 'simple design', 'boat neck'],
  chudi: ['normal', 'design'],
  works: ['normal', 'heavy', 'machine work'],
  lehenga: ['normal', 'heavy'],
  saree: ['saree oram'],
  others: [],
};

export const tamilSizeFields = [
  { key: 'chest', tamil: 'மார்பு சுற்றளவு', english: 'Chest' },
  { key: 'waist', tamil: 'இடுப்பு சுற்றளவு', english: 'Waist' },
  { key: 'hip', tamil: 'இடுப்பு', english: 'Hip' },
  { key: 'shoulder', tamil: 'தோள்பட்டை', english: 'Shoulder' },
  { key: 'armLength', tamil: 'கை நீளம்', english: 'Arm Length' },
  { key: 'armHole', tamil: 'கை துளை', english: 'Arm Hole' },
  { key: 'neck', tamil: 'கழுத்து', english: 'Neck' },
  { key: 'blouseLength', tamil: 'ரவிக்கை நீளம்', english: 'Blouse Length' },
  { key: 'skirtLength', tamil: 'பாவாடை நீளம்', english: 'Skirt Length' },
  { key: 'kurti', tamil: 'குர்த்தா', english: 'Kurti' },
  { key: 'pant', tamil: 'பேண்ட்', english: 'Pant' },
  { key: 'salwarLength', tamil: 'சல்வார் நீளம்', english: 'Salwar Length' }
];

// New interface for order creation with number of items
export interface OrderCreationData {
  customerId: string;
  customerName: string;
  orderType: OrderType;
  materialType: MaterialType;
  hint: string;
  deliveryDate: Date;
  givenDate: Date;
  approximateAmount: number;
  numberOfItems: number;
  liningClothGiven?: boolean;
  fallsClothGiven?: boolean;
  sareeServiceType?: string;
  batchTag?: string;
  sizeBookNo?: string;
  blouseMaterialCategory?: BlouseMaterialCategory;
  serviceTypes?: string[];
}