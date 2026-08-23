import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const roleStyles = {
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
  IT_ADMIN: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
  HR_MANAGER: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
  MANAGEMENT: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20 font-bold',
  BUSINESS_DEV: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
  RECEPTION: 'bg-pink-50 text-pink-700 border-pink-200 ring-pink-500/20',
  SALES: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
  CONTROLLING_QS: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20',
  TECHNIK: 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-500/20',
  ACCOUNTING: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  PRODUKTION: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20',
  ABWICKLUNG: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500/20',
  EMPLOYEE: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20',
};

const defaultGermanRoleLabels = {
  ADMIN: 'SuperAdmin',
  IT_ADMIN: 'IT-Administration',
  HR_MANAGER: 'Personalwesen (HR)',
  MANAGEMENT: 'Geschäftsführung',
  BUSINESS_DEV: 'Geschäftsentwicklung',
  RECEPTION: 'Empfang & Rezeption',
  SALES: 'Vertriebsabteilung',
  CONTROLLING_QS: 'Qualitätssicherung & QS',
  TECHNIK: 'Technik & Statik',
  ACCOUNTING: 'Finanzbuchhaltung',
  PRODUKTION: 'Produktion & Planung',
  ABWICKLUNG: 'Auftragsabwicklung',
  EMPLOYEE: 'Mitarbeiter',
  SALES_LEAD: 'Vertriebsleiter',
  WORKING_STUDENT: 'Werkstudent / Praktikant',
};

export function RoleBadge({ role, customRoleName }) {
  const { t } = useLanguage();
  const label = customRoleName || t(`roles.${role}`, defaultGermanRoleLabels[role] || role || 'Mitarbeiter');
  const style = roleStyles[role] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {label}
    </span>
  );
}

export function getCategoryBadgeStyle(category) {
  switch ((category || '').toUpperCase()) {
    case 'IT-SICHERHEIT':
    case 'TECH':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'HR-UPDATE':
    case 'HR':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    case 'EVENT':
    case 'SOCIAL':
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    case 'PRODUKTION & TECHNIK':
    case 'PRODUKTION_TECHNIK':
      return 'bg-[#eef8fd] text-[#0070A8] border-[#aee0f6]/80';
    case 'WICHTIG':
      return 'bg-[#fff7ed] text-[#c2360a] border-[#fdba74]/80 font-bold';
    case 'ALLGEMEIN':
    case 'COMPANY':
    default:
      return 'bg-[#eef8fd] text-[#0070A8] border-[#aee0f6]/80';
  }
}

export function CategoryBadge({ category }) {
  const { t } = useLanguage();
  const label = t(`announcements.cat_${category}`, category);
  const style = getCategoryBadgeStyle(category);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {label}
    </span>
  );
}
