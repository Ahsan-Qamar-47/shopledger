import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink)] p-6">
      <div className="text-center space-y-6 max-w-md card">
        <h1 className="text-8xl font-extrabold text-[var(--brand)] opacity-20 font-display">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight font-display">
            Page not found
          </h2>
          <p className="text-[var(--muted)] text-sm">
            Sorry, we couldn't find the page you're looking for. It might have been removed or the link might be broken.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link to="/dashboard">
            <Button className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
