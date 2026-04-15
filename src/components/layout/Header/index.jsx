import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Sun, Moon } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { Avatar, getInitials, stringToColor } from '../../ui';
import { useTheme } from '../../../hooks/useTheme';

const Header = ({ onMenuClick, showMenuButton }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-neutral-200">
      <div className="flex items-center justify-between h-11 px-3 sm:h-14 sm:px-4 lg:h-16 lg:px-6">
        {/* Menu button for mobile */}
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-1.5 -ml-1.5 sm:p-2 sm:-ml-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
        </button>

        {/* User info */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-neutral-900">
                {user?.name || 'Administrador'}
              </div>
              <div className="text-xs text-neutral-500">
                {user?.email || ''}
              </div>
            </div>
            <Avatar
              name={user?.name || 'Admin'}
              size="sm"
            />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-card shadow-dropdown border border-neutral-200 py-1 z-50">
              {/* User info in dropdown (mobile) */}
              <div className="px-4 py-2 border-b border-neutral-100 sm:hidden">
                <div className="text-sm font-semibold text-neutral-900">
                  {user?.name || 'Administrador'}
                </div>
                <div className="text-xs text-neutral-500">
                  {user?.email || ''}
                </div>
              </div>

              {/* Menu items */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/config');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <User size={18} className="text-neutral-400" />
                Mi Perfil
              </button>

              <div className="border-t border-neutral-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-50 transition-colors"
              >
                <LogOut size={18} />
                Cerrar Sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
