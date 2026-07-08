/**
 * Badge — Semantic status badge component.
 * Covers all status values used across the GMS CRM.
 */
const VARIANTS = {
  // Employee status
  ACTIVE:           'bg-green-100 text-green-700 border-green-200',
  INACTIVE:         'bg-red-100 text-red-700 border-red-200',
  SUSPENDED:        'bg-orange-100 text-orange-700 border-orange-200',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROBATION:        'bg-blue-100 text-blue-700 border-blue-200',

  // Attendance
  PRESENT:  'bg-green-100 text-green-700 border-green-200',
  ABSENT:   'bg-red-100 text-red-700 border-red-200',
  LEAVE:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  HALF_DAY: 'bg-purple-100 text-purple-700 border-purple-200',
  HOLIDAY:  'bg-blue-100 text-blue-700 border-blue-200',
  WFH:      'bg-teal-100 text-teal-700 border-teal-200',

  // Leave status
  PENDING:        'bg-yellow-100 text-yellow-700 border-yellow-200',
  HR_APPROVED:    'bg-green-100 text-green-700 border-green-200',
  HR_REJECTED:    'bg-red-100 text-red-700 border-red-200',
  ADMIN_APPROVED: 'bg-blue-100 text-blue-700 border-blue-200',
  REJECTED:       'bg-red-100 text-red-700 border-red-200',
  APPROVED:       'bg-green-100 text-green-700 border-green-200',

  // Alerts
  HIGH:   'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:    'bg-blue-100 text-blue-700 border-blue-200',

  // Generic
  SUCCESS: 'bg-green-100 text-green-700 border-green-200',
  WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ERROR:   'bg-red-100 text-red-700 border-red-200',
  INFO:    'bg-blue-100 text-blue-700 border-blue-200',
  DEFAULT: 'bg-gray-100 text-gray-700 border-gray-200',
};

const Badge = ({ value, label, className = '' }) => {
  const key = (value || '').toString().toUpperCase().replace(/\s+/g, '_');
  const variant = VARIANTS[key] || VARIANTS.DEFAULT;
  const text = label || (value || '').toString().replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variant} ${className}`}>
      {text}
    </span>
  );
};

export default Badge;
