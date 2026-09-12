import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export function TrialBadge() {
  const [trialInfo, setTrialInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await api.getTrialStatus();
      if (data && data.is_trial) {
        setTrialInfo(data);
      } else {
        setTrialInfo(null);
      }
    } catch (err) {
      console.warn('Could not fetch trial status for badge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!trialInfo || !trialInfo.is_trial) {
    return null;
  }

  const days = trialInfo.remainingDays !== undefined ? trialInfo.remainingDays : (trialInfo.remaining_days || 0);
  const hours = trialInfo.remainingHours !== undefined ? trialInfo.remainingHours : (trialInfo.remaining_hours || 0);

  // Dynamic Color Palette:
  // Red (< 24 hours): days === 0
  // Yellow/Amber (<= 3 days): days <= 3
  // Blue (> 3 days)
  let badgeStyle = '';
  let pulse = false;

  if (days === 0) {
    // Under 24h: Red pulsating
    badgeStyle = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30';
    pulse = true;
  } else if (days <= 3) {
    // 1-3 days: Yellow / Amber
    badgeStyle = 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-700';
  } else {
    // > 3 days: Corporate Blue
    badgeStyle = 'bg-[#009FE3]/15 text-[#0070A8] dark:text-[#38bdf8] border-[#009FE3]/30';
  }

  return (
    <div 
      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 shadow-xs select-none ${badgeStyle} ${pulse ? 'animate-pulse' : ''}`}
      title={`Testversion gültig bis: ${trialInfo.expiryDate || trialInfo.expiry_date || 'In 10 Tagen'}`}
    >
      <Clock className={`w-3.5 h-3.5 ${days === 0 ? 'text-rose-600 dark:text-rose-400' : days <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-[#009FE3]'}`} />
      <span className="whitespace-nowrap">
        Testversion: Noch {days} {days === 1 ? 'Tag' : 'Tage'}, {hours} Std.
      </span>
    </div>
  );
}

export default TrialBadge;
