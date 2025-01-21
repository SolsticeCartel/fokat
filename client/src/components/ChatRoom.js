import React, { useState, useEffect, useRef } from 'react';
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
  writeBatch,
  updateDoc,
  arrayRemove
} from 'firebase/firestore';
import { MessageCircle, Home, Trash2, LogOut, Info } from 'lucide-react';

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [isOwner, setIsOwner] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const { userProfile } = useUser();
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle scroll for both initial load and new messages
  useEffect(() => {
    if (messages.length > 0) {
      // Use instant scroll for first load, smooth scroll for new messages
      messagesEndRef.current?.scrollIntoView({ 
        behavior: isFirstLoad ? "instant" : "smooth" 
      });
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    }
  }, [messages, isFirstLoad]);

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
          setGroupInfo(groupData);
        } else {
          setError('This chat has been deleted by the admin');
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
        setError('This chat has been deleted by the admin');
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
        return;
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        setError('This chat has been deleted by the admin');
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
        setError('This chat has been deleted by the admin');
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      }
    });

    return () => {
      unsubscribeGroup();
      unsubscribeMessages();
      setIsFirstLoad(true); // Reset first load flag when component unmounts
    };
  }, [groupId, currentUser.uid, navigate]);

  // Add this new effect for fetching member profiles when modal is opened
  useEffect(() => {
    const fetchMemberProfiles = async () => {
      if (showInfo && groupInfo?.members) {
        for (const memberId of groupInfo.members) {
          if (!userProfiles[memberId]) {
            try {
              const userDoc = await getDoc(doc(db, 'users', memberId));
              if (userDoc.exists()) {
                setUserProfiles(prev => ({
                  ...prev,
                  [memberId]: userDoc.data()
                }));
              }
            } catch (error) {
              console.error('Error fetching member profile:', error);
            }
          }
        }
      }
    };

    fetchMemberProfiles();
  }, [showInfo, groupInfo]);

  // Add effect to track member changes
  useEffect(() => {
    if (!groupId) return;

    const unsubscribeGroupMembers = onSnapshot(doc(db, 'groups', groupId), async (snapshot) => {
      if (!snapshot.exists()) return;

      const newData = snapshot.data();
      const oldMembers = groupInfo?.members || [];
      const newMembers = newData.members || [];

      // Only proceed if we have previous members data
      if (groupInfo && oldMembers.length !== newMembers.length) {
        // Find joined members (present in new but not in old)
        const joinedMembers = newMembers.filter(id => !oldMembers.includes(id));

        // For each joined member, add a system message
        for (const memberId of joinedMembers) {
          try {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              await addDoc(collection(db, 'groups', groupId, 'messages'), {
                text: `${userData.fullName} joined the group`,
                createdAt: serverTimestamp(),
                type: 'system',
                event: 'join'
              });
            }
          } catch (error) {
            console.error('Error adding join message:', error);
          }
        }
      }

      setGroupInfo(newData);
    });

    return () => unsubscribeGroupMembers();
  }, [groupId]);

  const handleSubmit = async (e) => {
    e?.preventDefault(); // Make preventDefault optional since we might call this directly
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        userName: userProfile.fullName,
        userUsername: userProfile.username
      });
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      
      // First delete all messages in the group
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Commit the batch delete of messages
      await batch.commit();
      
      // Delete the group document
      const groupRef = doc(db, 'groups', groupId);
      await deleteDoc(groupRef);
      
      // Navigate immediately
      navigate('/chat');
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error.code === 'permission-denied') {
        setError('You do not have permission to delete this chat.');
      } else {
        setError('Failed to delete chat. Please try again.');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this chat?')) {
      return;
    }

    try {
      setError('');
      
      // Add leave message before removing the user
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: `${userProfile.fullName} left the chat`,
        createdAt: serverTimestamp(),
        type: 'system',
        event: 'leave'
      });
      
      // Remove user from group members
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(currentUser.uid)
      });
      
      // Navigate back to groups list
      navigate('/chat');
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Failed to leave chat. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6" />
            <div className="flex items-center space-x-2">
              <h2 
                className="text-2xl font-bold hover:opacity-80 cursor-pointer" 
                onClick={() => setShowInfo(true)}
              >
                {groupName}
              </h2>
              <button
                onClick={() => setShowInfo(true)}
                className="p-1.5 hover:bg-accent rounded-full transition-colors"
                title="Group Info"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwner ? (
              <button
                onClick={handleDeleteGroup}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-full transition-colors"
                title="Delete Group"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-full transition-colors"
                title="Leave Group"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-accent rounded-full transition-colors"
              title="Back to Chats"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Group Info Modal */}
      {showInfo && groupInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Chat Information</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 hover:bg-accent rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Chat Name</p>
                <p className="font-medium">{groupInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chat Code</p>
                <p className="font-medium select-all">{groupInfo.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chat Password</p>
                <p className="font-medium select-all">{groupInfo.password}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members ({groupInfo.members?.length || 0})</p>
                <div className="mt-2 space-y-2">
                  {groupInfo.members?.map(memberId => {
                    const member = userProfiles[memberId];
                    return (
                      <div key={memberId} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {member?.fullName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{member?.fullName || 'Loading...'}</p>
                        </div>
                        {memberId === groupInfo.createdBy && (
                          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative flex flex-col justify-end">
        <div className="space-y-4">
          {messages.map((message) => {
            // Handle system messages
            if (message.type === 'system') {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-accent/50 text-accent-foreground px-4 py-1 rounded-full text-sm">
                    {message.text}
                  </div>
                </div>
              );
            }

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
                    <div className="text-sm break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                      {message.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-red-500 mb-4 text-center">{error}</div>
          )}
          <div className="flex space-x-4">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isMobile ? "Type a message..." : "Type a message... (Press Enter to send)"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              rows="1"
              style={{ resize: 'none' }}
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
                inputRef.current?.focus();
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 