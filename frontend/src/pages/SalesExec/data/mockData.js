/**
 * Static/reference data only — NO mock business data.
 * All actual data (prospects, orders, followups, etc.) must come from the API.
 */

// Product/service types (used in dropdowns — not business data)
export const requirementTypes = [
  'Boards', 'Banners', 'Hoardings', 'Digital Marketing',
  'Standees', 'Brochures', 'Social Media', 'Video Ads',
  'LED Boards', 'Wall Painting', 'Vehicle Branding', 'Other',
];

export const leadSources = [
  'Google', 'JustDial', 'IndiaMART', 'WhatsApp',
  'Referral', 'Cold Call', 'Walk-in', 'Other',
];

export const whatsappTemplates = [
  {
    id: 1,
    label: 'Send Brochure',
    icon: '📄',
    message: 'Hi {name}, Thank you for your interest in GMS Ad Agency. We specialize in boards, banners, hoardings & digital marketing. Please find our brochure attached. Feel free to reach out anytime!',
  },
  {
    id: 2,
    label: 'Send Quotation',
    icon: '💰',
    message: 'Hi {name}, Please find the quotation for your requirement below. Total: ₹{amount}. Valid for 7 days. For any queries please contact us directly.',
  },
  {
    id: 3,
    label: 'Appointment Confirm',
    icon: '📅',
    message: 'Hi {name}, Your appointment is confirmed for {date} at {time}. Location: {location}. Looking forward to meeting you!',
  },
  {
    id: 4,
    label: 'Order Confirmed',
    icon: '✅',
    message: 'Hi {name}, Your order has been confirmed! Order ID: {orderId}. Our team will reach out shortly. For any queries contact our Sales Manager: +91 XXXXX XXXXX. Thank you for choosing GMS!',
  },
  {
    id: 5,
    label: 'Schedule Meeting',
    icon: '🤝',
    message: 'Hi {name}, We would love to discuss your requirements in detail. Please share your preferred date and time for a meeting.',
  },
];

// Pipeline stage colors (for UI)
export const STAGE_COLORS = {
  Lead:        { bg: 'bg-gray-100',    text: 'text-gray-700',   hex: '#94a3b8' },
  Prospect:    { bg: 'bg-blue-100',    text: 'text-blue-700',   hex: '#60a5fa' },
  'Follow-up': { bg: 'bg-amber-100',   text: 'text-amber-700',  hex: '#f59e0b' },
  Appointment: { bg: 'bg-purple-100',  text: 'text-purple-700', hex: '#a78bfa' },
  Proposal:    { bg: 'bg-indigo-100',  text: 'text-indigo-700', hex: '#818cf8' },
  Negotiation: { bg: 'bg-orange-100',  text: 'text-orange-700', hex: '#fb923c' },
  Won:         { bg: 'bg-green-100',   text: 'text-green-700',  hex: '#10b981' },
  Lost:        { bg: 'bg-red-100',     text: 'text-red-700',    hex: '#ef4444' },
};

export const PRIORITY_COLORS = {
  Hot:  { badge: 'bg-red-100 text-red-700 border border-red-200',    dot: 'bg-red-500'    },
  Warm: { badge: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-400' },
  Cold: { badge: 'bg-blue-100 text-blue-700 border border-blue-200',  dot: 'bg-blue-400'   },
};
