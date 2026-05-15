import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  ScrollText,
  BarChart3,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users2,
  CalendarDays,
  MessageSquare,
  Layout,
} from 'lucide-react';
import logo from '../../images/logo.png';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { role, logout } = useAuth();
  const { t } = useLanguage();

  // Update browser tab title
  useEffect(() => {
    document.title = "KODI Admin Panel";
  }, []);

  const adminNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/staff', icon: UserCog, label: t('nav.staffManagement') },
    { path: '/users', icon: Users, label: t('nav.userManagement') },
    { path: '/family', icon: Users2, label: t('nav.familyManagement') },
    { path: '/event-management', icon: CalendarDays, label: t('EventManagement') },
    { path: '/chat-management', icon: MessageSquare, label: t('ChatManagement') },
    { path: '/post-management', icon: Layout, label: t('PostManagement') },
    { path: '/permissions', icon: Shield, label: t('nav.permissions') },
    // { path: '/logs', icon: ScrollText, label: t('nav.activityLogs') },
    // { path: '/analytics', icon: BarChart3, label: t('nav.analytics') },
    { path: '/logs', icon: ScrollText, label: t('nav.activityLogs') },

    { path: '/profile', icon: User, label: t('nav.profile') },
    // { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const staffNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/users', icon: Users, label: t('nav.userManagement') },
    { path: '/family', icon: Users2, label: t('nav.familyManagement') },
    { path: '/event-management', icon: CalendarDays, label: t('EventManagement') },
    { path: '/chat-management', icon: MessageSquare, label: t('ChatManagement') },
    { path: '/post-management', icon: Layout, label: t('PostManagement') },
    // { path: '/logs', icon: ScrollText, label: t('nav.activityLogs') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const navItems = role === 'admin' ? adminNavItems : staffNavItems;

  // Close sidebar on mobile when clicking a nav item
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  // Update browser tab title and add favicon
  useEffect(() => {
    document.title = "KODI Admin Panel";
    
    // Update or create favicon
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = '/favicon.ico'; // You can update this path to your actual favicon
      document.head.appendChild(favicon);
    } else {
      favicon.href = '/favicon.ico'; // You can update this path to your actual favicon
    }
  }, []);

  return (
    <div
      className={`${isOpen ? 'w-64' : 'w-20'
        } bg-linear-to-b from-red-700 to-red-900 text-red-100 flex flex-col transition-all duration-500 ease-in-out fixed left-0 top-0 h-full z-50 border-r border-white/10 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] overflow-y-auto overflow-x-hidden ${!isOpen ? 'max-lg:-translate-x-full' : ''
        }`}
    >
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
        <div className={`flex items-center gap-3 ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100 lg:scale-0'} transition-all duration-300`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-1.5 bg-white rounded-xl border-2 border-white/20 backdrop-blur-md shadow-2xl relative">
              <img src={logo} alt="KODI Logo" className="w-8 h-8 object-contain" />
            </div>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl text-white tracking-tighter leading-none">KODI</span>
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest leading-none mt-1">Genealogy</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-white/10 text-red-200 hover:text-white transition-all transform active:scale-90 border border-transparent hover:border-white/20"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-3 space-y-1.5 scrollbar-hide relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all group relative ${isActive
                ? 'bg-white/20 text-white shadow-xl border border-white/20 font-bold'
                : 'text-red-100 hover:bg-white/10 hover:text-white border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-white rounded-r-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                )}
                <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-hover:text-white'}`} />
                {isOpen && <span className={`text-sm tracking-tight transition-all duration-300 ${isActive ? 'font-black' : 'font-semibold'}`}>{item.label}</span>}
                {!isOpen && (
                  <div className="absolute left-full ml-6 px-3 py-2 bg-red-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all transform -translate-x-2.5 group-hover:translate-x-0 whitespace-nowrap z-50 border border-white/20 shadow-2xl">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10 bg-red-900/60 backdrop-blur-md relative z-10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3.5 w-full rounded-xl text-red-100 hover:bg-white/10 hover:text-white transition-all group border border-transparent hover:border-white/20"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
          {isOpen && <span className="text-sm font-black tracking-tight uppercase text-[10px]">{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
}