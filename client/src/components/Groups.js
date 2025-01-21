import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchGroups() {
      if (!currentUser) return;

      try {
        setError('');
        
        // Get all groups
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, where('members', 'array-contains', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const userGroups = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGroups(userGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        if (error.code === 'permission-denied') {
          setError('Unable to access chats. Please try logging in again.');
        } else {
          setError('Failed to load chats. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Your Chats</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/create-chat')}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm sm:text-base"
            >
              Create Chat
            </button>
            <button
              onClick={() => navigate('/join-chat')}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm sm:text-base"
            >
              Join Chat
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <p className="text-sm sm:text-base">You haven't joined any chats yet.</p>
            <p className="text-sm sm:text-base">Create a new chat or join an existing one to start chatting!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/chat/${group.id}`)}
                className="p-3 sm:p-4 bg-card border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">{group.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Code: {group.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 