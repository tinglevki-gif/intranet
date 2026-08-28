import React from 'react';
import { Pin, Clock, Eye, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getNewsCoverUrl } from '../../services/api';
import { getCategoryBadgeStyle } from '../common/Badge';
import { UserAvatar } from '../common/UserAvatar';

export function NewsCard({ 
  news, 
  onClick, 
  isAdmin = false, 
  onEdit = null, 
  onDelete = null,
  featured = false 
}) {
  const { t, formatDate } = useLanguage();

  const coverUrl = getNewsCoverUrl(news.cover_image);
  const categoryStyle = getCategoryBadgeStyle(news.category);
  const dateStr = formatDate(news.created_at || Date.now(), { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      onClick={() => onClick && onClick(news)}
      className={`group relative bg-white rounded-3xl border border-slate-100/90 hover:border-indigo-200 shadow-card hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative w-full h-48 sm:h-52 bg-slate-900 overflow-hidden shrink-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-center">
            <div className="space-y-1">
              <span className="text-3xl">📰</span>
              <p className="text-xs font-semibold text-indigo-300/80 tracking-wider uppercase">Tiglev News</p>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${categoryStyle}`}>
              {news.category || 'Allgemein'}
            </span>

            {news.is_pinned && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md animate-pulse">
                <Pin className="w-3 h-3 mr-1 fill-current" />
                {t('news.pinned', 'Wichtig / Angeheftet')}
              </span>
            )}
          </div>

          {/* SuperAdmin Quick Action Menu */}
          {isAdmin && (
            <div
              className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-md rounded-2xl p-1 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  onClick={() => onEdit(news)}
                  title={t('news.edit', 'Beitrag bearbeiten')}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(news)}
                  title={t('news.delete', 'Beitrag löschen')}
                  className="p-1.5 rounded-xl text-rose-300 hover:text-rose-100 hover:bg-rose-600/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom image metadata */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/90 font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-950/50 backdrop-blur-md px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3 text-indigo-300" />
            <span>{news.read_time_minutes || 1} Min. Lesezeit</span>
          </div>
          {news.views_count > 0 && (
            <div className="flex items-center space-x-1 bg-slate-950/50 backdrop-blur-md px-2 py-1 rounded-full">
              <Eye className="w-3 h-3 text-slate-300" />
              <span>{news.views_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {news.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 leading-relaxed">
            {news.summary || news.content}
          </p>
        </div>

        {/* Author Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <UserAvatar
              src={news.author_avatar}
              name={news.author_name}
              size="xs"
              rounded="rounded-full"
              className="ring-2 ring-indigo-50 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate leading-tight">{news.author_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{dateStr}</p>
            </div>
          </div>

          <span className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0">
            <span>{t('news.read_more', 'Lesen')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
