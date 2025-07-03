import React, { useState, useEffect } from 'react';
import { checkMigrationNeeded, migrateOrderStatuses } from '../utils/statusMigration';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const MigrationStatus: React.FC = () => {
  const [migrationNeeded, setMigrationNeeded] = useState<boolean | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const needed = await checkMigrationNeeded();
      setMigrationNeeded(needed);
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      await migrateOrderStatuses();
      setMigrationComplete(true);
      setMigrationNeeded(false);
    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (migrationNeeded === null) {
    return null; // Don't show anything while checking
  }

  if (migrationNeeded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Status Update Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Some orders need to be updated to use the new status names. This will fix the "two checking" issue.
              </p>
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="mt-3 bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (migrationComplete) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Status Update Complete
              </h3>
              <p className="text-sm text-green-700 mt-1">
                All orders have been updated with the new status names. The "two checking" issue is now fixed!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MigrationStatus; 