import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  id,
  options = [],
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div className={`field ${className}`}>
      {label && <span>{label}</span>}
      <select
        id={id}
        ref={ref}
        className={`select ${error ? '!border-[var(--danger)]' : ''}`}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <option value="" disabled>Select an option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && <p className="err">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
