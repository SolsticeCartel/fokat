import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { ThemeToggle } from './ThemeToggle';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const { userProfile } = useUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {userProfile?.username?.[0]?.toUpperCase() || '?'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-lg shadow-lg border border-border">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium">{userProfile?.fullName}</p>
            <p className="text-sm text-muted-foreground">@{userProfile?.username}</p>
          </div>
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-accent text-sm flex items-center"
          >
            <User size={16} className="mr-2" />
            Profile Settings
          </button>
          <button
            onClick={toggleTheme}
            className="w-full px-4 py-2 text-left hover:bg-accent text-sm flex items-center"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} className="mr-2" />
                Light Mode
              </>
            ) : (
              <>
                <Moon size={16} className="mr-2" />
                Dark Mode
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left hover:bg-accent text-sm text-red-500"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 