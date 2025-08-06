import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Calendar, DollarSign, FileText, Camera, Search, User, AlertTriangle, Package, Scissors } from 'lucide-react';
import { Customer, MaterialType, OrderType, BlouseMaterialCategory, materialServiceTypes } from '../types';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Layout';
import { supabase } from '../lib/supabase';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  order?: any;
  mode?: 'add' | 'edit' | 'view';
}



const OrderModal: React.FC<OrderModalProps> = ({ 
  isOpen, 
  onClose, 
  customer: initialCustomer, 
  order, 
  mode = 'add' 
}) => {
  const { addMultipleOrders, addMultipleOrdersOptimized, updateOrder, searchCustomers, orders, loadData } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [formData, setFormData] = useState({
    orderType: 'regular' as OrderType,
    materialType: 'blouse' as MaterialType,
    description: '',
    deliveryDate: '',
    approximateAmount: '',
    notes: '',
    referenceImage: '',
    numberOfItems: 1,
    editDeliveryDate: false,
    liningClothGiven: false, // for blouse/chudi
    fallsClothGiven: false, // for saree
    sareeServiceType: '', // for saree
    sizeBookNo: '', // Page number where customer size is noted
    blouseMaterialCategory: 'normal' as BlouseMaterialCategory, // 'normal' or 'piping'
    pipingDetails: '',
    fallsDetails: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [customizeEachItem, setCustomizeEachItem] = useState<{ [idx: number]: boolean }>({});
  const [customItems, setCustomItems] = useState<{ [idx: number]: any[] }>({});
  const notification = useNotification();

  // Batch selection state
  const [batches, setBatches] = useState<{ batch_tag: string, batch_name: string }[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('none');
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Fetch batches for selected customer
  useEffect(() => {
    const fetchBatches = async () => {
      if (!selectedCustomer) {
        setBatches([]);
        setSelectedBatch('none');
        return;
      }
      
      setLoadingBatches(true);
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('batch_tag, batch_name')
          .eq('customer_id', selectedCustomer.id)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error('Error fetching batches for customer:', selectedCustomer.id, error);
          notification.show('Failed to load batches. Please try again.');
          setBatches([]);
          setSelectedBatch('none');
        } else if (data) {
          console.log(`Fetched ${data.length} batches for customer ${selectedCustomer.name}:`, data);
          setBatches(data);
          
          // Set default selection: latest batch if exists, otherwise 'none'
          if (data.length === 0) {
            setSelectedBatch('none');
          } else {
            // Select the most recent batch (last in the array since we order by created_at ascending)
            const latestBatch = data[data.length - 1];
            setSelectedBatch(latestBatch.batch_tag);
            console.log(`Auto-selected latest batch: ${latestBatch.batch_name} (${latestBatch.batch_tag})`);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching batches:', err);
        notification.show('Failed to load batches. Please try again.');
        setBatches([]);
        setSelectedBatch('none');
      } finally {
        setLoadingBatches(false);
      }
    };
    
    fetchBatches();
  }, [selectedCustomer]);

  // Debug logging for batch state changes
  useEffect(() => {
    console.log('Batch state updated:', {
      selectedCustomer: selectedCustomer?.name,
      batchesCount: batches.length,
      selectedBatch,
      loadingBatches
    });
  }, [batches, selectedBatch, selectedCustomer, loadingBatches]);

  // Step 1: Multi-material state and handlers
  const initialMaterial = () => ({
    materialType: 'blouse',
    numberOfItems: 1,
    deliveryDate: '',
    notes: '',
    amount: '',
    liningClothGiven: false,
    fallsClothGiven: false,
    sareeServiceType: 'Falls Stitching',
    editDeliveryDate: false,
    serviceTypes: [],
  });

  const [materials, setMaterials] = useState([initialMaterial()]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);



  const handleMaterialChange = (idx: number, field: string, value: any) => {
    setMaterials(mats => mats.map((mat, i) => i === idx ? { ...mat, [field]: value } : mat));
  };
  const handleAddMaterial = () => {
    // Use the delivery date from the first material if available, otherwise use default
    const firstMaterialDeliveryDate = materials[0]?.deliveryDate;
    const defaultDate = firstMaterialDeliveryDate || (() => {
      const today = new Date();
      today.setDate(today.getDate() + 7);
      return today.toISOString().split('T')[0];
    })();
    
    // Use the size book number from the first material if available
    const firstMaterialSizeBookNo = formData.sizeBookNo;
    
    setMaterials(mats => [
      ...mats,
      { ...initialMaterial(), deliveryDate: formData.orderType === 'regular' ? defaultDate : '' }
    ]);
    
    // Set the size book number for the new material to match the first material
    if (firstMaterialSizeBookNo) {
      setFormData(prev => ({ ...prev, sizeBookNo: firstMaterialSizeBookNo }));
    }
  };
  const handleRemoveMaterial = (idx: number) => setMaterials(mats => mats.length > 1 ? mats.filter((_, i) => i !== idx) : mats);
  const handleEditMaterial = (idx: number) => setEditingIndex(idx);

  useEffect(() => {
    if (order && mode === 'edit') {
      setFormData({
        orderType: order.orderType,
        materialType: order.materialType,
        description: order.description,
        deliveryDate: new Date(order.deliveryDate).toISOString().split('T')[0],
        approximateAmount: order.approximateAmount.toString(),
        notes: order.notes,
        referenceImage: order.referenceImage || '',
        numberOfItems: order.numberOfItems || 1,
        editDeliveryDate: false,
        liningClothGiven: order.liningClothGiven || false,
        fallsClothGiven: order.fallsClothGiven || false,
        sareeServiceType: order.sareeServiceType || '',
        sizeBookNo: order.sizeBookNo || '',
        blouseMaterialCategory: order.blouseMaterialCategory || 'normal',
        pipingDetails: order.pipingDetails || '',
        fallsDetails: order.fallsDetails || '',

      });
    } else if (mode === 'add') {
      // Reset form for new orders
      setFormData({
        orderType: 'regular' as OrderType,
        materialType: 'blouse' as MaterialType,
        description: '',
        deliveryDate: '',
        approximateAmount: '',
        notes: '',
        referenceImage: '',
        numberOfItems: 1,
        editDeliveryDate: false,
        liningClothGiven: false,
        fallsClothGiven: false,
        sareeServiceType: '',
                    sizeBookNo: '',
        blouseMaterialCategory: 'normal' as BlouseMaterialCategory,
        pipingDetails: '',
        fallsDetails: '',


      });
      setCustomizeEachItem({});
      setCustomItems({});
    }
  }, [order, mode, isOpen]);

  // When numberOfItems or deliveryDate changes, update customItems defaults
  useEffect(() => {
    materials.forEach((mat, idx) => {
      if (!customizeEachItem[idx]) return;
      const count = mat.numberOfItems || 1;
      const mainDate = formData.orderType === 'regular' && !mat.editDeliveryDate
        ? (() => { const today = new Date(); today.setDate(today.getDate() + 7); return today.toISOString().split('T')[0]; })()
        : mat.deliveryDate;
      const mainAmount = mat.amount || '';
      const mainLining = mat.liningClothGiven || false;
      const mainFalls = mat.fallsClothGiven || false;
      const mainSareeServiceType = mat.sareeServiceType || 'Falls Stitching';
      setCustomItems(prev => {
        let arr = (prev[idx] || []).slice(0, count);
        while (arr.length < count) {
          arr.push({
            deliveryDate: mainDate,
            note: '',
            amount: mainAmount,
            liningClothGiven: mainLining,
            fallsClothGiven: mainFalls,
            sareeServiceType: mainSareeServiceType,
            _touched: false,
          });
        }
        arr = arr.map((item, i) => ({
          deliveryDate: item._touched && item.deliveryDate ? item.deliveryDate : mainDate,
          note: item.note || '',
          amount: item._touched && item.amount !== undefined ? item.amount : mainAmount,
          liningClothGiven: typeof item.liningClothGiven === 'boolean' ? item.liningClothGiven : mainLining,
          fallsClothGiven: typeof item.fallsClothGiven === 'boolean' ? item.fallsClothGiven : mainFalls,
          sareeServiceType: item.sareeServiceType || mainSareeServiceType,
          _touched: item._touched || false,
        }));
        return { ...prev, [idx]: arr };
      });
    });
  }, [customizeEachItem, materials, formData.orderType]);

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    setShowCustomerResults(true);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.name);
    setShowCustomerResults(false);
  };

  const handleCustomItemChange = (matIdx: number, idx: number, field: string, value: any) => {
    setCustomItems(items => ({
      ...items,
      [matIdx]: (items[matIdx] || []).map((item, i) =>
        i === idx ? { ...item, [field]: value, _touched: field === 'deliveryDate' || field === 'amount' ? true : item._touched } : item
      )
    }));
  };

  // Helper function to refresh batches for the selected customer
  const refreshBatches = async () => {
    if (!selectedCustomer) return;
    
    setLoadingBatches(true);
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('batch_tag, batch_name')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error refreshing batches:', error);
        notification.show('Failed to refresh batches');
      } else if (data) {
        setBatches(data);
        if (data.length > 0) {
          setSelectedBatch(data[data.length - 1].batch_tag);
        } else {
          setSelectedBatch('none');
        }
        notification.show(`Refreshed ${data.length} batches`);
        console.log('Batches refreshed:', data);
      }
    } catch (err) {
      console.error('Unexpected error refreshing batches:', err);
      notification.show('Failed to refresh batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('OrderModal handleSubmit called');
    
    if (!selectedCustomer) {
      notification.show('Please select a customer first');
      console.log('No customer selected');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const givenDate = new Date();
      
      // Pre-validate all materials without blocking UI
      const updatedMaterials = materials.map(mat => {
        if (!mat.deliveryDate && formData.orderType === 'regular') {
          const today = new Date();
          today.setDate(today.getDate() + 7);
          return { ...mat, deliveryDate: today.toISOString().split('T')[0] };
        }
        return mat;
      });
      
      // Validate all materials
      for (const [idx, mat] of updatedMaterials.entries()) {
        if (!mat.materialType || !mat.numberOfItems || !mat.deliveryDate) {
          notification.show(`Please fill all required fields for Material ${idx + 1}`);
          console.log('Validation failed for material', idx, mat);
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log('All validations passed, submitting orders');
      
      // Optimized batch handling - do this once before order creation
      let batchTagToUse = '';
      console.log('Batch selection:', selectedBatch);
      
      if (selectedBatch === 'new') {
        console.log('Creating new batch for customer:', selectedCustomer.name);
        notification.show('Creating new batch...');
        
        // Simplified batch creation without multiple retries
        const { data: latestBatches } = await supabase
          .from('batches')
          .select('batch_tag, batch_name')
          .eq('customer_id', selectedCustomer.id)
          .order('created_at', { ascending: true });
          
        const customerBatchNumbers = (latestBatches || [])
          .filter(b => b.batch_name.startsWith('Batch '))
          .map(b => parseInt(b.batch_name.replace('Batch ', ''), 10))
          .filter(n => !isNaN(n));
          
        let nextBatchNum = 1;
        while (customerBatchNumbers.includes(nextBatchNum)) {
          nextBatchNum++;
        }
        
        const newTag = `batch_${nextBatchNum}`;
        const newName = `Batch ${nextBatchNum}`;
        
        const { error: insertError } = await supabase.from('batches').insert({
          customer_id: selectedCustomer.id,
          batch_tag: newTag,
          batch_name: newName
        });
        
        if (insertError) {
          throw new Error(`Failed to create batch: ${insertError.message}`);
        }
        
        batchTagToUse = newTag;
        console.log('New batch created:', newTag);
        notification.show(`Created new batch: ${newName}`);
        
        // Update local state without full reload
        setBatches(prev => [...prev, { batch_tag: newTag, batch_name: newName }]);
        setSelectedBatch(newTag);
      } else if (selectedBatch && selectedBatch !== 'none') {
        batchTagToUse = selectedBatch;
        console.log('Using existing batch:', selectedBatch);
      } else {
        console.log('No batch selected, will create new batch automatically');
        // Always create a batch for single items
        try {
          const { data: latestBatches } = await supabase
            .from('batches')
            .select('batch_tag, batch_name')
            .eq('customer_id', selectedCustomer.id)
            .order('created_at', { ascending: true });
            
          const customerBatchNumbers = (latestBatches || [])
            .filter(b => b.batch_name.startsWith('Batch '))
            .map(b => parseInt(b.batch_name.replace('Batch ', ''), 10))
            .filter(n => !isNaN(n));
            
          let nextBatchNum = 1;
          while (customerBatchNumbers.includes(nextBatchNum)) {
            nextBatchNum++;
          }
          
          const newTag = `batch_${nextBatchNum}`;
          const newName = `Batch ${nextBatchNum}`;
          
          const { error: insertError } = await supabase.from('batches').insert({
            customer_id: selectedCustomer.id,
            batch_tag: newTag,
            batch_name: newName
          });
          
          if (insertError) {
            console.error('Failed to auto-create batch:', insertError);
            // Use a fallback batch tag
            batchTagToUse = `batch_${Date.now()}`;
          } else {
            batchTagToUse = newTag;
            console.log('Auto-created batch:', newTag);
            notification.show(`Auto-created batch: ${newName}`);
            
            // Update local state
            setBatches(prev => [...prev, { batch_tag: newTag, batch_name: newName }]);
            setSelectedBatch(newTag);
          }
        } catch (error) {
          console.error('Error creating batch:', error);
          // Use a fallback batch tag
          batchTagToUse = `batch_${Date.now()}`;
        }
      }
      
      // Prepare all orders in memory first
      const allOrders = [];
      
      for (const [matIdx, mat] of updatedMaterials.entries()) {
        // Always create individual orders for each item
        for (let i = 0; i < mat.numberOfItems; i++) {
          let item: any = {};
          
          // If customizing each item, use the custom item data
          if (customizeEachItem[matIdx]) {
            item = customItems[matIdx]?.[i] || {};
          }
          
          allOrders.push({
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            orderType: formData.orderType,
            materialType: mat.materialType as MaterialType,
            hint: item.note || mat.notes,
            description: item.note || mat.notes,
            referenceImage: '',
            notes: item.note || mat.notes,
            deliveryDate: new Date(item.deliveryDate || mat.deliveryDate),
            givenDate,
            approximateAmount: parseFloat(item.amount) || parseFloat(mat.amount) || 0,
            numberOfItems: 1, // Always 1 since we're creating individual orders
            editDeliveryDate: false,
            liningClothGiven: (mat.materialType === 'blouse' || mat.materialType === 'chudi') ? (item.liningClothGiven !== undefined ? item.liningClothGiven : mat.liningClothGiven) : false,
            fallsClothGiven: mat.materialType === 'saree' ? (item.fallsClothGiven !== undefined ? item.fallsClothGiven : mat.fallsClothGiven) : false,
            sareeServiceType: mat.materialType === 'saree' ? (item.sareeServiceType || mat.sareeServiceType) : '',
            batchTag: batchTagToUse || undefined,
            sizeBookNo: formData.sizeBookNo,
            blouseMaterialCategory: mat.materialType === 'blouse' ? (item.serviceType || formData.blouseMaterialCategory) : undefined,
            serviceTypes: item.serviceTypes || mat.serviceTypes || [], // Include serviceTypes
          });
        }
      }
      
      // Submit all orders in a single optimized operation
      console.log(`Submitting ${allOrders.length} orders with batch tag: ${batchTagToUse}`);
      console.log('First order hint:', allOrders[0]?.hint);
      console.log('All orders:', allOrders.map(o => ({ orderId: o.customerId, hint: o.hint, batchTag: o.batchTag })));
      notification.show(`Creating ${allOrders.length} order(s)...`);
      
      await addMultipleOrdersOptimized(allOrders);
      
      // Refresh orders from backend
      await loadData();
      
      notification.show(`Successfully created ${allOrders.length} order(s)!`);
      console.log('Orders submitted successfully');
      onClose();
      
      if (mode === 'add') {
        notification.show('Order added successfully!');
      }
    } catch (error) {
      console.error('Error saving orders:', error);
      notification.show('Failed to save orders. Please try again.');
    }
    setIsSubmitting(false);
  };

  const customerSearchResults = searchCustomers(customerSearchQuery);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            <p className="text-lg font-semibold text-gray-800">Submitting Order...</p>
            <p className="text-sm text-gray-600">Please wait while we process your order</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'add' ? 'Add New Order' : mode === 'edit' ? 'Edit Order' : 'View Order'}
            </h2>
            {selectedCustomer && (
              <div className="flex gap-2 items-center">
                <span
                  className="text-sm text-pink-700 underline cursor-pointer hover:text-pink-900"
                  onClick={() => navigate(`/customers/${selectedCustomer.id}`)}
                >
                  {selectedCustomer.name}
                </span>
                {order?.orderId && (
                  <span
                    className="text-sm text-blue-700 underline cursor-pointer hover:text-blue-900"
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                  >
                    #{order.orderId}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-0 space-y-0" id="order-modal-form">
          {/* Customer/Order Type selection and first material (not scrollable) */}
          <div className="bg-pink-50 rounded-xl p-6 border border-pink-100 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Left: Customer selection (reduced space) */}
              <div>
                {mode === 'add' && !initialCustomer && (
                  <div className="relative mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Customer *
                    </label>
                    <div className="relative">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                        placeholder="Search by customer name, phone number, or ID..."
                      />
                    </div>
                    {showCustomerResults && customerSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {customerSearchResults.map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                          >
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-800">{customer.name}</p>
                              <p className="text-sm text-gray-600">{customer.phone} • {customer.customerId}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Right: Order Type selection and Batch selection (compact) */}
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orderType: 'regular' })}
                      className={`w-full p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center whitespace-normal break-words h-full min-h-[80px] max-w-full ${
                        formData.orderType === 'regular'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <Package className="w-5 h-5 mx-auto mb-1" />
                      <span className="font-medium">Regular</span>
                      <p className="text-xs text-gray-500 mt-1 text-center">7 days</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orderType: 'emergency' })}
                      className={`w-full p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center whitespace-normal break-words h-full min-h-[80px] max-w-full ${
                        formData.orderType === 'emergency'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-200'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                      <span className="font-medium">Emergency</span>
                      <p className="text-xs text-gray-500 mt-1 text-center">Custom</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, orderType: 'alter' })}
                      className={`w-full p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center whitespace-normal break-words h-full min-h-[80px] max-w-full ${
                        formData.orderType === 'alter'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <Scissors className="w-5 h-5 mx-auto mb-1" />
                      <span className="font-medium">Alter</span>
                      <p className="text-xs text-gray-500 mt-1 text-center">Editable</p>
                    </button>
                  </div>
                </div>
                {/* Compact Batch selection */}
                {selectedCustomer && (
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-gray-500 font-normal" htmlFor="batch-select">Batch:</label>
                    <div className="flex items-center gap-1">
                      <select
                        id="batch-select"
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded focus:border-pink-500 focus:ring-0 text-xs"
                        disabled={loadingBatches}
                        style={{ minWidth: 120 }}
                      >
                        {loadingBatches ? (
                          <option value="">Loading...</option>
                        ) : (
                          <>
                            {batches.map(b => (
                              <option key={b.batch_tag} value={b.batch_tag}>{b.batch_name}</option>
                            ))}
                            <option value="new">➕ New Batch</option>
                            <option value="none">❌ No Batch</option>
                          </>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={refreshBatches}
                        disabled={loadingBatches}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 disabled:opacity-50"
                        title="Refresh batches"
                      >
                        🔄
                      </button>
                    </div>
                    {selectedBatch === 'new' && (
                      <span className="text-xs text-blue-600 font-medium">
                        Will create next sequential batch
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* First material entry (not scrollable) */}
            {materials.length > 0 && (
              <div className="rounded-xl border p-6 relative bg-white shadow-sm mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-pink-700 text-lg">Material 1</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEditMaterial(0)} className="text-xs text-blue-600 underline">Edit</button>
                    {materials.length > 1 && (
                      <button type="button" onClick={() => handleRemoveMaterial(0)} className="text-xs text-red-500 underline">Remove</button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Material Type *</label>
                    <select
                      value={materials[0].materialType}
                      onChange={e => handleMaterialChange(0, 'materialType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                      required
                    >
                      <option value="blouse">Blouse</option>
                      <option value="chudi">Chudi</option>
                      <option value="saree">Saree</option>
                      <option value="works">Works</option>
                      <option value="lehenga">Lehenga</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">No. of Items *</label>
                    <div className="text-xs text-blue-600 mb-1">
                      ℹ️ Each item will be created as a separate order
                    </div>
                    {/* Desktop/Tablet: Custom controls */}
                    <div className="hidden md:flex items-center border border-gray-300 rounded-lg focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500">
                      <button
                        type="button"
                        onClick={() => handleMaterialChange(0, 'numberOfItems', Math.max(1, materials[0].numberOfItems - 1))}
                        className="px-4 py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 border-r border-gray-300 rounded-l-lg transition-colors touch-manipulation"
                        disabled={materials[0].numberOfItems <= 1}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="35"
                        value={materials[0].numberOfItems}
                        onChange={e => handleMaterialChange(0, 'numberOfItems', Math.max(1, Math.min(35, parseInt(e.target.value) || 1)))}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            handleMaterialChange(0, 'numberOfItems', Math.min(35, materials[0].numberOfItems + 1));
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            handleMaterialChange(0, 'numberOfItems', Math.max(1, materials[0].numberOfItems - 1));
                          }
                        }}
                        className="flex-1 px-4 py-4 border-0 focus:ring-0 text-center text-lg font-medium"
                        style={{ fontSize: '16px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleMaterialChange(0, 'numberOfItems', Math.min(35, materials[0].numberOfItems + 1))}
                        className="px-4 py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 border-l border-gray-300 rounded-r-lg transition-colors touch-manipulation"
                        disabled={materials[0].numberOfItems >= 35}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    {/* Mobile: Dropdown for better touch experience */}
                    <div className="md:hidden">
                      <select
                        value={materials[0].numberOfItems}
                        onChange={e => handleMaterialChange(0, 'numberOfItems', parseInt(e.target.value))}
                        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 text-center text-lg font-medium"
                        required
                      >
                        {Array.from({ length: 35 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {/* Size Book Number and Blouse Material Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size Book No.</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.sizeBookNo}
                        onChange={e => setFormData({ ...formData, sizeBookNo: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                        placeholder="Page number where size is noted"
                      />

                    </div>
                  </div>
                  {materials[0].materialType === 'blouse' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                      <select
                        value={formData.blouseMaterialCategory}
                        onChange={e => setFormData({ ...formData, blouseMaterialCategory: e.target.value as BlouseMaterialCategory })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                      >
                        <option value="normal">Normal</option>
                        <option value="piping">Piping</option>
                      </select>
                    </div>
                  )}
                  {materials[0].materialType === 'saree' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                      <select
                        value={materials[0].sareeServiceType}
                        onChange={e => handleMaterialChange(0, 'sareeServiceType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                        required
                      >
                        <option value="Falls Stitching">Falls Stitching</option>
                        <option value="Falls Hemming">Falls Hemming</option>
                        <option value="Saree Knot">Saree Knot</option>
                      </select>
                    </div>
                  )}


                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={materials[0].deliveryDate}
                        onChange={e => handleMaterialChange(0, 'deliveryDate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:border-pink-500 focus:ring-0 ${
                          materials[0].deliveryDate === new Date().toISOString().split('T')[0] 
                            ? 'border-pink-500 bg-pink-50' 
                            : 'border-gray-300'
                        }`}
                        required
                        disabled={formData.orderType === 'regular' && !materials[0].editDeliveryDate}
                        min={formData.orderType === 'regular' && materials[0].editDeliveryDate ? (() => {
                          const today = new Date();
                          today.setDate(today.getDate() + 7);
                          return today.toISOString().split('T')[0];
                        })() : undefined}
                      />
                      {materials[0].deliveryDate === new Date().toISOString().split('T')[0] && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full font-medium">
                            Today
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500">
                      <span className="px-3 py-3 text-gray-400 text-lg select-none">₹</span>
                      <input
                        type="number"
                        value={materials[0].amount}
                        onChange={e => handleMaterialChange(0, 'amount', e.target.value)}
                        className="flex-1 px-4 py-3 border-0 focus:ring-0"
                        min="0"
                        placeholder="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleMaterialChange(0, 'amount', (parseFloat(materials[0].amount) || 0) + 100)}
                        className="px-3 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-l border-gray-300 rounded-r-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-6">
                  {(materials[0].materialType === 'blouse' || materials[0].materialType === 'chudi') && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`liningClothGiven-0`}
                        checked={materials[0].liningClothGiven}
                        onChange={e => handleMaterialChange(0, 'liningClothGiven', e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        disabled={customizeEachItem[0]}
                      />
                      <label htmlFor={`liningClothGiven-0`} className="text-sm font-medium text-gray-700">
                        Lining Cloth Given?
                      </label>
                    </div>
                  )}
                  {formData.orderType === 'regular' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`editDeliveryDate-0`}
                        checked={materials[0].editDeliveryDate || false}
                        onChange={e => handleMaterialChange(0, 'editDeliveryDate', e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label htmlFor={`editDeliveryDate-0`} className="text-sm font-medium text-gray-700">Edit Delivery Date</label>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`notes-0`}>Hint</label>
                  <textarea
                    id={`notes-0`}
                    value={materials[0].notes}
                    onChange={e => handleMaterialChange(0, 'notes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 text-base"
                    placeholder="Any hint for this material (optional)"
                    rows={2}
                    tabIndex={0}
                    disabled={customizeEachItem[0]}
                  />
                </div>


                {materials[0].materialType === 'saree' && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`fallsClothGiven-0`}
                        checked={materials[0].fallsClothGiven}
                        onChange={e => handleMaterialChange(0, 'fallsClothGiven', e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        disabled={customizeEachItem[0]}
                      />
                      <label htmlFor={`fallsClothGiven-0`} className="text-sm font-medium text-gray-700">
                        Falls Cloth Given?
                      </label>
                    </div>

                  </div>
                )}
                {/* Customization toggle and table for material 1 */}
                <div className="flex items-center gap-4 mt-4">
                  <input
                    type="checkbox"
                    id={`customizeEachItem-0`}
                    checked={!!customizeEachItem[0]}
                    onChange={e => setCustomizeEachItem(prev => ({ ...prev, 0: e.target.checked }))}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    disabled={materials[0].numberOfItems === 1}
                  />
                  <label htmlFor={`customizeEachItem-0`} className="text-sm font-medium text-gray-700">
                    Customize Each Item (Material 1)
                  </label>
                </div>
                {customizeEachItem[0] && (
                  <div className="mt-6 border rounded-lg p-0 bg-pink-50 shadow w-full">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border border-gray-200">
                        <thead>
                          <tr className="text-left bg-pink-100 border-b border-gray-200">
                            <th className="px-4 py-2 font-semibold">Item #</th>
                            <th className="px-4 py-2 font-semibold">Delivery Date</th>
                            <th className="px-4 py-2 font-semibold">Hint</th>
                            <th className="px-4 py-2 font-semibold">Amount</th>
                            {materials[0].materialType === 'blouse' && (
                              <>
                                <th className="px-4 py-2 font-semibold">Lining Cloth</th>
                                <th className="px-4 py-2 font-semibold">Service Type</th>
                              </>
                            )}
                            {materials[0].materialType === 'chudi' && (
                              <th className="px-4 py-2 font-semibold">Lining Cloth</th>
                            )}
                            {materials[0].materialType === 'saree' && (
                              <>
                                <th className="px-4 py-2 font-semibold">Falls Cloth</th>
                                <th className="px-4 py-2 font-semibold">Saree Service Type</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: materials[0].numberOfItems }).map((_, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-pink-50'}>
                              <td className="px-4 py-2">{idx + 1}</td>
                              <td className="px-4 py-2">
                                <div className="relative">
                                  <input
                                    type="date"
                                    value={customItems[0]?.[idx]?.deliveryDate || ''}
                                    onChange={e => handleCustomItemChange(0, idx, 'deliveryDate', e.target.value)}
                                    className={`border rounded px-2 py-1 w-full ${
                                      customItems[0]?.[idx]?.deliveryDate === new Date().toISOString().split('T')[0]
                                        ? 'border-pink-500 bg-pink-50'
                                        : 'border-gray-300'
                                    }`}
                                    required
                                  />
                                  {customItems[0]?.[idx]?.deliveryDate === new Date().toISOString().split('T')[0] && (
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                      <span className="text-xs bg-pink-500 text-white px-1 py-0.5 rounded-full font-medium">
                                        Today
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={customItems[0]?.[idx]?.note || ''}
                                  onChange={e => handleCustomItemChange(0, idx, 'note', e.target.value)}
                                  className="border rounded px-2 py-1 w-full"
                                  placeholder="Hint"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={customItems[0]?.[idx]?.amount || ''}
                                  onChange={e => handleCustomItemChange(0, idx, 'amount', e.target.value)}
                                  className="border rounded px-2 py-1 w-full"
                                  min="0"
                                  placeholder="₹"
                                />
                              </td>
                              {materials[0].materialType === 'blouse' && (
                                <>
                                  <td className="px-4 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={customItems[0]?.[idx]?.liningClothGiven || false}
                                      onChange={e => handleCustomItemChange(0, idx, 'liningClothGiven', e.target.checked)}
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={customItems[0]?.[idx]?.serviceType || 'normal'}
                                      onChange={e => handleCustomItemChange(0, idx, 'serviceType', e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                    >
                                      <option value="normal">Normal</option>
                                      <option value="piping">Piping</option>
                                    </select>
                                  </td>
                                </>
                              )}
                              {materials[0].materialType === 'chudi' && (
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={customItems[0]?.[idx]?.liningClothGiven || false}
                                    onChange={e => handleCustomItemChange(0, idx, 'liningClothGiven', e.target.checked)}
                                  />
                                </td>
                              )}
                              {materials[0].materialType === 'saree' && (
                                <>
                                  <td className="px-4 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={customItems[0]?.[idx]?.fallsClothGiven || false}
                                      onChange={e => handleCustomItemChange(0, idx, 'fallsClothGiven', e.target.checked)}
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={customItems[0]?.[idx]?.sareeServiceType || 'Falls Stitching'}
                                      onChange={e => handleCustomItemChange(0, idx, 'sareeServiceType', e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                    >
                                      <option value="Falls Stitching">Falls Stitching</option>
                                      <option value="Falls Hemming">Falls Hemming</option>
                                      <option value="Saree Knot">Saree Knot</option>
                                    </select>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* END customization for material 1 */}
              </div>
            )}
          </div>
          {/* Only extra materials are scrollable */}
          {materials.length > 1 && (
            <div className="bg-pink-50 rounded-xl p-6 border border-pink-100 mb-4">
              <div className="space-y-8">
                {materials.slice(1).map((mat, idx) => (
                  <div key={idx + 1} className="rounded-xl border p-6 relative bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-pink-700 text-lg">Material {idx + 2}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleRemoveMaterial(idx + 1)} className="text-xs text-red-500 underline">Remove</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Material Type *</label>
                        <select
                          value={mat.materialType}
                          onChange={e => handleMaterialChange(idx + 1, 'materialType', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                          required
                        >
                          <option value="blouse">Blouse</option>
                          <option value="chudi">Chudi</option>
                          <option value="saree">Saree</option>
                          <option value="works">Works</option>
                          <option value="lehenga">Lehenga</option>
                          <option value="others">Others</option>
                        </select>
                      </div>
                                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">No. of Items *</label>
                      <div className="text-xs text-blue-600 mb-1">
                        ℹ️ Each item will be created as a separate order
                      </div>
                      {/* Desktop/Tablet: Custom controls */}
                        <div className="hidden md:flex items-center border border-gray-300 rounded-lg focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500">
                          <button
                            type="button"
                            onClick={() => handleMaterialChange(idx + 1, 'numberOfItems', Math.max(1, mat.numberOfItems - 1))}
                            className="px-4 py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 border-r border-gray-300 rounded-l-lg transition-colors touch-manipulation"
                            disabled={mat.numberOfItems <= 1}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="35"
                            value={mat.numberOfItems}
                            onChange={e => handleMaterialChange(idx + 1, 'numberOfItems', Math.max(1, Math.min(35, parseInt(e.target.value) || 1)))}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                handleMaterialChange(idx + 1, 'numberOfItems', Math.min(35, mat.numberOfItems + 1));
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                handleMaterialChange(idx + 1, 'numberOfItems', Math.max(1, mat.numberOfItems - 1));
                              }
                            }}
                            className="flex-1 px-4 py-4 border-0 focus:ring-0 text-center text-lg font-medium"
                            style={{ fontSize: '16px' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleMaterialChange(idx + 1, 'numberOfItems', Math.min(35, mat.numberOfItems + 1))}
                            className="px-4 py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 border-l border-gray-300 rounded-r-lg transition-colors touch-manipulation"
                            disabled={mat.numberOfItems >= 35}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        {/* Mobile: Dropdown for better touch experience */}
                        <div className="md:hidden">
                          <select
                            value={mat.numberOfItems}
                            onChange={e => handleMaterialChange(idx + 1, 'numberOfItems', parseInt(e.target.value))}
                            className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 text-center text-lg font-medium"
                            required
                          >
                            {Array.from({ length: 35 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    {/* Size Book Number and Blouse Material Category for additional materials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Size Book No.</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.sizeBookNo}
                            onChange={e => setFormData({ ...formData, sizeBookNo: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                            placeholder="Page number where size is noted"
                          />

                        </div>
                      </div>
                      {mat.materialType === 'blouse' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                          <select
                            value={formData.blouseMaterialCategory}
                            onChange={e => setFormData({ ...formData, blouseMaterialCategory: e.target.value as BlouseMaterialCategory })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                          >
                            <option value="normal">Normal</option>
                            <option value="piping">Piping</option>
                          </select>
                        </div>
                      )}



                    </div>
                    {/* Service Type Multi-Select */}
                    {materialServiceTypes[mat.materialType as MaterialType]?.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                        <div className="space-y-2">
                          {(materialServiceTypes[mat.materialType as MaterialType] || []).map((option: string) => (
                            <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={((mat.serviceTypes as string[]) || []).includes(option)}
                                onChange={e => {
                                  const currentTypes = (mat.serviceTypes as string[]) || [];
                                  const newTypes = e.target.checked
                                    ? [...currentTypes, option]
                                    : currentTypes.filter(type => type !== option);
                                  handleMaterialChange(idx, 'serviceTypes', newTypes);
                                }}
                                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Selected: {(mat.serviceTypes || []).length > 0 ? (mat.serviceTypes || []).join(', ') : 'None'}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={mat.deliveryDate}
                            onChange={e => handleMaterialChange(idx + 1, 'deliveryDate', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:border-pink-500 focus:ring-0 ${
                              mat.deliveryDate === new Date().toISOString().split('T')[0] 
                                ? 'border-pink-500 bg-pink-50' 
                                : 'border-gray-300'
                            }`}
                            required
                            disabled={formData.orderType === 'regular' && !mat.editDeliveryDate}
                          />
                          {mat.deliveryDate === new Date().toISOString().split('T')[0] && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full font-medium">
                                Today
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500">
                          <span className="px-3 py-3 text-gray-400 text-lg select-none">₹</span>
                          <input
                            type="number"
                            value={mat.amount}
                            onChange={e => handleMaterialChange(idx + 1, 'amount', e.target.value)}
                            className="flex-1 px-4 py-3 border-0 focus:ring-0"
                            min="0"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleMaterialChange(idx + 1, 'amount', (parseFloat(mat.amount) || 0) + 100)}
                            className="px-3 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 border-l border-gray-300 rounded-r-lg transition-colors touch-manipulation"
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 mt-6">
                      {(mat.materialType === 'blouse' || mat.materialType === 'chudi') && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`liningClothGiven-${idx + 1}`}
                            checked={mat.liningClothGiven}
                            onChange={e => handleMaterialChange(idx + 1, 'liningClothGiven', e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <label htmlFor={`liningClothGiven-${idx + 1}`} className="text-sm font-medium text-gray-700">
                            Lining Cloth Given?
                          </label>
                        </div>
                      )}
                      {formData.orderType === 'regular' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`editDeliveryDate-${idx + 1}`}
                            checked={mat.editDeliveryDate || false}
                            onChange={e => handleMaterialChange(idx + 1, 'editDeliveryDate', e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <label htmlFor={`editDeliveryDate-${idx + 1}`} className="text-sm font-medium text-gray-700">Edit Delivery Date</label>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`notes-${idx + 1}`}>Hint</label>
                      <textarea
                        id={`notes-${idx + 1}`}
                        value={mat.notes}
                        onChange={e => handleMaterialChange(idx + 1, 'notes', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0 text-base"
                        placeholder="Any hint for this material (optional)"
                        rows={2}
                        tabIndex={0}
                        disabled={customizeEachItem[idx + 1]}
                      />
                    </div>


                    {mat.materialType === 'saree' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`fallsClothGiven-${idx + 1}`}
                            checked={mat.fallsClothGiven}
                            onChange={e => handleMaterialChange(idx + 1, 'fallsClothGiven', e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            disabled={customizeEachItem[idx + 1]}
                          />
                          <label htmlFor={`fallsClothGiven-${idx + 1}`} className="text-sm font-medium text-gray-700">
                            Falls Cloth Given?
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                          <select
                            value={mat.sareeServiceType}
                            onChange={e => handleMaterialChange(idx + 1, 'sareeServiceType', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                            required
                            disabled={customizeEachItem[idx + 1]}
                          >
                            <option value="Falls Stitching">Falls Stitching</option>
                            <option value="Falls Hemming">Falls Hemming</option>
                            <option value="Saree Knot">Saree Knot</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {/* Customization toggle and table for material 2+ */}
                    <div className="flex items-center gap-4 mt-4">
                      <input
                        type="checkbox"
                        id={`customizeEachItem-${idx + 1}`}
                        checked={!!customizeEachItem[idx + 1]}
                        onChange={e => setCustomizeEachItem(prev => ({ ...prev, [idx + 1]: e.target.checked }))}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        disabled={mat.numberOfItems === 1}
                      />
                      <label htmlFor={`customizeEachItem-${idx + 1}`} className="text-sm font-medium text-gray-700">
                        Customize Each Item (Material {idx + 2})
                      </label>
                    </div>
                    {customizeEachItem[idx + 1] && (
                      <div className="mt-6 border rounded-lg p-0 bg-pink-50 shadow w-full">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm border border-gray-200">
                            <thead>
                              <tr className="text-left bg-pink-100 border-b border-gray-200">
                                <th className="px-4 py-2 font-semibold">Item #</th>
                                <th className="px-4 py-2 font-semibold">Delivery Date</th>
                                <th className="px-4 py-2 font-semibold">Hint</th>
                                <th className="px-4 py-2 font-semibold">Amount</th>
                                {mat.materialType === 'blouse' && (
                                  <>
                                    <th className="px-4 py-2 font-semibold">Lining Cloth</th>
                                    <th className="px-4 py-2 font-semibold">Service Type</th>
                                  </>
                                )}
                                {mat.materialType === 'chudi' && (
                                  <th className="px-4 py-2 font-semibold">Lining Cloth</th>
                                )}
                                {mat.materialType === 'saree' && (
                                  <>
                                    <th className="px-4 py-2 font-semibold">Falls Cloth</th>
                                    <th className="px-4 py-2 font-semibold">Saree Service Type</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: mat.numberOfItems }).map((_, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-pink-50'}>
                                  <td className="px-4 py-2">{i + 1}</td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="date"
                                      value={customItems[idx + 1]?.[i]?.deliveryDate || ''}
                                      onChange={e => handleCustomItemChange(idx + 1, i, 'deliveryDate', e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                      required
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={customItems[idx + 1]?.[i]?.note || ''}
                                      onChange={e => handleCustomItemChange(idx + 1, i, 'note', e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                      placeholder="Hint"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="number"
                                      value={customItems[idx + 1]?.[i]?.amount || ''}
                                      onChange={e => handleCustomItemChange(idx + 1, i, 'amount', e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                      min="0"
                                      placeholder="₹"
                                    />
                                  </td>
                                  {mat.materialType === 'blouse' && (
                                    <>
                                      <td className="px-4 py-2 text-center">
                                        <input
                                          type="checkbox"
                                          checked={customItems[idx + 1]?.[i]?.liningClothGiven || false}
                                          onChange={e => handleCustomItemChange(idx + 1, i, 'liningClothGiven', e.target.checked)}
                                        />
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="space-y-1">
                                          {(materialServiceTypes[mat.materialType as MaterialType] || []).map((option: string) => (
                                            <label key={option} className="flex items-center gap-2 text-xs">
                                              <input
                                                type="checkbox"
                                                checked={((customItems[idx + 1]?.[i]?.serviceTypes as string[]) || []).includes(option)}
                                                onChange={e => {
                                                  const currentTypes = (customItems[idx + 1]?.[i]?.serviceTypes as string[]) || [];
                                                  const newTypes = e.target.checked
                                                    ? [...currentTypes, option]
                                                    : currentTypes.filter(type => type !== option);
                                                  handleCustomItemChange(idx + 1, i, 'serviceTypes', newTypes);
                                                }}
                                                className="w-3 h-3 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                              />
                                              <span className="text-xs">{option}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </td>
                                    </>
                                  )}
                                  {mat.materialType === 'chudi' && (
                                    <td className="px-4 py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={customItems[idx + 1]?.[i]?.liningClothGiven || false}
                                        onChange={e => handleCustomItemChange(idx + 1, i, 'liningClothGiven', e.target.checked)}
                                      />
                                    </td>
                                  )}
                                  {mat.materialType === 'saree' && (
                                    <>
                                      <td className="px-4 py-2 text-center">
                                        <input
                                          type="checkbox"
                                          checked={customItems[idx + 1]?.[i]?.fallsClothGiven || false}
                                          onChange={e => handleCustomItemChange(idx + 1, i, 'fallsClothGiven', e.target.checked)}
                                        />
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="space-y-1">
                                          {(materialServiceTypes[mat.materialType as MaterialType] || []).map((option: string) => (
                                            <label key={option} className="flex items-center gap-2 text-xs">
                                              <input
                                                type="checkbox"
                                                checked={((customItems[idx + 1]?.[i]?.serviceTypes as string[]) || []).includes(option)}
                                                onChange={e => {
                                                  const currentTypes = (customItems[idx + 1]?.[i]?.serviceTypes as string[]) || [];
                                                  const newTypes = e.target.checked
                                                    ? [...currentTypes, option]
                                                    : currentTypes.filter(type => type !== option);
                                                  handleCustomItemChange(idx + 1, i, 'serviceTypes', newTypes);
                                                }}
                                                className="w-3 h-3 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                              />
                                              <span className="text-xs">{option}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {/* END customization for material 2+ */}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Submit button */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleAddMaterial}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-md font-medium hover:from-pink-600 hover:to-rose-600 transition-all shadow text-sm"
            >
              Add Material
            </button>
            <button
              type="submit"
              className={`px-8 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSubmitting 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-pink-600 text-white hover:bg-pink-700 focus:ring-pink-500'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting Order...
                </div>
              ) : (
                'Submit Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;