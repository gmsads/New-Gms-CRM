import { useState } from 'react';

export function useDashboardFilters() {
  const [filters, setFilters] = useState({
    branch: '',
    executive: '',
    source: '',
    status: '',
    campaign: '',
    priority: '',
    year: new Date().getFullYear().toString(),
    month: '',
    presetDate: 'This Month',
    fromDate: '',
    toDate: ''
  });

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // If setting a custom date, clear preset
      if (key === 'fromDate' || key === 'toDate') next.presetDate = '';
      if (key === 'presetDate') {
        next.fromDate = '';
        next.toDate = '';
      }
      return next;
    });
  };

  const resetFilters = () => {
    setFilters({
      branch: '',
      executive: '',
      source: '',
      status: '',
      campaign: '',
      priority: '',
      year: new Date().getFullYear().toString(),
      month: '',
      presetDate: 'This Month',
      fromDate: '',
      toDate: ''
    });
  };

  return { filters, updateFilter, resetFilters, setFilters };
}
