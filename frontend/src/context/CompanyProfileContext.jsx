import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { quotationApi } from '../services/api';
import { useAuth } from './AuthContext';

const CompanyProfileContext = createContext();

const defaultCompanyProfile = {
  companyName: 'Global Marketing Solutions',
  address: 'Ground, First Floor, Second Floor, # 16-11-20/6/1/2, Saleem Nagar, Malakpet, Hyderabad, Telangana - 500036',
  contactEmail: 'info@globalmarketingsolutions.in',
  contactPhone: '+91 98765 43210',
  website: 'www.globalmarketingsolutions.in',
  gstin: '36AAGCE2149M1Z8',
  gstNumber: '36AAGCE2149M1Z8',
  panNumber: 'AAGCE2149M',
  regNumber: 'REG-2024-GMS-881',
  logoUrl: '/logo.png',
  authorizedSignatureUrl: '',
  tagline: '',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  pincode: '500036',
  alternateMobile: '',
  cin: '',
  msme: '',
  sealUrl: '',
  watermarkUrl: '',
  footerLogoUrl: '',
  bankDetails: {
    accountName: 'GLOBAL MARKETING SOLUTIONS',
    accountNumber: '917020030786090',
    bankName: 'AXIS BANK',
    ifscCode: 'UTIB0001305',
    branch: 'Champapet'
  },
  bankAccounts: [],
  qrCode: {
    enabled: true,
    upiId: 'gms@axisbank'
  },
  termsAndConditions: [
    '1) Payment should be Crossed and Made to "GLOBAL MARKETING SOLUTIONS", AXIS BANK, BRANCH: Champapet, A/C: 917020030786090, IFSCcode:UTIB0001305'
  ],
  footerNotes: 'Thank you for your business!',
  defaultValidityDays: 15,
  quotationSettings: {
    prefix: 'QT-',
    startNumber: 1000,
    validityDays: 15,
    termsAndConditions: '',
    footerText: '',
    defaultNotes: '70% ADVANCE PAYMENT NEED TO START WORK'
  },
  invoiceSettings: {
    prefix: 'INV-',
    startNumber: 1000,
    termsAndConditions: '1) Payment should be Crossed and Made to "GLOBAL MARKETING SOLUTIONS", AXIS BANK, BRANCH: Champapet, A/C: 917020030786090, IFSCcode:UTIB0001305',
    footerText: 'Thank you for your business!',
    defaultBankAccountId: null
  },
  documentNumbering: {
    receipt: { prefix: 'REC-', startNumber: 1000 },
    purchaseOrder: { prefix: 'PO-', startNumber: 1000 },
    deliveryChallan: { prefix: 'DC-', startNumber: 1000 }
  }
};

export const CompanyProfileProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('gms_company_profile');
    if (stored) {
      try {
        return { ...defaultCompanyProfile, ...JSON.parse(stored) };
      } catch (err) {
        console.error('Error parsing stored company profile:', err);
      }
    }
    return defaultCompanyProfile;
  });

  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (tokenToUse) => {
    const token = tokenToUse || user?.token;
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await quotationApi.getTemplate(token);
      if (res.success && res.data) {
        const merged = {
          ...defaultCompanyProfile,
          ...res.data,
          bankDetails: { ...defaultCompanyProfile.bankDetails, ...res.data.bankDetails },
          qrCode: { ...defaultCompanyProfile.qrCode, ...res.data.qrCode }
        };
        setProfile(merged);
        localStorage.setItem('gms_company_profile', JSON.stringify(merged));
      }
    } catch (err) {
      console.error('Failed to fetch company profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      fetchProfile(user.token);
    }
  }, [user, fetchProfile]);

  const updateProfile = async (newProfileData, tokenToUse) => {
    const token = tokenToUse || user?.token;
    const merged = {
      ...profile,
      ...newProfileData,
      bankDetails: { ...profile.bankDetails, ...(newProfileData.bankDetails || {}) },
      qrCode: { ...profile.qrCode, ...(newProfileData.qrCode || {}) }
    };
    
    setProfile(merged);
    localStorage.setItem('gms_company_profile', JSON.stringify(merged));

    if (token) {
      try {
        const res = await quotationApi.updateTemplate(merged, token);
        if (res.success && res.data) {
          const serverMerged = { ...merged, ...res.data };
          setProfile(serverMerged);
          localStorage.setItem('gms_company_profile', JSON.stringify(serverMerged));
          return serverMerged;
        }
      } catch (err) {
        console.error('Failed to save company profile to server:', err);
        throw err;
      }
    }
    return merged;
  };

  return (
    <CompanyProfileContext.Provider value={{ profile, loading, fetchProfile, updateProfile }}>
      {children}
    </CompanyProfileContext.Provider>
  );
};

export const useCompanyProfile = () => {
  const context = useContext(CompanyProfileContext);
  if (!context) {
    throw new Error('useCompanyProfile must be used within a CompanyProfileProvider');
  }
  return context;
};
