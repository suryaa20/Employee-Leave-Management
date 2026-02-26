import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { FiHome, FiAlertCircle } from 'react-icons/fi';

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
            <div className="max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                        <FiAlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white mb-2">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Page Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/">
                    <Button icon={FiHome} className="w-full">
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
