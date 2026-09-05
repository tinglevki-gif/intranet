import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Smartphone, 
  MapPin, 
  Building, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  ArrowUpRight, 
  Copy, 
  Check 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { UserAvatar } from '../common/UserAvatar';

export function EmployeeDetailModal({ 
  node, 
  onClose, 
  onSelectEmployee, 
  onCopyPhone 
}) {
  const { t } = useLanguage();

  if (!node) return null;

  const extension = node.phone ? node.phone.split('-')[1] || `#${100 + node.id}` : `#${100 + node.id}`;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'SuperAdmin / GL',
          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
          icon: <ShieldCheck className="w-3.5 h-3.5" />
        };
      case 'MANAGEMENT':
      case 'HR_MANAGER':
        return {
          label: 'Führungsebene',
          bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
          icon: <UserCheck className="w-3.5 h-3.5" />
        };
      case 'IT_ADMIN':
        return {
          label: 'IT-Administration',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60',
          icon: <ShieldCheck className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: 'Fachbereich',
          bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: <Building className="w-3.5 h-3.5" />
        };
    }
  };

  const roleInfo = getRoleBadge(node.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient banner */}
        <div className="relative bg-gradient-to-r from-tinglev-blue to-cyan-700 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={t('org_chart.close')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <UserAvatar
                src={node.avatar_url}
                name={node.full_name}
                size="xl"
                className="ring-4 ring-white/30 shadow-lg"
                rounded="rounded-2xl"
              />
              {node.role === 'ADMIN' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-xs bg-white/20 text-white border-white/30`}>
                  {roleInfo.icon}
                  <span>{roleInfo.label}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30">
                  {node.department}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1.5 truncate">
                {node.full_name}
              </h2>
              <p className="text-cyan-100 text-xs font-medium truncate">
                {node.position}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                {t('phone_directory.location') || 'Standort'}
              </span>
              <div className="flex items-center space-x-1.5 mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{node.location || 'Hauptsitz Tinglev'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                {t('org_chart.direct_reports')}
              </span>
              <div className="flex items-center space-x-1.5 mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{node.children ? node.children.length : 0} {t('org_chart.reports_count')}</span>
              </div>
            </div>
          </div>

          {/* Contact Details & Actions */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('org_chart.contact_info')}
            </h3>

            {/* Phone / Extension */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Durchwahl / Festnetz</div>
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                    {node.phone || `+49 89 1234-${extension}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onCopyPhone(node.phone || `+49 89 1234-${extension}`)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center space-x-1 transition-colors"
                  title={t('org_chart.copy_extension')}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kopieren</span>
                </button>
                <a
                  href={`tel:${node.phone || `+49891234${extension}`}`}
                  className="px-3 py-1.5 rounded-xl bg-tinglev-blue hover:bg-tinglev-blue/90 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('org_chart.call')}</span>
                </a>
              </div>
            </div>

            {/* Mobile (if present) */}
            {node.mobile && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Mobiltelefon</div>
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      {node.mobile}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${node.mobile}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('org_chart.call')}</span>
                </a>
              </div>
            )}

            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400">E-Mail-Adresse</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {node.email}
                  </div>
                </div>
              </div>

              <a
                href={`mailto:${node.email}`}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 transition-colors ml-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{t('org_chart.email')}</span>
              </a>
            </div>
          </div>

          {/* Direct Subordinates List */}
          {node.children && node.children.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('org_chart.subordinates')} ({node.children.length})
                </h3>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {node.children.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onSelectEmployee?.(sub)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <UserAvatar
                        src={sub.avatar_url}
                        name={sub.full_name}
                        size="sm"
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                          {sub.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {sub.position}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            {t('org_chart.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
