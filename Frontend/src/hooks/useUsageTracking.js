import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useUsageTracking = (lawyer) => {
  const [usage, setUsage] = useState({
    usage: {},
    limits: {},
    loading: true
  });

  const fetchUsage = async () => {
    if (!lawyer?.id) return;
    
    try {
      const response = await api.get('/lawyer/usage');
      setUsage({
        usage: response.data.usage || {},
        limits: response.data.limits || {},
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setUsage(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [lawyer?.id]);

  const checkLimit = (resource) => {
    const currentUsage = usage.usage[resource] || 0;
    const limit = usage.limits[resource] || -1;
    
    if (limit === -1) return { allowed: true, usage: currentUsage, limit: 'unlimited' };
    
    return {
      allowed: currentUsage < limit,
      usage: currentUsage,
      limit,
      remaining: Math.max(0, limit - currentUsage),
      percentage: limit > 0 ? Math.round((currentUsage / limit) * 100) : 0
    };
  };

  const refreshUsage = () => {
    fetchUsage();
  };

  return {
    usage: usage.usage,
    limits: usage.limits,
    loading: usage.loading,
    checkLimit,
    refreshUsage
  };
};