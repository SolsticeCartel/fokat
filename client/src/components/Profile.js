import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Profile() {
  const { userProfile, setUserProfile } = useUser();
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      return setError('Name cannot be empty');
    }

    try {
      setError('');
      setLoading(true);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        fullName: fullName.trim()
      });

      setUserProfile({ ...userProfile, fullName: fullName.trim() });
      setEditing(false);
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFullName(userProfile.fullName);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">{userProfile.username}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{userProfile.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{userProfile.email}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
} 