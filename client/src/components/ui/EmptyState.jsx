import React from 'react';
import Button from './Button';
import { BookOpen } from 'lucide-react';

const EmptyState = ({ title, description, icon: Icon, actionLabel, onAction }) => {
  const IconComponent = Icon || BookOpen;

  return (
    <div className="card empty">
      <div className="em-ico">
        <IconComponent className="w-6 h-6 text-[var(--ok)]" />
      </div>
      <b>{title}</b>
      {description && <div className="text-[var(--muted)] text-sm mt-1">{description}</div>}
      {actionLabel && onAction && (
        <div className="mt-4 flex justify-center">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
