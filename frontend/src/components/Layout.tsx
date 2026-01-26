import { ReactNode, useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  // Load collapsed state from sessionStorage, default to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = sessionStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  // Memoize user data to prevent unnecessary re-renders
  const { userRole, userName, roleDisplayName } = useMemo(() => {
    const role = sessionStorage.getItem('userRole') || 'Staff';
    const name = sessionStorage.getItem('userName') || 'Admin User';
    const roleLower = role?.toLowerCase();
    const displayName = roleLower === 'admin' ? 'Administrator' : 'Staff';
    
    return {
      userRole: role,
      userName: name,
      roleDisplayName: displayName
    };
  }, []); // Empty deps - only read once on mount

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        userRole={userRole} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          const newState = !isSidebarCollapsed;
          setIsSidebarCollapsed(newState);
          // Persist collapsed state to sessionStorage
          sessionStorage.setItem('sidebarCollapsed', String(newState));
        }}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header userName={userName} userRole={roleDisplayName} onLogout={onLogout} />

        <main className="flex-1 overflow-auto p-3 md:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
