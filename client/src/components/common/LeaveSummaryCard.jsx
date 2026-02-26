const LeaveSummaryCard = ({ title, count, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    green: 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20',
    red: 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20',
    purple: 'bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300',
    red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300'
  };

  return (
    <div className={`group p-6 rounded-2xl border backdrop-blur-sm ${colorClasses[color]} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
          <p className="text-4xl font-black tracking-tighter">{count}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${iconBgClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-current opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
    </div>
  );
};

export default LeaveSummaryCard;