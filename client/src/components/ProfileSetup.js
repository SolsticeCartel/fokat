import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';

export default function ProfileSetup({ onComplete }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { setUserProfile } = useUser();

  const handleUsernameChange = (e) => {
    // Convert to lowercase and replace spaces with underscores
    const formatted = e.target.value.toLowerCase().replace(/\s+/g, '_');
    setUsername(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim() || !username.trim()) {
      return setError('All fields are required');
    }

    // Username validation
    if (!/^[a-z0-9_]+$/.test(username)) {
      return setError('Username can only contain lowercase letters, numbers, and underscores');
    }

    try {
      setError('');
      setLoading(true);

      // Check if username is already taken
      const usernameRef = doc(db, 'usernames', username);
      const usernameDoc = await getDoc(usernameRef);
      
      if (usernameDoc.exists()) {
        throw new Error('Username is already taken');
      }

      const userData = {
        fullName,
        username,
        email: currentUser.email,
        createdAt: new Date().toISOString()
      };

      // Create user profile first
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, userData);

      // Then reserve the username
      await setDoc(usernameRef, {
        uid: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      setUserProfile(userData);
      onComplete();
    } catch (error) {
      console.error('Profile setup error:', error);
      setError(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <div className="w-[90vw] max-w-md rounded-lg bg-card p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h2>
          
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Choose a username"
                pattern="^[a-z0-9_]+$"
                required
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 