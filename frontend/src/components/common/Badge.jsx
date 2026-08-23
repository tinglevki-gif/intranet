import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const roleStyles = {
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
  HR_MANAGER: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
  EMPLOYEE: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
};

const categoryStyles = {
  COMPANY: 'bg-[#eef8fd] text-[#0070A8] border-[#aee0f6]',
  HR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TECH: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  SOCIAL: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function RoleBadge({ role }) {
  const { t } = useLanguage();
  const label = t(`roles.${role}`, role);
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
