export const requirementTypes = [
  'Boards', 'Banners', 'Hoardings', 'Digital Marketing',
  'Standees', 'Brochures', 'Social Media', 'Video Ads',
  'LED Boards', 'Wall Painting', 'Vehicle Branding', 'Other',
];

export const leadSources = [
  'India mart', 'Just dial', 'Google ads', 'Referral', 'Website', 'Meta (Facebook/Instagram)', 'Walk-in', 'Other'
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
];
