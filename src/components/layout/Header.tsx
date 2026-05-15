import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from 'next-themes';
import { Menu, Sun, Moon, Search, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  isOpen: boolean;
}

export function Header({ toggleSidebar, isOpen }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  //  dropdown state
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  //  close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //  logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 transition-colors">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>

        {/* <div
          className="hidden md:flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-1.5 w-80 group focus-within:border-red-500/50 focus-within:ring-4 focus-within:ring-red-500/5 transition-all shadow-sm"
        >
          <Search className="w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Search members, relations..."
            className="bg-transparent border-none focus:outline-none text-sm ml-3 flex-1 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <div className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5 shadow-xs">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">⌘</span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">K</span>
          </div>
        </div> */}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/*  Language Toggle */}
        {/* <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${language === 'en'
              ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-500'
              }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${language === 'ta'
              ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-500'
              }`}
          >
            TA
          </button>
        </div> */}

        {/* 🌙 Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/*  USER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>

          {/* Trigger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 group pl-2 border-l border-gray-200 dark:border-gray-800"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                role: {role}
              </p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-150">

              {/* User Info */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 lowercase mb-1">
                  {user?.email}
                </p>
                
              </div>

              {/* Actions */}
              <button
                onClick={() => { navigate('/profile'); setOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all flex items-center gap-2"
              >
                Profile 
              </button>



              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}