import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, MessageSquare, Dumbbell, UserCircle, Activity } from 'lucide-react';

const NavigationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu when user navigates or presses escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const menuItems = [
    { path: '/', label: 'Home', icon: Home, description: 'Return to homepage' },
    { path: '/chat', label: 'Max Chat', icon: MessageSquare, description: 'Chat with your AI fitness coach' },
    { path: '/workout', label: 'Start Training', icon: Dumbbell, description: 'Create and track workouts', isNew: true },
    { path: '/profile', label: 'Athlete Profile', icon: UserCircle, description: 'Manage your personal profile' },
    { path: '/progress', label: 'Track Progress', icon: Activity, description: 'View your fitness analytics and progress' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-4 right-4 z-50" aria-label="Main Navigation">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-[#BEE3F8] text-[#4A90E2] hover:bg-[#E8F4FF]"
        whileTap={{ scale: 0.95 }}
        aria-expanded={isOpen}
        aria-controls="navigation-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-20"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu */}
            <motion.div
              id="navigation-menu"
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-14 right-0 bg-white rounded-lg shadow-xl border border-[#BEE3F8] overflow-hidden min-w-[200px]"
            >
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#E8F4FF] transition-colors ${
                      index !== menuItems.length - 1 ? 'border-b border-[#BEE3F8]' : ''
                    } ${isActive ? 'bg-[#E8F4FF] text-[#4A90E2]' : 'text-gray-700'}`}
                    whileHover={{ x: 4 }}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`${item.label} - ${item.description}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#4A90E2]' : 'text-gray-500'}`} aria-hidden="true" />
                    <span className="font-medium">{item.label}</span>
                    {item.isNew && (
                      <span 
                        className="ml-auto text-xs px-2 py-1 bg-[#4A90E2] text-white rounded-full"
                        aria-label="New feature"
                      >
                        New
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavigationMenu;