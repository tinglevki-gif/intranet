import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PerseusSecurityWidget } from '../components/security/PerseusSecurityWidget';
import { 
  Server, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Lock, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export function ITManagementPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('it_management.title', 'IT-Infrastruktur & Sicherheits-Dashboard')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('it_management.subtitle', 'Live-Überwachung von Servern, Netzwerken, Backups und externer Cyber-Sicherheit.')}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-cyan-50 text-cyan-700 font-bold text-xs rounded-full border border-cyan-200">
          IT_Admin Panel
        </span>
      </div>

      {/* Perseus Security & Awareness Hub Widget */}
      <PerseusSecurityWidget />

      {/* Telemetry Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">{t('it_management.server_health')}</span>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">99.98%</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t('it_management.healthy')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">{t('it_management.vpn_tunnels')}</span>
            <Wifi className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">18 / 20</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">WireGuard & IPsec</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">{t('it_management.firewall_status')}</span>
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">FIDO2 / 2FA</p>
          <p className="text-xs text-blue-600 font-semibold mt-1">Zero-Trust Active</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">{t('it_management.backup_status')}</span>
            <HardDrive className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">03:00 UTC</p>
          <p className="text-xs text-purple-600 font-semibold mt-1">S3 Immutable Snapshot</p>
        </div>
      </div>

      {/* Server Workload & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-600" />
            <span>Server-Cluster Auslastung</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>CPU Auslastung (FastAPI Backend Cluster)</span>
                <span>24%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-cyan-500 rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>RAM Auslastung (16 GB / 64 GB)</span>
                <span>25%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-indigo-500 rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Speicherplatz NVMe SSD (420 GB / 2 TB)</span>
                <span>21%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-1/5 h-full bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Logs */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-cyan-600" />
            <span>Sicherheits- & Zugriffsprotokoll</span>
          </h3>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">2FA-Zertifikat erneuert</p>
                <p className="text-slate-400 text-[11px]">System: Tobias Weber (IT_Admin)</p>
              </div>
              <span className="text-[10px] text-slate-400">Heute, 14:22</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Automatischer Schwachstellen-Scan</p>
                <p className="text-emerald-600 text-[11px] font-semibold">0 kritische Befunde</p>
              </div>
              <span className="text-[10px] text-slate-400">Heute, 04:00</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">FastAPI API v1 Session-Check</p>
                <p className="text-slate-400 text-[11px]">Alle Endpoints antworten &lt; 15ms</p>
              </div>
              <span className="text-[10px] text-slate-400">Vor 5 Min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
