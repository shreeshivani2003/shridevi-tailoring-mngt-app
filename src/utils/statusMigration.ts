import { supabase } from '../lib/supabase';
import { materialStages, MaterialType } from '../types';

// Migration function to update existing orders with old status names
export const migrateOrderStatuses = async () => {
  try {
    console.log('Starting status migration...');
    
    // Get all orders from the database
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*');
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('No orders found to migrate');
      return;
    }
    
    console.log(`Found ${orders.length} orders to check for migration`);
    
    let migratedCount = 0;
    
    for (const order of orders) {
      const materialType = order.material_type as MaterialType;
      const stages = materialStages[materialType];
      
      if (!stages) {
        console.warn(`Unknown material type: ${materialType} for order ${order.order_id}`);
        continue;
      }
      
      let needsUpdate = false;
      let newStatus = order.current_status;
      
      // Handle old "Checking" status
      if (order.current_status === 'Checking') {
        // Check status history to determine if this is first or second checking
        const statusHistory = order.status_history || [];
        const hasCompletedStages = statusHistory.some((status: any) => 
          ['Cutting', 'Stitching', 'Hemming', 'Work'].includes(status.stage)
        );
        
        if (hasCompletedStages) {
          // This is likely the second checking (Final Checking)
          newStatus = 'Final Checking';
        } else {
          // This is likely the first checking (Initial Checking)
          newStatus = 'Initial Checking';
        }
        
        needsUpdate = true;
      }
      
      // Handle other old status names
      const statusMappings: Record<string, string> = {
        'Order Received': 'Initial Checking',
        'In Progress': 'In Process',
        'Final Check': 'Final Checking',
        'Final Inspection': 'Final Checking'
      };
      
      if (statusMappings[order.current_status]) {
        newStatus = statusMappings[order.current_status];
        needsUpdate = true;
      }
      
      // Update the order if needed
      if (needsUpdate) {
        console.log(`Migrating order ${order.order_id}: ${order.current_status} -> ${newStatus}`);
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({ current_status: newStatus })
          .eq('id', order.id);
        
        if (updateError) {
          console.error(`Error updating order ${order.order_id}:`, updateError);
        } else {
          migratedCount++;
        }
      }
    }
    
    console.log(`Migration completed. ${migratedCount} orders migrated.`);
    
  } catch (error) {
    console.error('Error during status migration:', error);
  }
};

// Function to check if migration is needed
export const checkMigrationNeeded = async (): Promise<boolean> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('current_status')
      .limit(10);
    
    if (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
    
    if (!orders || orders.length === 0) {
      return false;
    }
    
    // Check if any orders have old status names
    const oldStatuses = ['Checking', 'Order Received', 'In Progress', 'Final Check', 'Final Inspection'];
    return orders.some(order => oldStatuses.includes(order.current_status));
    
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}; 