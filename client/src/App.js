import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Signup from './components/Signup';
import Groups from './components/Groups';
import ChatRoom from './components/ChatRoom';
import CreateGroup from './components/CreateGroup';
import JoinGroup from './components/JoinGroup';
import NotFound from './components/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import RequireProfile from './components/RequireProfile';
import Profile from './components/Profile';

// Wrapper component to handle root route redirect
function RootRedirect() {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/chat" replace /> : <Login />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="chat-theme">
      <Router>
        <AuthProvider>
          <UserProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Navigation />
              <Routes>
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/chat"
                  element={
                    <PrivateRoute>
                      <RequireProfile>
                        <Groups />
                      </RequireProfile>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/chat/:groupId"
                  element={
                    <PrivateRoute>
                      <RequireProfile>
                        <ChatRoom />
                      </RequireProfile>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/create-chat"
                  element={
                    <PrivateRoute>
                      <CreateGroup />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/join-chat"
                  element={
                    <PrivateRoute>
                      <JoinGroup />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<RootRedirect />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </UserProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 