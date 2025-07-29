import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Calendar, DollarSign, FileText, Camera, Search, User, AlertTriangle, Package, Scissors } from 'lucide-react';
import { Customer, MaterialType, OrderType } from '../types';
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
  const { addMultipleOrders, updateOrder, searchCustomers, orders, loadData } = useData();
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
  });

  const [materials, setMaterials] = useState([initialMaterial()]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);



  const handleMaterialChange = (idx: number, field: string, value: any) => {
    setMaterials(mats => mats.map((mat, i) => i === idx ? { ...mat, [field]: value } : mat));
  };
  const handleAddMaterial = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const defaultDate = today.toISOString().split('T')[0];
    setMaterials(mats => [
      ...mats,
      { ...initialMaterial(), deliveryDate: formData.orderType === 'regular' ? defaultDate : '' }
    ]);
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
    // Ensure all materials have a delivery date before validation
    setMaterials(mats => mats.map(mat => {
      if (!mat.deliveryDate && formData.orderType === 'regular') {
        const today = new Date();
        today.setDate(today.getDate() + 7);
        return { ...mat, deliveryDate: today.toISOString().split('T')[0] };
      }
      return mat;
    }));
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 0));
    if (!selectedCustomer) {
      notification.show('Please select a customer first');
      console.log('No customer selected');
      return;
    }
    setIsSubmitting(true);
    try {
      const givenDate = new Date();
      // Validate all materials
      for (const [idx, mat] of materials.entries()) {
        if (!mat.materialType || !mat.numberOfItems || !mat.deliveryDate) {
          notification.show(`Please fill all required fields for Material ${idx + 1}`);
          console.log('Validation failed for material', idx, mat);
          setIsSubmitting(false);
          return;
        }
      }
      console.log('All validations passed, submitting orders');
      let batchTagToUse = '';
      // Helper to robustly create a new batch with the next available number
      const createNextAvailableBatch = async () => {
        let attempt = 0;
        let maxAttempts = 10;
        let newTag = '';
        let newName = '';
        
        while (attempt < maxAttempts) {
          // Always fetch fresh batch data from the backend
          const { data: latestBatches, error: fetchError } = await supabase
            .from('batches')
            .select('batch_tag, batch_name')
            .eq('customer_id', selectedCustomer.id)
            .order('created_at', { ascending: true });
            
          if (fetchError) {
            console.error('Error fetching batches:', fetchError);
            throw new Error('Failed to fetch existing batches');
          }
          
          // Calculate next batch number from fresh data
          const customerBatchNumbers = (latestBatches || [])
            .filter(b => b.batch_name.startsWith('Batch '))
            .map(b => parseInt(b.batch_name.replace('Batch ', ''), 10))
            .filter(n => !isNaN(n));
            
          let nextBatchNum = 1;
          while (customerBatchNumbers.includes(nextBatchNum)) {
            nextBatchNum++;
          }
          
          newTag = `batch_${nextBatchNum}`;
          newName = `Batch ${nextBatchNum}`;
          
          // Insert the new batch
          const { error: insertError } = await supabase.from('batches').insert({
            customer_id: selectedCustomer.id,
            batch_tag: newTag,
            batch_name: newName
          });
          
          if (!insertError) {
            // Successfully created batch - refetch the complete batch list
            const { data: updatedBatches, error: refetchError } = await supabase
              .from('batches')
              .select('batch_tag, batch_name')
              .eq('customer_id', selectedCustomer.id)
              .order('created_at', { ascending: true });
              
            if (!refetchError && updatedBatches) {
              // Update UI state with fresh batch list
              setBatches(updatedBatches);
              // Set the newly created batch as selected
              setSelectedBatch(newTag);
              console.log(`Successfully created and selected new batch: ${newName} (${newTag})`);
              return { batch_tag: newTag, batch_name: newName };
            } else {
              console.error('Error refetching batches after creation:', refetchError);
              // Fallback: update local state manually
              setBatches(prev => [...prev, { batch_tag: newTag, batch_name: newName }]);
              setSelectedBatch(newTag);
              return { batch_tag: newTag, batch_name: newName };
            }
          } else if (insertError.code === '23505') { // Unique constraint violation
            console.log(`Batch ${newName} already exists, retrying...`);
            attempt++;
            continue;
          } else {
            console.error('Error creating batch:', insertError);
            throw new Error(`Failed to create batch: ${insertError.message}`);
          }
        }
        
        throw new Error('Failed to create a unique batch after multiple attempts.');
      };
      // Only create a new batch if user selected 'New Batch'
      if (selectedBatch === 'new') {
        console.log('Creating new batch for customer:', selectedCustomer.name);
        notification.show('Creating new batch...');
        const { batch_tag: newTag } = await createNextAvailableBatch();
        batchTagToUse = newTag;
        console.log('New batch created and selected:', newTag);
        notification.show(`Created new batch: ${newTag.replace('batch_', 'Batch ')}`);
        await loadData(); // Refresh global state after batch creation
      } else if (selectedBatch && selectedBatch !== 'none') {
        batchTagToUse = selectedBatch;
        console.log('Using existing batch:', selectedBatch);
      } else {
        batchTagToUse = '';
        console.log('No batch selected for this order');
      }
      // Prepare and submit each material as an order
      for (const [matIdx, mat] of materials.entries()) {
        if (customizeEachItem[matIdx]) {
          for (let i = 0; i < mat.numberOfItems; i++) {
            const item = customItems[matIdx]?.[i] || {};
            const orderData = {
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
              approximateAmount: parseFloat(item.amount) || 0,
              numberOfItems: 1,
              editDeliveryDate: false,
              liningClothGiven: (mat.materialType === 'blouse' || mat.materialType === 'chudi') ? item.liningClothGiven : false,
              fallsClothGiven: mat.materialType === 'saree' ? item.fallsClothGiven : false,
              sareeServiceType: mat.materialType === 'saree' ? item.sareeServiceType : '',
              batchTag: batchTagToUse || undefined,
            };
            console.log('Order payload being sent:', orderData);
            await addMultipleOrders(orderData);
            await loadData(); // Refresh global state after adding order
          }
        } else {
          // Normal: one order for all items
          const orderData = {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            orderType: formData.orderType,
            materialType: mat.materialType as MaterialType,
            hint: mat.notes,
            description: mat.notes,
            referenceImage: '',
            notes: mat.notes,
            deliveryDate: new Date(mat.deliveryDate),
            givenDate,
            approximateAmount: parseFloat(mat.amount) || 0,
            numberOfItems: mat.numberOfItems,
            editDeliveryDate: false,
            liningClothGiven: mat.liningClothGiven,
            fallsClothGiven: mat.fallsClothGiven,
            sareeServiceType: mat.sareeServiceType,
            batchTag: batchTagToUse || undefined,
          };
          console.log('Order payload being sent:', orderData);
          await addMultipleOrders(orderData);
          await loadData(); // Refresh global state after adding order
        }
      }
      notification.show(`Successfully created order(s)!`);
      console.log('Order(s) submitted successfully');
      onClose();
      if (mode === 'add') {
        notification.show('Order added successfully!');
        // WhatsApp integration
        if (selectedCustomer?.whatsappEnabled && selectedCustomer?.whatsappNumber) {
          // Find the latest order for this customer
          const latestOrder = orders.filter((o: any) => o.customerId === selectedCustomer.id)[0];
          const totalOrders = orders.filter((o: any) => o.customerId === selectedCustomer.id).length + materials.length;
          const orderId = latestOrder ? latestOrder.orderId : 'N/A';
          const msg = `Hello ${selectedCustomer.name},%0AOrder placed successfully!%0AOrder ID: *${orderId}*%0ATotal Orders: *${totalOrders}*`;
          const url = `https://wa.me/${selectedCustomer.whatsappNumber}?text=${msg}`;
          window.open(url, '_blank');
        }
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
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="35"
                        value={materials[0].numberOfItems}
                        onChange={e => handleMaterialChange(0, 'numberOfItems', Math.max(1, Math.min(35, parseInt(e.target.value) || 1)))}
                        className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                        required
                      />
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleMaterialChange(0, 'numberOfItems', Math.min(35, materials[0].numberOfItems + 1))}
                          disabled={materials[0].numberOfItems >= 35}
                          className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMaterialChange(0, 'numberOfItems', Math.max(1, materials[0].numberOfItems - 1))}
                          disabled={materials[0].numberOfItems <= 1}
                          className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
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
                    <div className="relative">
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3 text-gray-400 text-lg pointer-events-none select-none">₹</span>
                      <input
                        type="number"
                        value={materials[0].amount}
                        onChange={e => handleMaterialChange(0, 'amount', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                        min="0"
                        placeholder="₹"
                      />
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saree Service Type</label>
                      <select
                        value={materials[0].sareeServiceType}
                        onChange={e => handleMaterialChange(0, 'sareeServiceType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                        required
                        disabled={customizeEachItem[0]}
                      >
                        <option value="Falls Stitching">Falls Stitching</option>
                        <option value="Falls Hemming">Falls Hemming</option>
                        <option value="Saree Knot">Saree Knot</option>
                      </select>
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
                            {(materials[0].materialType === 'blouse' || materials[0].materialType === 'chudi') && (
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
                              {(materials[0].materialType === 'blouse' || materials[0].materialType === 'chudi') && (
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
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="35"
                            value={mat.numberOfItems}
                            onChange={e => handleMaterialChange(idx + 1, 'numberOfItems', Math.max(1, Math.min(35, parseInt(e.target.value) || 1)))}
                            className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                            required
                          />
                          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMaterialChange(idx + 1, 'numberOfItems', Math.min(35, mat.numberOfItems + 1))}
                              disabled={mat.numberOfItems >= 35}
                              className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMaterialChange(idx + 1, 'numberOfItems', Math.max(1, mat.numberOfItems - 1))}
                              disabled={mat.numberOfItems <= 1}
                              className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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
                        <div className="relative">
                          <span className="absolute left-0 inset-y-0 flex items-center pl-3 text-gray-400 text-lg pointer-events-none select-none">₹</span>
                          <input
                            type="number"
                            value={mat.amount}
                            onChange={e => handleMaterialChange(idx + 1, 'amount', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-0"
                            min="0"
                            placeholder="₹"
                          />
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">Saree Service Type</label>
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
                                {(mat.materialType === 'blouse' || mat.materialType === 'chudi') && (
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
                                  {(mat.materialType === 'blouse' || mat.materialType === 'chudi') && (
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
                                        <select
                                          value={customItems[idx + 1]?.[i]?.sareeServiceType || 'Falls Stitching'}
                                          onChange={e => handleCustomItemChange(idx + 1, i, 'sareeServiceType', e.target.value)}
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
              className="px-8 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;