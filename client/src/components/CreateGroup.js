import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const generateGroupCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      
      const code = generateGroupCode();
      
      // Create a new group document
      const groupData = {
        name: groupName,
        password: password,
        code: code,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: [currentUser.uid]
      };
      
      const groupRef = await addDoc(collection(db, 'groups'), groupData);
      
      // Navigate directly to the new group's chat
      navigate(`/chat/${groupRef.id}`);
    } catch (error) {
      console.error('Detailed error:', error);
      setError('Failed to create chat: ' + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center">Create Chat</h2>
        </div>
        {error && <div className="text-red-500 text-center">{error}</div>}
        {success && (
          <div className="text-green-500 text-center p-4 bg-green-50 rounded-md">
            <p>{success}</p>
            <p className="text-2xl font-bold mt-2">{groupCode}</p>
            <p className="text-sm mt-2">Share this code with people you want to join the chat</p>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium">
              Chat Name
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Enter chat name"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Chat Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Enter chat password"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Password must be at least 6 characters
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90"
          >
            Create Chat
          </button>
        </form>
      </div>
    </div>
  );
} 