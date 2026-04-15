import { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

const Tabs = ({ value, onChange, children, className = '' }) => {
  const [internalValue, setInternalValue] = useState(value || 0);

  const currentValue = onChange ? value : internalValue;
  const handleChange = onChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '', fullWidth = false }) => {
  return (
    <div
      className={`
        flex border-b border-gray-200 overflow-x-auto scrollbar-thin
        ${fullWidth ? '' : 'gap-1'}
        ${className}
      `}
      role="tablist"
    >
      {children}
    </div>
  );
};

const Tab = ({ value, children, className = '', disabled = false }) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && context?.onChange(value)}
      className={`
        px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
        border-b-2 -mb-px
        ${isActive
          ? 'text-primary border-primary'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

const TabPanel = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  );
};

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
