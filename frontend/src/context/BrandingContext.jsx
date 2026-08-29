import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    companyName: 'TINGLEV',
    companySuffix: 'ELEMENTFABRIK',
    companyTagline: 'PORTAL INTRANET',
    companyLogoUrl: '',
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const data = await api.getBranding();
      if (data) {
        setBranding({
          companyName: data.company_name || 'TINGLEV',
          companySuffix: data.company_suffix || 'ELEMENTFABRIK',
          companyTagline: data.company_tagline || 'PORTAL INTRANET',
          companyLogoUrl: data.company_logo_url || '',
        });
      }
    } catch (err) {
      console.warn('Could not load company branding, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const updateBranding = async (name, suffix, tagline) => {
    const updated = await api.updateBranding(name, suffix, tagline);
    setBranding({
      companyName: updated.company_name,
      companySuffix: updated.company_suffix,
      companyTagline: updated.company_tagline,
      companyLogoUrl: updated.company_logo_url || '',
    });
    return updated;
  };

  const uploadLogo = async (file) => {
    const updated = await api.uploadCompanyLogo(file);
    setBranding({
      companyName: updated.company_name,
      companySuffix: updated.company_suffix,
      companyTagline: updated.company_tagline,
      companyLogoUrl: updated.company_logo_url || '',
    });
    return updated;
  };

  const resetBranding = async () => {
    const updated = await api.resetBranding();
    setBranding({
      companyName: updated.company_name,
      companySuffix: updated.company_suffix,
      companyTagline: updated.company_tagline,
      companyLogoUrl: updated.company_logo_url || '',
    });
    return updated;
  };

  return (
    <BrandingContext.Provider
      value={{
        ...branding,
        loading,
        refreshBranding: fetchBranding,
        updateBranding,
        uploadLogo,
        resetBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
