import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Pin, ArrowRight, Plus, Calendar, Clock, Eye, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getNewsCoverUrl } from '../../services/api';
import { getCategoryBadgeStyle } from '../common/Badge';
import { NewsDetailModal } from '../news/NewsDetailModal';
import { NewsFormModal } from '../news/NewsFormModal';

export function AnnouncementsFeed({ announcements = [], onRefresh = null }) {
  const { t, formatDate } = useLanguage();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeDetailNews, setActiveDetailNews] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);

  const categories = [
    { key: 'ALL', label: 'Alle' },
    { key: 'Allgemein', label: 'Allgemein' },
    { key: 'IT-Sicherheit', label: 'IT-Sicherheit' },
    { key: 'HR-Update', label: 'HR' },
    { key: 'Produktion & Technik', label: 'Technik' },
    { key: 'Event', label: 'Events' },
  ];

  const filtered = selectedCategory === 'ALL'
    ? (announcements || [])
    : (announcements || []).filter((a) => (a.category || '').toLowerCase().includes(selectedCategory.toLowerCase()));

  const topItems = filtered.slice(0, 3);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#eef8fd] text-[#009FE3]">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">
                {t('announcements.title', 'Aktuelle Mitteilungen & News')}
              </h2>
              <span className="w-2 h-2 rounded-full bg-[#F05A22] animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-500">
              {t('announcements.subtitle', 'Wichtige Unternehmensupdates und Bekanntmachungen')}
            </p>
          </div>
        </div>

        {/* Action: Create button for SuperAdmin or View All */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={() => setFormModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#eef8fd] hover:bg-[#d5effa] text-[#0070A8] rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neu</span>
            </button>
          )}

          <Link
            to="/announcements"
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#001E36] hover:bg-[#009FE3] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>Alle Mitteilungen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.key
                ? 'bg-[#001E36] text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Announcements Compact Feed */}
      <div className="space-y-3.5">
        {topItems.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Keine aktuellen Mitteilungen in dieser Kategorie.
          </div>
        ) : (
          topItems.map((item) => {
            const coverUrl = getNewsCoverUrl(item.cover_image);
            const categoryStyle = getCategoryBadgeStyle(item.category);
            const dateStr = formatDate(item.created_at || Date.now(), { day: 'numeric', month: 'short' });

            return (
              <div
                key={item.id}
                onClick={() => setActiveDetailNews(item)}
                className="group p-4 sm:p-5 rounded-2xl border border-slate-100/80 hover:border-[#72ccf0] bg-slate-50/40 hover:bg-white hover:shadow-lg hover:shadow-[#009FE3]/5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-4 items-start"
              >
                {/* Thumbnail */}
                {coverUrl ? (
                  <div className="w-full sm:w-32 h-24 shrink-0 rounded-xl overflow-hidden bg-[#001424]">
                    <img
                      src={coverUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-32 h-24 shrink-0 rounded-xl bg-gradient-to-br from-[#001424] to-[#002B49] flex items-center justify-center text-xl">
                    📰
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${categoryStyle}`}>
                        {item.category || 'Allgemein'}
                      </span>
                      {item.is_pinned && (
                        <span className="inline-flex items-center text-[11px] font-bold text-[#c2360a] bg-[#fff7ed] border border-[#fdba74] px-2 py-0.5 rounded-md">
                          <Pin className="w-3 h-3 mr-1 fill-current" />
                          Angeheftet
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#009FE3] transition-colors leading-snug line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                      {item.summary || item.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-700">{item.author_name}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>

                    <span className="flex items-center space-x-1 text-[#009FE3] font-bold group-hover:translate-x-1 transition-transform">
                      <span>Lesen</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Widget Footer */}
      <div className="pt-2 text-center">
        <Link
          to="/announcements"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#009FE3] hover:text-[#0070A8] transition-colors"
        >
          <span>Zur vollständigen Mitteilungszentrale</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Detail Modal */}
      {activeDetailNews && (
        <NewsDetailModal
          news={activeDetailNews}
          isAdmin={isAdmin}
          onClose={() => setActiveDetailNews(null)}
        />
      )}

      {/* SuperAdmin Form Modal */}
      {formModalOpen && (
        <NewsFormModal
          onClose={() => setFormModalOpen(false)}
          onSaved={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
