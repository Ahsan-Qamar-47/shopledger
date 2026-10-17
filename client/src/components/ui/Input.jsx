import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  id,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`field ${className}`}>
      {label && <span>{label}</span>}
      <input
        id={id}
        ref={ref}
        className={`input ${error ? '!border-[var(--danger)]' : ''}`}
        {...props}
      />
      {error && <p className="err">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
