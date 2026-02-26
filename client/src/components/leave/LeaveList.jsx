import React from 'react';
import { formatDate, getStatusColor, calculateDays } from '../../utils/helpers';
import Button from '../common/Button';

const LeaveList = ({ leaves, loading, onAction, isAdmin = false }) => {
    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!leaves || leaves.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 italic">
                No leave records found.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-bg/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                    {leaves.map((leave) => (
                        <tr key={leave._id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                    {leave.leaveType}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                    {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {calculateDays(leave.fromDate, leave.toDate)} days
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs">
                                    {leave.reason}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                                    {leave.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAction(leave, 'view')}
                                >
                                    View
                                </Button>
                                {leave.status === 'pending' && !isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-900 ml-2"
                                        onClick={() => onAction(leave, 'cancel')}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeaveList;
