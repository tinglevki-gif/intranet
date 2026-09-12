import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Sparkles, Mail, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export function TrialBanner() {
  const [trialInfo, setTrialInfo] = useState(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await api.getTrialStatus();
        if (data && data.is_trial) {
          setTrialInfo(data);
        }
      } catch (e) {
        console.warn('Error fetching trial status for dashboard banner:', e);
      }
    }
    loadStatus();
  }, []);

  if (!trialInfo || !trialInfo.is_trial) {
    return null;
  }

  const days = trialInfo.remainingDays !== undefined ? trialInfo.remainingDays : (trialInfo.remaining_days || 0);
  const hours = trialInfo.remainingHours !== undefined ? trialInfo.remainingHours : (trialInfo.remaining_hours || 0);
  const expiry = trialInfo.expiryDate || trialInfo.expiry_date || 'In 10 Tagen';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#001E36] via-[#002848] to-[#003860] border border-[#009FE3]/30 p-6 sm:p-7 text-white shadow-xl animate-fade-in">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#009FE3]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-[#F05A22]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#009FE3] to-[#38bdf8] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#009FE3]/25">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#009FE3]/20 border border-[#009FE3]/40 text-[#38bdf8] text-[10px] font-extrabold uppercase tracking-wider">
                Trial Edition • 10 Tage
              </span>
              {days <= 3 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                  Läuft bald ab
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Testzeitraum aktiv: Verbleibende Testzeit: <span className="text-[#38bdf8]">{days} {days === 1 ? 'Tag' : 'Tage'} und {hours} Stunden</span>
            </h2>
            <p className="text-xs text-slate-300">
              Gültig bis: <span className="font-semibold text-slate-100">{expiry}</span> • Sämtliche vertrauliche Produktivdaten sind im Demo-Modus maskiert.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <a
            href={`mailto:admin@tinglev.de?subject=Anfrage%20Vollversion%20Tinglev%20Intranet&body=Sehr%20geehrte%20Damen%20und%20Herren,%0A%0Awir%20testen%20aktuell%20das%20Tinglev%20Elementfabrik%20Intranet%20und%20bitten%20um%20Freischaltung%20der%20Vollversion.%0A%0AHardware-ID:%20${trialInfo.hardwareId || 'TINGLEV-CLIENT'}`}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F05A22] to-[#ff733d] hover:from-[#d94814] hover:to-[#F05A22] text-white text-xs font-bold transition-all shadow-md shadow-[#F05A22]/25 hover:shadow-lg hover:shadow-[#F05A22]/40"
          >
            <Mail className="w-4 h-4" />
            <span>Vollversion anfragen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default TrialBanner;
