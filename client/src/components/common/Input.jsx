import React from 'react';

const Input = ({
    label,
    type = 'text',
    error,
    className = '',
    icon: Icon,
    required = false,
    ...props
}) => {
    const id = props.id || props.name;

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    className={`
            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-dark-border focus:ring-primary-500 focus:border-transparent dark:bg-dark-bg dark:text-white'
                        }
            bg-white dark:bg-dark-bg text-gray-900
            disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
          `}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default Input;
