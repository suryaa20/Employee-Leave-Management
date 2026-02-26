import React from 'react';
import { formatDate, getStatusColor, calculateDays } from '../../utils/helpers';
import Button from '../common/Button';

const LeaveDetails = ({ leave, onAction, isAdmin = false }) => {
    if (!leave) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Type</h4>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white capitalize">{leave.leaveType} Leave</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</h4>
                    <span className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status}
                    </span>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</h4>
                    <p className="mt-1 text-gray-900 dark:text-white">
                        {formatDate(leave.fromDate)} to {formatDate(leave.toDate)}
                        <span className="ml-2 text-sm text-gray-500">({calculateDays(leave.fromDate, leave.toDate)} days)</span>
                    </p>
                </div>
                {isAdmin && leave.employee && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</h4>
                        <p className="mt-1 text-gray-900 dark:text-white">{leave.employee.name} ({leave.employee.id})</p>
                    </div>
                )}
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</h4>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{leave.reason}</p>
                </div>
            </div>

            {leave.adminNote && (
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manager/Admin Note</h4>
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <p className="text-blue-800 dark:text-blue-300 whitespace-pre-wrap">{leave.adminNote}</p>
                    </div>
                </div>
            )}

            {isAdmin && leave.status === 'pending' && (
                <div className="flex space-x-4 pt-4">
                    <Button
                        variant="success"
                        className="flex-1"
                        onClick={() => onAction(leave, 'approve')}
                    >
                        Approve
                    </Button>
                    <Button
                        variant="danger"
                        className="flex-1"
                        onClick={() => onAction(leave, 'reject')}
                    >
                        Reject
                    </Button>
                </div>
            )}

            {leave.status === 'pending' && !isAdmin && (
                <div className="pt-4">
                    <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onAction(leave, 'cancel')}
                    >
                        Cancel Application
                    </Button>
                </div>
            )}
        </div>
    );
};

export default LeaveDetails;
