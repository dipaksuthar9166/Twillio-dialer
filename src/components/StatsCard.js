import React from "react";

const StatsCard = ({
  title,
  value,
  change,
  icon,
  color, // This is for the ICON background
  borderColor,
  accent,
  subtitle,
  changeColor,
  timeRangeLabel,
  isLoading,
  className // New prop for the CARD container
}) => {
  // Use borderColor if provided, otherwise fall back to accent, or use default
  const topBorderColor = borderColor || accent || "bg-gradient-to-r from-pink-500 to-purple-500";

  // Ensure the change text displays correctly
  const displayChange = change || subtitle || "0% Since last week";

  // Ensure value defaults to 0 if not provided
  const displayValue = (typeof value === 'number' || typeof value === 'string') ? value : 0;

  return (
    <div className={`relative shadow-lg rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full min-h-[110px] ${className || 'bg-white dark:bg-gray-800'}`}>
      {/* Animated Top Border */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${topBorderColor} animate-pulse`}></div>

      {/* Shimmer Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

      <div className="p-4 flex items-center justify-between relative z-10">
        {/* Stats Info */}
        <div className="flex flex-col">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {isLoading ? (
              <span className="inline-block w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
            ) : (
              typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue
            )}
          </h3>
          <span className={`text-xs ${changeColor || 'text-gray-400 dark:text-gray-500'}`}>
            {displayChange}
            {timeRangeLabel && ` • ${timeRangeLabel}`}
          </span>
        </div>

        {/* Icon with Animation */}
        {icon && (
          <div className={`p-4 rounded-xl ${color || 'bg-gray-100 dark:bg-gray-700'} transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
