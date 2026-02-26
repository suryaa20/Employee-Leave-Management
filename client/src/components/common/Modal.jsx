import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full m-4'
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div
                className="fixed inset-0"
                onClick={onClose}
            ></div>
            <div className={`relative w-full ${sizes[size]} bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden animate-in fade-in zoom-in duration-200`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    {showClose && (
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                        >
                            <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="px-6 py-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
