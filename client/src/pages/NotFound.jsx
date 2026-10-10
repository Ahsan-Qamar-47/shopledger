import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-extrabold text-indigo-600/20">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Page not found</h2>
          <p className="text-slate-400">
            Sorry, we couldn't find the page you're looking for. It might have been removed or the link might be broken.
          </p>
        </div>
        <div className="pt-4 flex justify-center">
          <Link to="/">
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
