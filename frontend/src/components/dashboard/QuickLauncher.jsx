import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { LayoutGrid, ExternalLink, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function QuickLauncher({ tools }) {
  const { t } = useLanguage();
  const [toastMessage, setToastMessage] = useState(null);

  const renderIcon = (iconName, className = 'w-5 h-5') => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.AppWindow;
    return <IconComponent className={className} />;
  };

  const handleToolClick = (tool, translatedTitle) => {
    setToastMessage(`${t('tools.accessing')} "${translatedTitle}"...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('tools.title')}</h2>
            <p className="text-xs text-slate-500">{t('tools.subtitle')}</p>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-indigo-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid of Tools */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(tools || []).map((tool) => {
          const toolKey = tool.id ? tool.id.replace('tool-', '') : '';
          const title = t(`tools.${toolKey}_title`, tool.title);
          const category = t(`tools.${toolKey}_cat`, tool.category);
          const description = t(`tools.${toolKey}_desc`, tool.description);
          const badge = tool.badge ? t(`tools.${toolKey}_badge`, tool.badge) : null;

          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool, title)}
              className="group relative p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                    {renderIcon(tool.icon)}
                  </div>
                  {badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                <span>{t('tools.open')}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
