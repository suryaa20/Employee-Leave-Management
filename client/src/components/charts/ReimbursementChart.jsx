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
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCreditCard
} from 'react-icons/fi';

const ReimbursementChart = ({ data, type = 'bar', title, height = 300 }) => {
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
    purple: '#a855f7',
    pink: '#ec4899',
    indigo: '#6366f1',
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    paid: '#3b82f6'
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#a855f7'];

  useEffect(() => {
    if (data) {
      setChartData(data);
    }
  }, [data]);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {entry.name.includes('Amount') || entry.name.includes('Total')
                ? formatCurrency(entry.value)
                : entry.value}
              {entry.unit || ''}
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
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" fill={COLORS.primary} name="Amount" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" fill={COLORS.success} name="Approved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" fill={COLORS.paid} name="Paid" radius={[4, 4, 0, 0]} />
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
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke={COLORS.primary} name="Total Amount" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="pending" stroke={COLORS.warning} name="Pending" strokeWidth={2} />
              <Line type="monotone" dataKey="approved" stroke={COLORS.success} name="Approved" strokeWidth={2} />
              <Line type="monotone" dataKey="paid" stroke={COLORS.paid} name="Paid" strokeWidth={2} />
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
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="amount" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} name="Total" />
              <Area type="monotone" dataKey="pending" stackId="1" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.6} name="Pending" />
              <Area type="monotone" dataKey="approved" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} name="Approved" />
              <Area type="monotone" dataKey="paid" stackId="1" stroke={COLORS.paid} fill={COLORS.paid} fillOpacity={0.6} name="Paid" />
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

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" tickFormatter={formatCurrency} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="amount" fill={COLORS.primary} name="Amount" barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="count" stroke={COLORS.warning} name="Count" strokeWidth={2} />
            </ComposedChart>
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
              {chartType === 'area' && <FiCreditCard className="w-5 h-5 text-primary-500" />}
              {chartType === 'composed' && <FiDollarSign className="w-5 h-5 text-primary-500" />}
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
            <FiCreditCard className="w-4 h-4" />
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
          <button
            onClick={() => setChartType('composed')}
            className={`p-2 rounded-lg transition-colors ${
              chartType === 'composed' 
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Composed Chart"
          >
            <FiDollarSign className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full" style={{ height: `${height}px` }}>
        {chartData.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No reimbursement data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized chart components for different use cases
export const ReimbursementTrendChart = ({ data, title }) => (
  <ReimbursementChart 
    data={data} 
    type="line" 
    title={title || "Reimbursement Trends"} 
    height={300}
  />
);

export const ReimbursementDistributionChart = ({ data, title }) => (
  <ReimbursementChart 
    data={data} 
    type="pie" 
    title={title || "Reimbursement Distribution"} 
    height={300}
  />
);

export const ReimbursementComparisonChart = ({ data, title }) => (
  <ReimbursementChart 
    data={data} 
    type="bar" 
    title={title || "Monthly Comparison"} 
    height={300}
  />
);

export const ReimbursementStackedChart = ({ data, title }) => (
  <ReimbursementChart 
    data={data} 
    type="area" 
    title={title || "Cumulative View"} 
    height={300}
  />
);

export const ReimbursementVolumeChart = ({ data, title }) => (
  <ReimbursementChart 
    data={data} 
    type="composed" 
    title={title || "Volume vs Amount"} 
    height={300}
  />
);

// Category breakdown chart
export const CategoryBreakdownChart = ({ data }) => {
  const categoryColors = {
    travel: '#3b82f6',
    food: '#10b981',
    accommodation: '#8b5cf6',
    medical: '#ef4444',
    office_supplies: '#f59e0b',
    training: '#ec4899',
    other: '#6b7280'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Expenses by Category
      </h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.category}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400 capitalize">
                {item.category.replace('_', ' ')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${item.amount.toFixed(2)} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: categoryColors[item.category] || '#3b82f6'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Status breakdown chart
export const StatusBreakdownChart = ({ data }) => {
  const statusConfig = {
    pending: { icon: FiClock, color: '#f59e0b', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    approved: { icon: FiCheckCircle, color: '#22c55e', bg: 'bg-green-100 dark:bg-green-900/30' },
    rejected: { icon: FiXCircle, color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30' },
    paid: { icon: FiCreditCard, color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30' }
  };

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Status Breakdown
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {data.map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          const percentage = ((item.amount / total) * 100).toFixed(1);

          return (
            <div key={item.status} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {item.count} requests
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${item.amount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {percentage}% of total
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Complete analytics dashboard component
export const ReimbursementAnalytics = ({ data }) => {
  const [timeframe, setTimeframe] = useState('monthly');

  // Sample data transformations
  const monthlyTrend = data?.monthlyTrend || [
    { name: 'Jan', amount: 4500, count: 12, pending: 1200, approved: 1800, paid: 1500 },
    { name: 'Feb', amount: 5200, count: 15, pending: 1500, approved: 2000, paid: 1700 },
    { name: 'Mar', amount: 4800, count: 13, pending: 1100, approved: 1900, paid: 1800 },
    { name: 'Apr', amount: 6100, count: 18, pending: 2000, approved: 2200, paid: 1900 },
    { name: 'May', amount: 5500, count: 16, pending: 1400, approved: 2100, paid: 2000 },
    { name: 'Jun', amount: 5900, count: 17, pending: 1600, approved: 2300, paid: 2000 },
  ];

  const categoryData = data?.categoryData || [
    { category: 'travel', amount: 8500, percentage: 35 },
    { category: 'food', amount: 6200, percentage: 25 },
    { category: 'accommodation', amount: 4800, percentage: 20 },
    { category: 'medical', amount: 2400, percentage: 10 },
    { category: 'office_supplies', amount: 1500, percentage: 6 },
    { category: 'other', amount: 1000, percentage: 4 },
  ];

  const statusData = data?.statusData || [
    { status: 'pending', amount: 2800, count: 15 },
    { status: 'approved', amount: 4200, count: 22 },
    { status: 'paid', amount: 5600, count: 28 },
    { status: 'rejected', amount: 1200, count: 8 },
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setTimeframe('weekly')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            timeframe === 'weekly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setTimeframe('monthly')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            timeframe === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setTimeframe('quarterly')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            timeframe === 'quarterly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Quarterly
        </button>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReimbursementTrendChart 
          data={monthlyTrend} 
          title="Monthly Reimbursement Trends"
        />
        <ReimbursementDistributionChart 
          data={categoryData.map(c => ({ name: c.category.replace('_', ' '), value: c.amount }))} 
          title="Expense Distribution"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReimbursementVolumeChart 
          data={monthlyTrend} 
          title="Volume vs Amount Analysis"
        />
        <StatusBreakdownChart data={statusData} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CategoryBreakdownChart data={categoryData} />
      </div>
    </div>
  );
};

export default ReimbursementChart;