import React from 'react';
import { useUser } from '../contexts/UserContext';
import ProfileSetup from './ProfileSetup';

export default function RequireProfile({ children }) {
  const { userProfile, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return <ProfileSetup onComplete={() => window.location.reload()} />;
  }

  return children;
} 