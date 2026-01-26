import { useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function Header({ userName = 'Admin User', userRole = 'Administrator', onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Get user initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Safe logout handler
  const handleLogout = () => {
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    }
  };

  return (
    <header className="bg-gray-950 text-white shadow-lg relative">
      <div className="flex items-center justify-between px-3 md:px-4 lg:px-6 py-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-semibold truncate">Work Management System</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-shrink-0">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 md:p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <Bell size={20} className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 bg-gray-800 rounded-lg">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm flex-shrink-0">
              {getInitials(userName)}
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userRole}</p>
            </div>
          </div>

          {onLogout && typeof onLogout === 'function' && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-gray-300 hover:bg-red-600 hover:text-white transition-all rounded-lg border border-gray-700 hover:border-red-600"
              title="Logout"
            >
              <LogOut size={18} className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden lg:block text-sm font-medium">Logout</span>
            </button>
          )}
        </div>
      </div>

      <NotificationDropdown 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </header>
  );
}
