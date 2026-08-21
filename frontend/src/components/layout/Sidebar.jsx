import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getAvatarUrl } from '../../services/api';

export function Sidebar({ isOpen, onClose }) {
  const { menuSections, user, menuLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // Helper to safely render dynamic Lucide icon by name
  const renderIcon = (iconName, className = 'w-5 h-5') => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.CircleDot;
    return <IconComponent className={className} />;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Language Switcher directly below */}
        <div className="px-5 pt-4 pb-3.5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                <LucideIcons.Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-base block font-heading">
                  {t('brand.name', 'TIGLEV ELEMENTFABRIK')}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 block">
                  {t('brand.subtitle', 'PORTAL INTRANET')}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <LucideIcons.X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Selector right below PORTAL INTRANET */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Sprache / Language:
            </span>
            <LanguageSelector />
          </div>
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {menuLoading ? (
            <div className="space-y-4 px-2">
              <div className="h-4 bg-slate-800 rounded animate-pulse w-1/3"></div>
              <div className="h-9 bg-slate-800/60 rounded-lg animate-pulse"></div>
              <div className="h-9 bg-slate-800/60 rounded-lg animate-pulse"></div>
            </div>
          ) : (
            menuSections.map((section, sIdx) => {
              const translatedSection = t(`nav_sections.${section.section}`, section.section);
              return (
                <div key={section.section || sIdx} className="space-y-1.5">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {translatedSection}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const translatedLabel = t(`nav_items.${item.key}`, item.label);
                      const translatedBadge = item.badge ? t(`nav_badges.${item.badge}`, item.badge) : null;

                      return (
                        <NavLink
                          key={item.key || item.path}
                          to={item.path}
                          onClick={() => {
                            if (window.innerWidth < 768 && onClose) onClose();
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`transition-colors ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                              }`}
                            >
                              {renderIcon(item.icon)}
                            </span>
                            <span>{translatedLabel}</span>
                          </div>

                          {translatedBadge && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                              }`}
                            >
                              {translatedBadge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick User summary in Sidebar footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <img
              src={getAvatarUrl(user?.avatar_url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.full_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.department}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
