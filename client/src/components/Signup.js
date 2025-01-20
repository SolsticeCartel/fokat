import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ProfileSetup from './ProfileSetup';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const { signup, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !showProfileSetup) {
      navigate('/chat');
    }
  }, [currentUser, navigate, showProfileSetup]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      setShowProfileSetup(true);
    } catch (error) {
      setError(error.message || 'Failed to create an account');
    }
    setLoading(false);
  }

  const handleProfileComplete = () => {
    setShowProfileSetup(false);
    navigate('/chat');
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
          <div>
            <h2 className="text-3xl font-bold text-center">Sign Up</h2>
          </div>
          {error && <div className="text-red-500 text-center">{error}</div>}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90"
            >
              Sign Up
            </button>
          </form>
          <div className="text-center">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Log In</Link>
          </div>
        </div>
      </div>

      {showProfileSetup && (
        <ProfileSetup onComplete={handleProfileComplete} />
      )}
    </>
  );
} 