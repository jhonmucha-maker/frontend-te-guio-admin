import { forwardRef } from 'react';

const Switch = forwardRef(({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={`
          w-11 h-6 rounded-full transition-colors duration-200
          bg-gray-300
          peer-checked:bg-primary
          peer-focus:ring-2 peer-focus:ring-primary/20
          peer-disabled:opacity-50
        `} />
        <div className={`
          absolute top-0.5 left-0.5
          w-5 h-5 rounded-full bg-surface shadow transition-transform duration-200
          peer-checked:translate-x-5
        `} />
      </div>
      {label && (
        <span className="text-sm text-gray-700">{label}</span>
      )}
    </label>
  );
});

Switch.displayName = 'Switch';

export default Switch;
