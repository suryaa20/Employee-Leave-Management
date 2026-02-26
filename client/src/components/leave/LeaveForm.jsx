import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { FiCalendar, FiType, FiFileText } from 'react-icons/fi';

const LeaveForm = ({ onSubmit, initialData = {}, loading = false }) => {
    const [formData, setFormData] = useState({
        leaveType: initialData.leaveType || 'annual',
        fromDate: initialData.fromDate || '',
        toDate: initialData.toDate || '',
        reason: initialData.reason || ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Leave Type
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiType className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            name="leaveType"
                            value={formData.leaveType}
                            onChange={handleChange}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-bg dark:text-white"
                            required
                        >
                            <option value="annual">Annual Leave</option>
                            <option value="sick">Sick Leave</option>
                            <option value="casual">Casual Leave</option>
                            <option value="maternity">Maternity Leave</option>
                            <option value="paternity">Paternity Leave</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="From Date"
                        type="date"
                        name="fromDate"
                        value={formData.fromDate}
                        onChange={handleChange}
                        icon={FiCalendar}
                        required
                    />
                    <Input
                        label="To Date"
                        type="date"
                        name="toDate"
                        value={formData.toDate}
                        onChange={handleChange}
                        icon={FiCalendar}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reason
                    </label>
                    <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                            <FiFileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                            name="reason"
                            rows="4"
                            value={formData.reason}
                            onChange={handleChange}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-bg dark:text-white"
                            placeholder="Please provide a reason for your leave request..."
                            required
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button
                    type="submit"
                    loading={loading}
                    className="w-full md:w-auto"
                >
                    {initialData._id ? 'Update Application' : 'Submit Application'}
                </Button>
            </div>
        </form>
    );
};

export default LeaveForm;
