import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiCalendar } from 'react-icons/fi';

const LeaveChart = ({ data, type = 'bar', title, height = 300 }) => {
  const [chartType, setChartType] = useState(type);
  const [chartData, setChartData] = useState([]);

  // Colors for charts
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#8b5cf6',
    success: '#22c55e',
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    cancelled: '#6b7280'
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  useEffect(() => {
    if (data) {
      setChartData(data);
    }
  }, [data]);

  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
              {entry.name === 'Amount' ? ' USD' : entry.name === 'Days' ? ' days' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="leaves" fill={COLORS.primary} name="Leaves" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" fill={COLORS.success} name="Approved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill={COLORS.danger} name="Rejected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="leaves" stroke={COLORS.primary} name="Leaves" strokeWidth={2} />
              <Line type="monotone" dataKey="approved" stroke={COLORS.success} name="Approved" strokeWidth={2} />
              <Line type="monotone" dataKey="pending" stroke={COLORS.warning} name="Pending" strokeWidth={2} />
              <Line type="monotone" dataKey="rejected" stroke={COLORS.danger} name="Rejected" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="leaves" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} name="Leaves" />
              <Area type="monotone" dataKey="approved" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} name="Approved" />
              <Area type="monotone" dataKey="pending" stackId="1" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.6} name="Pending" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          {title && (
            <>
              {chartType === 'bar' && <FiBarChart2 className="w-5 h-5 text-primary-500" />}
              {chartType === 'line' && <FiTrendingUp className="w-5 h-5 text-primary-500" />}
              {chartType === 'pie' && <FiPieChart className="w-5 h-5 text-primary-500" />}
              {chartType === 'area' && <FiCalendar className="w-5 h-5 text-primary-500" />}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            </>
          )}
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'bar' 
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Bar Chart"
          >
            <FiBarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'line' 
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Line Chart"
          >
            <FiTrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'area' 
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Area Chart"
          >
            <FiCalendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'pie' 
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Pie Chart"
          >
            <FiPieChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full" style={{ height: `${height}px` }}>
        {chartData.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Predefined chart types for specific use cases
export const LeaveTrendChart = ({ data, title }) => (
  <LeaveChart 
    data={data} 
    type="line" 
    title={title || "Leave Trends"} 
    height={300}
  />
);

export const LeaveDistributionChart = ({ data, title }) => (
  <LeaveChart 
    data={data} 
    type="pie" 
    title={title || "Leave Distribution"} 
    height={300}
  />
);

export const LeaveComparisonChart = ({ data, title }) => (
  <LeaveChart 
    data={data} 
    type="bar" 
    title={title || "Leave Comparison"} 
    height={300}
  />
);

export const LeaveStackedChart = ({ data, title }) => (
  <LeaveChart 
    data={data} 
    type="area" 
    title={title || "Leave Stacked View"} 
    height={300}
  />
);

// Example usage component
export const LeaveAnalytics = ({ leaveData }) => {
  // Sample data transformation
  const monthlyTrend = leaveData?.monthlyTrend || [
    { name: 'Jan', leaves: 65, approved: 45, pending: 15, rejected: 5 },
    { name: 'Feb', leaves: 59, approved: 40, pending: 12, rejected: 7 },
    { name: 'Mar', leaves: 80, approved: 60, pending: 15, rejected: 5 },
    { name: 'Apr', leaves: 81, approved: 58, pending: 18, rejected: 5 },
    { name: 'May', leaves: 56, approved: 42, pending: 10, rejected: 4 },
    { name: 'Jun', leaves: 55, approved: 40, pending: 12, rejected: 3 },
  ];

  const distributionData = [
    { name: 'Annual Leave', value: 45 },
    { name: 'Sick Leave', value: 25 },
    { name: 'Casual Leave', value: 20 },
    { name: 'Unpaid Leave', value: 10 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveTrendChart 
          data={monthlyTrend} 
          title="Monthly Leave Trends"
        />
        <LeaveDistributionChart 
          data={distributionData} 
          title="Leave Type Distribution"
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <LeaveComparisonChart 
          data={monthlyTrend} 
          title="Monthly Comparison"
        />
      </div>
    </div>
  );
};

export default LeaveChart;