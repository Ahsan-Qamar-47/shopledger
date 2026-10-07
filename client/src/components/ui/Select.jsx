import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  id,
  options = [],
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-slate-700 focus:border-transparent focus:ring-indigo-500'
        }`}
        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        {...props}
      >
        <option value="" disabled className="text-slate-500">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
