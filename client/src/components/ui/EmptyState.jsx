import React from 'react';
import Button from './Button';

const EmptyState = ({ title, description, icon, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
        {icon ? React.cloneElement(icon, { className: "w-8 h-8" }) : null}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      {description && <p className="text-slate-400 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
