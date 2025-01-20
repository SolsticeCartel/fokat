import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { MessageCircle, Home, Trash2 } from 'lucide-react';

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [isOwner, setIsOwner] = useState(false);
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const { userProfile } = useUser();
  const navigate = useNavigate();

  // Separate effect for fetching user profiles
  useEffect(() => {
    const fetchUserProfile = async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setUserProfiles(prev => ({
            ...prev,
            [uid]: userDoc.data()
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    // Fetch profiles for all messages
    messages.forEach(message => {
      if (!userProfiles[message.uid]) {
        fetchUserProfile(message.uid);
      }
    });
  }, [messages]);

  useEffect(() => {
    if (!groupId) return;

    // Fetch group name and check ownership
    const fetchGroupDetails = async () => {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          setGroupName(groupData.name);
          setIsOwner(groupData.createdBy === currentUser.uid);
        } else {
          setError('This group has been deleted by the owner');
          setTimeout(() => {
            navigate('/chat');
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        setError('Failed to load group');
      }
    };

    // Subscribe to group document for deletion
    const unsubscribeGroup = onSnapshot(doc(db, 'groups', groupId), (doc) => {
      if (!doc.exists()) {
        setError('This group has been deleted by the owner');
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
        return;
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        setError('This group has been deleted by the owner');
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      }
    });

    fetchGroupDetails();

    // Subscribe to messages
    const q = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
    }, (error) => {
      if (error.code === 'permission-denied') {
        setError('This group has been deleted by the owner');
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      }
    });

    return () => {
      unsubscribeGroup();
      unsubscribeMessages();
    };
  }, [groupId, currentUser.uid, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        // Include user profile data in the message
        userName: userProfile.fullName,
        userUsername: userProfile.username
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      
      // Delete the group document
      const groupRef = doc(db, 'groups', groupId);
      await deleteDoc(groupRef);
      
      // Navigate immediately
      navigate('/chat');
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error.code === 'permission-denied') {
        setError('You do not have permission to delete this group.');
      } else {
        setError('Failed to delete group. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">{groupName}</h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwner && (
              <button
                onClick={handleDeleteGroup}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-full transition-colors"
                title="Delete Group"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-accent rounded-full transition-colors"
              title="Back to Groups"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide relative">
        {messages.map((message) => {
          const isCurrentUser = message.uid === currentUser.uid;
          const messageUser = userProfiles[message.uid] || {
            fullName: message.userName || 'Unknown User',
            username: message.userUsername
          };
          
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {messageUser.fullName?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Message Content */}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  }`}
                >
                  {!isCurrentUser && (
                    <div className="text-sm font-medium mb-1">
                      {messageUser.fullName}
                    </div>
                  )}
                  <div className="text-sm">{message.text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-red-500 mb-4 text-center">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 