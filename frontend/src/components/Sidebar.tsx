import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Briefcase,
  ClipboardList,
  Package,
  PackageCheck,
  Settings as SettingsIcon,
  Users,
  FileBarChart,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  PackagePlus,
  CheckCircle,
  Truck,
  History,
  FolderKanban,
  DollarSign
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  userRole?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ userRole = 'admin', isCollapsed: externalIsCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['MAIN', 'SALES', 'PRODUCTION', 'DISPATCH', 'ADMIN']);
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isRestoringScrollRef = useRef<boolean>(false);
  
  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(!internalIsCollapsed);
    }
  };

  // Save scroll position continuously
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleScroll = () => {
      scrollPositionRef.current = nav.scrollTop;
      // Also save to sessionStorage as backup
      sessionStorage.setItem('sidebarScrollPosition', nav.scrollTop.toString());
    };

    nav.addEventListener('scroll', handleScroll);
    return () => nav.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after navigation (only if significantly different)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || isRestoringScrollRef.current) return;

    // Only restore if we have a saved position and it's significantly different from current
    const savedPosition = scrollPositionRef.current || 
      parseInt(sessionStorage.getItem('sidebarScrollPosition') || '0', 10);

    // Only restore if position is significantly different (more than 50px) to avoid unnecessary updates
    if (savedPosition > 0 && Math.abs(nav.scrollTop - savedPosition) > 50) {
      isRestoringScrollRef.current = true;
      
      // Use requestAnimationFrame for smooth restoration
      requestAnimationFrame(() => {
        if (navRef.current && isRestoringScrollRef.current) {
          navRef.current.scrollTop = savedPosition;
          // Reset flag after a short delay
          setTimeout(() => {
            isRestoringScrollRef.current = false;
          }, 50);
        }
      });
    } else {
      // If positions are close, just reset the flag
      isRestoringScrollRef.current = false;
    }
  }, [location.pathname]);

  // Memoize menu sections to prevent recreation on every render
  const menuSections: MenuSection[] = useMemo(() => [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> }
      ]
    },
    {
      title: 'SALES',
      items: [
        { name: 'Price', path: '/price', icon: <DollarSign size={20} /> },
        { name: 'Quotation', path: '/quotation', icon: <FileText size={20} /> },
        { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} /> }
      ]
    },
    {
      title: 'PRODUCTION',
      items: [
        { name: 'Work Orders', path: '/work-orders', icon: <Briefcase size={20} /> },
        { name: 'Inhouse Job Cards', path: '/inhouse-jobs', icon: <ClipboardList size={20} /> },
        { name: 'Outside Job Work', path: '/outside-jobs', icon: <PackagePlus size={20} /> },
        { name: 'Inward', path: '/inward', icon: <Package size={20} /> },
        { name: 'Internal Process', path: '/internal-process', icon: <FolderKanban size={20} /> },
        { name: 'Inspection', path: '/inspection', icon: <CheckCircle size={20} /> },
        { name: 'Completed Jobs', path: '/completed-jobs', icon: <PackageCheck size={20} /> }
      ]
    },
    {
      title: 'DISPATCH',
      items: [
        { name: 'Ready For Dispatch', path: '/ready-dispatch', icon: <Truck size={20} /> },
        { name: 'Dispatch History', path: '/dispatch-history', icon: <History size={20} /> }
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { name: 'Master', path: '/masters', icon: <SettingsIcon size={20} />, roles: ['admin'] },
        { name: 'Reports', path: '/reports', icon: <FileBarChart size={20} />, roles: ['admin'] },
        { name: 'Users', path: '/users', icon: <Users size={20} />, roles: ['admin'] },
        { name: 'Setting', path: '/settings', icon: <SettingsIcon size={20} />, roles: ['admin'] }
      ]
    }
  ], []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      // Prevent unnecessary state updates
      const isExpanded = prev.includes(section);
      if (isExpanded) {
        return prev.filter(s => s !== section);
      } else {
        return [...prev, section];
      }
    });
  }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className={`text-green-500 font-bold text-xl ${isCollapsed ? 'hidden' : 'block'}`}>
          WMS
        </h1>
        <button
          onClick={handleToggleCollapse}
          className="hidden lg:block text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
        </button>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav ref={navRef} className={`flex-1 py-4 ${isCollapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {menuSections.map((section) => {
          // Filter items based on user role (case-insensitive check)
          const visibleItems = section.items.filter(item => 
            !item.roles || item.roles.some(role => role.toLowerCase() === userRole?.toLowerCase())
          );

          // Always show ADMIN section, even if no items are visible
          // For other sections, hide if no visible items
          if (visibleItems.length === 0 && section.title !== 'ADMIN') {
            return null;
          }

          return (
            <div key={section.title} className="mb-4">
              <button
                onClick={() => {
                  // Only toggle section expansion if sidebar is not collapsed
                  // When collapsed, don't expand sections to prevent sidebar from appearing to expand
                  if (!isCollapsed) {
                    toggleSection(section.title);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <span className={isCollapsed ? 'hidden' : 'block'}>{section.title}</span>
                {!isCollapsed && (
                  expandedSections.includes(section.title) ?
                    <ChevronDown size={14} /> :
                    <ChevronRight size={14} />
                )}
              </button>

              {expandedSections.includes(section.title) && (
                <div className="mt-1">
                  {visibleItems.length > 0 ? (
                    visibleItems.map((item) => {
                      const isActive = location.pathname === item.path;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            // Save scroll position before navigation
                            if (navRef.current) {
                              scrollPositionRef.current = navRef.current.scrollTop;
                              sessionStorage.setItem('sidebarScrollPosition', navRef.current.scrollTop.toString());
                            }
                            // Close mobile menu if open (only affects mobile)
                            setIsMobileOpen(false);
                            // Sidebar collapsed state is managed separately and persists
                            // Clicking links does NOT change the collapsed state
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-all ${
                            isActive
                              ? 'bg-green-500 text-white border-l-4 border-green-400'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
                          } ${isCollapsed ? 'justify-center' : ''}`}
                          title={isCollapsed ? item.name : ''}
                        >
                          {item.icon}
                          <span className={isCollapsed ? 'hidden' : 'block text-sm'}>
                            {item.name}
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-4 py-2 text-xs text-gray-500 italic">
                      No access
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
      >
        <Menu size={24} />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
