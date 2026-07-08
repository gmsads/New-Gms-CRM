export const calculateDeliveryPriority = (deliveryDate) => {
  if (!deliveryDate) return {
    daysRemaining: null,
    priority: 'NONE',
    label: 'No Date',
    color: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(deliveryDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      daysRemaining: diffDays,
      priority: 'OVERDUE',
      label: `Overdue by ${Math.abs(diffDays)}d`,
      color: 'bg-red-600 text-white border-red-700 animate-pulse'
    };
  } else if (diffDays <= 1) {
    return {
      daysRemaining: diffDays,
      priority: 'CRITICAL',
      label: diffDays === 0 ? 'Due Today' : 'Due Tomorrow',
      color: 'bg-red-100 text-red-800 border-red-200'
    };
  } else if (diffDays <= 3) {
    return {
      daysRemaining: diffDays,
      priority: 'HIGH',
      label: `${diffDays} Days Left`,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    };
  } else if (diffDays <= 7) {
    return {
      daysRemaining: diffDays,
      priority: 'MEDIUM',
      label: `${diffDays} Days Left`,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  } else {
    return {
      daysRemaining: diffDays,
      priority: 'NORMAL',
      label: `${diffDays} Days Left`,
      color: 'bg-green-100 text-green-800 border-green-200'
    };
  }
};
