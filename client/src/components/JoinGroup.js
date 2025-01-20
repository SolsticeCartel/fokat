import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function JoinGroup() {
  const [groupCode, setGroupCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      // Query for the group with matching code
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('code', '==', groupCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid group code');
      }

      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();

      // Verify password
      if (groupData.password !== password) {
        throw new Error('Incorrect password');
      }

      // Check if user is already a member
      if (groupData.members.includes(currentUser.uid)) {
        throw new Error('You are already a member of this group');
      }

      // Add user to group members
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: [...groupData.members, currentUser.uid]
      });

      // Navigate to chat room
      navigate(`/chat/${groupDoc.id}`);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center">Join Group</h2>
        </div>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="group-code" className="block text-sm font-medium">
              Group Code
            </label>
            <input
              id="group-code"
              type="text"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              required
              pattern="[0-9]{5}"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Enter 5-digit group code"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Group Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Enter group password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90"
          >
            Join Group
          </button>
        </form>
      </div>
    </div>
  );
} 