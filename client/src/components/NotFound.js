import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl">Page Not Found</p>
        <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link 
          to="/chat" 
          className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Chat
        </Link>
      </div>
    </div>
  );
} 