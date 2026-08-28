import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNews } from '../../context/NewsContext';
import { useLanguage } from '../../context/LanguageContext';
import { TinglevLogo } from '../common/TinglevLogo';
import { UserAvatar } from '../common/UserAvatar';

export function Sidebar({ isOpen, onClose }) {
  const { menuSections, user, menuLoading } = useAuth();
  const { unreadCount } = useNews();
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-[#001E36] text-slate-300 border-r border-[#002B49] transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-[#002B49]/80 bg-[#001424]/60">
          <div className="flex items-center justify-between">
            <TinglevLogo variant="full" theme="light-text" showSubtitle={true} />

            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#002B49]"
            >
              <LucideIcons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {menuLoading ? (
            <div className="space-y-4 px-2">
              <div className="h-4 bg-[#002B49] rounded animate-pulse w-1/3"></div>
              <div className="h-9 bg-[#002B49]/60 rounded-lg animate-pulse"></div>
              <div className="h-9 bg-[#002B49]/60 rounded-lg animate-pulse"></div>
            </div>
          ) : (
            menuSections.map((section, sIdx) => {
              const translatedSection = t(`nav_sections.${section.section}`, section.section);
              return (
                <div key={section.section || sIdx} className="space-y-1.5">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#72ccf0]/70">
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
                              ? 'bg-gradient-to-r from-[#008DD2] to-[#009FE3] text-white shadow-md shadow-[#008DD2]/30 font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-[#002B49]/80'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`transition-colors ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#009FE3]'
                              }`}
                            >
                              {renderIcon(item.icon)}
                            </span>
                            <span>{translatedLabel}</span>
                          </div>

                          {item.key === 'announcements' && unreadCount > 0 ? (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all flex items-center space-x-1 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#F05A22] text-white shadow-xs animate-pulse'
                              }`}
                            >
                              <span>{unreadCount} {t('common.new', 'Neu')}</span>
                            </span>
                          ) : translatedBadge ? (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#F05A22]/20 text-[#ffba9e] border border-[#F05A22]/40'
                              }`}
                            >
                              {translatedBadge}
                            </span>
                          ) : null}
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
        <div className="p-4 border-t border-[#002B49]/80 bg-[#001424]/40">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-[#002B49]/50 border border-[#003E6B]/60">
            <UserAvatar
              src={user?.avatar_url}
              name={user?.full_name}
              size="md"
              className="ring-2 ring-[#009FE3]/50 shrink-0"
              rounded="rounded-full"
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
