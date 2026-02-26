import React from 'react';

const Card = ({
    children,
    title,
    subtitle,
    footer,
    className = '',
    noPadding = false,
    headerActions
}) => {
    return (
        <div className={`bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-100 dark:border-dark-border overflow-hidden transition-shadow duration-200 ${className}`}>
            {(title || subtitle || headerActions) && (
                <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                    {headerActions && <div>{headerActions}</div>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
