import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { normalizePhone } from '../../utils/normalization';

const ClientNameLink = ({ clientId, phone, clientName, className }) => {
  const safeClientId = typeof clientId === 'object' && clientId !== null ? clientId._id : clientId;
  const normalizedPhone = normalizePhone(phone);
  
  // Prefer mobile phone based lookup, fallback to clientId
  const destination = normalizedPhone 
    ? `/clients/mobile/${normalizedPhone}` 
    : `/clients/${safeClientId || 'missing-client-id'}`;

  const isMissing = !normalizedPhone && !safeClientId;

  return (
    <Link
      to={destination}
      className={clsx(
        "font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer",
        isMissing && "border-b border-dashed border-red-300",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      title={isMissing ? "Missing Client Phone/ID in Database" : ""}
    >
      {clientName || 'Unknown Client'}
    </Link>
  );
};

export default ClientNameLink;
