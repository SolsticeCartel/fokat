import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileMenu from './ProfileMenu';

export default function Navigation() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Hide navigation on chat room pages
  if (location.pathname.includes('/chat/')) {
    return null;
  }

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/chat" className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-700 dark:from-gray-200 dark:via-gray-100 dark:to-gray-300 text-transparent bg-clip-text hover:opacity-80 transition-all">
              FOKAT
            </Link>
          </div>

          {currentUser && (
            <div className="flex items-center space-x-4">
              <ProfileMenu />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 