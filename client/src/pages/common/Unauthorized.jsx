import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { FiLock, FiChevronLeft } from 'react-icons/fi';

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4">
            <div className="max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full">
                        <FiLock className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Unauthorized</h1>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Access Denied</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                <div className="flex flex-col space-y-3">
                    <Link to="/">
                        <Button className="w-full">
                            Go to Dashboard
                        </Button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center text-primary-600 hover:text-primary-700 font-medium"
                    >
                        <FiChevronLeft className="mr-1" /> Go back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
