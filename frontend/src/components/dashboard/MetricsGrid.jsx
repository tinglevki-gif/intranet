import React from 'react';
import * as LucideIcons from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function MetricsGrid({ stats }) {
  const { t } = useLanguage();
  if (!stats || stats.length === 0) return null;

  const renderIcon = (iconName, className = 'w-6 h-6') => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Activity;
    return <IconComponent className={className} />;
  };

  const colorVariants = [
    { bg: 'bg-[#eef8fd]', border: 'border-[#aee0f6]', text: 'text-[#009FE3]', iconBg: 'bg-[#009FE3]' },
    { bg: 'bg-[#fff7ed]', border: 'border-[#fdba74]', text: 'text-[#F05A22]', iconBg: 'bg-[#F05A22]' },
    { bg: 'bg-emerald-50/70', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-600' },
    { bg: 'bg-amber-50/70', border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-600' },
  ];

  const formatStatValue = (statKey, rawValue) => {
    if (!rawValue) return '';
    let valStr = String(rawValue);

    // Format specific stat cards with localized unit strings
    if (statKey === 'stat_team') {
      const numMatch = valStr.match(/\d+/);
      const count = numMatch ? numMatch[0] : '';
      return `${count} ${t('metrics.unit_people', 'Personen')}`;
    }
    if (statKey === 'stat_vacations') {
      const numMatch = valStr.match(/\d+/);
      const count = numMatch ? numMatch[0] : '18';
      return `${count} ${t('metrics.unit_days', 'Tage')}`;
    }
    if (statKey === 'stat_tickets') {
      const numMatch = valStr.match(/\d+/);
      const count = numMatch ? numMatch[0] : '2';
      return `${count} ${t('metrics.unit_in_progress', 'in Bearbeitung')}`;
    }

    // Fallback: replace any lingering Spanish tokens
    return valStr
      .replace(/personas/gi, t('metrics.unit_people', 'Personen'))
      .replace(/días|dias/gi, t('metrics.unit_days', 'Tage'))
      .replace(/en curso/gi, t('metrics.unit_in_progress', 'in Bearbeitung'));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => {
        const theme = colorVariants[idx % colorVariants.length];
        const statKey = stat.id ? stat.id.replace('-', '_') : `stat_${idx}`;
        const title = t(`metrics.${statKey}_title`, stat.title);
        const description = t(`metrics.${statKey}_desc`, stat.description);
        const change = t(`metrics.${statKey}_change`, stat.change);
        const displayValue = formatStatValue(statKey, stat.value);

        return (
          <div
            key={stat.id || idx}
            className="group relative p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {title}
              </span>
              <div className={`p-2.5 rounded-2xl ${theme.bg} ${theme.text} transition-transform group-hover:scale-110`}>
                {renderIcon(stat.icon)}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {displayValue}
              </h3>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate font-medium">
                  {description}
                </span>
                {change && (
                  <span
                    className={`font-semibold shrink-0 ${
                      stat.change_type === 'positive'
                        ? 'text-emerald-600'
                        : stat.change_type === 'negative'
                        ? 'text-rose-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {change}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
