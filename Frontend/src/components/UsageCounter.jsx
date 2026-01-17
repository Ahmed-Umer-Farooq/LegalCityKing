import React from 'react';
import { AlertTriangle, Crown } from 'lucide-react';

const UsageCounter = ({ resource, usage, limit, className = '' }) => {
  if (limit === -1 || limit === 'unlimited') {
    return (
      <div className={`flex items-center gap-1 text-xs text-green-600 ${className}`}>
        <Crown className="w-3 h-3" />
        <span>Unlimited</span>
      </div>
    );
  }

  const percentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage >= limit;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {isAtLimit && <AlertTriangle className="w-3 h-3 text-red-500" />}
        <span className={`text-xs font-medium ${
          isAtLimit ? 'text-red-600' : 
          isNearLimit ? 'text-orange-600' : 
          'text-gray-600'
        }`}>
          {usage}/{limit}
        </span>
      </div>
      
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-orange-500' :
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <span className={`text-xs ${
        isAtLimit ? 'text-red-600' : 
        isNearLimit ? 'text-orange-600' : 
        'text-gray-500'
      }`}>
        {percentage}%
      </span>
    </div>
  );
};

export default UsageCounter;