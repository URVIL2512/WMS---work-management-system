import { useState, useEffect, useRef } from 'react';
import { Bell, X, FileText, ShoppingCart, Briefcase, Package, Trash2, Edit, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../api/axios';

interface Activity {
  id: string;
  action: string;
  module: string;
  details: any;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activities');
      if (response.data.success) {
        setActivities(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (module: string, action: string) => {
    const iconClass = "w-5 h-5";
    
    if (action === 'Delete') {
      return <Trash2 className={`${iconClass} text-red-600`} />;
    }
    if (action === 'Update' || action === 'Status Change') {
      return <Edit className={`${iconClass} text-blue-600`} />;
    }
    if (action === 'Create') {
      return <Plus className={`${iconClass} text-green-600`} />;
    }

    switch (module.toLowerCase()) {
      case 'quotation':
        return <FileText className={`${iconClass} text-blue-600`} />;
      case 'order':
        return <ShoppingCart className={`${iconClass} text-green-600`} />;
      case 'workorder':
      case 'work order':
        return <Briefcase className={`${iconClass} text-orange-600`} />;
      case 'inspection':
        return <CheckCircle className={`${iconClass} text-purple-600`} />;
      default:
        return <Package className={`${iconClass} text-gray-600`} />;
    }
  };

  const getActivityMessage = (activity: Activity): string => {
    const { action, module, details } = activity;
    const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
    
    if (details?.name || details?.itemName || details?.customerName) {
      const itemName = details.name || details.itemName || details.customerName || 'item';
      return `${action} ${moduleName}: ${itemName}`;
    }
    
    if (details?.quotationNumber) {
      return `${action} Quotation: ${details.quotationNumber}`;
    }
    
    if (details?.orderId) {
      return `${action} Order: ${details.orderId}`;
    }
    
    return `${action} ${moduleName}`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div 
        ref={dropdownRef}
        className="fixed right-2 md:right-4 top-16 md:top-20 w-[calc(100vw-1rem)] sm:w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] overflow-hidden flex flex-col z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchActivities}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No activities yet</p>
              <p className="text-xs text-gray-400 mt-1">Your recent actions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.module, activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getActivityMessage(activity)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">Showing last 5 activities</p>
          </div>
        )}
      </div>
    </>
  );
}
