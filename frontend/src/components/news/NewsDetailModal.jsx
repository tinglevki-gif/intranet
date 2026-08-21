import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Pin, Clock, Eye, Share2, Check, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getNewsCoverUrl, getAvatarUrl } from '../../services/api';
import { getCategoryBadgeStyle } from '../common/Badge';
import { MarkdownRenderer } from './MarkdownRenderer';

export function NewsDetailModal({ 
  news, 
  onClose, 
  isAdmin = false, 
  onEdit = null, 
  onDelete = null 
}) {
  const { t, formatDate } = useLanguage();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!news) return null;

  const coverUrl = getNewsCoverUrl(news.cover_image);
  const avatarUrl = getAvatarUrl(news.author_avatar);
  const categoryStyle = getCategoryBadgeStyle(news.category);
  const dateStr = formatDate(news.created_at || Date.now(), { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/announcements?id=${news.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-100/80 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Cover Image Section */}
        {coverUrl ? (
          <div className="relative h-56 sm:h-72 w-full bg-slate-900 overflow-hidden shrink-0">
            <img
              src={coverUrl}
              alt={news.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 bg-slate-950/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badges on Hero */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${categoryStyle}`}>
                  {news.category || 'Allgemein'}
                </span>
                {news.is_pinned && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                    <Pin className="w-3.5 h-3.5 mr-1 fill-current" />
                    {t('news.pinned', 'Wichtig / Angeheftet')}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 text-xs text-white/90 font-medium">
                <div className="flex items-center space-x-1 bg-slate-950/50 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{news.read_time_minutes || 1} Min. Lesezeit</span>
                </div>
                {news.views_count > 0 && (
                  <div className="flex items-center space-x-1 bg-slate-950/50 backdrop-blur-md px-2.5 py-1 rounded-full">
                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                    <span>{news.views_count} Aufrufe</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${categoryStyle}`}>
                {news.category || 'Allgemein'}
              </span>
              {news.is_pinned && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                  <Pin className="w-3.5 h-3.5 mr-1 fill-current" />
                  {t('news.pinned', 'Wichtig / Angeheftet')}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Article Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {news.title}
          </h1>

          {/* Excerpt / Summary Banner */}
          {news.summary && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-slate-700 text-sm font-medium leading-relaxed italic">
              {news.summary}
            </div>
          )}

          {/* Author & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 border-y border-slate-100 text-xs text-slate-500">
            <div className="flex items-center space-x-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={news.author_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {news.author_name ? news.author_name.charAt(0) : 'U'}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900 text-sm">{news.author_name}</p>
                <p className="text-slate-400">{news.author_department || 'Tiglev Elementfabrik'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Render Full Markdown Content */}
          <div className="py-2">
            <MarkdownRenderer content={news.content} />
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">{t('news.link_copied', 'Link kopiert!')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t('news.share_link', 'Link teilen')}</span>
                </>
              )}
            </button>

            {isAdmin && (
              <>
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(news);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t('news.edit', 'Bearbeiten')}</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onClose();
                      onDelete(news);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('news.delete', 'Löschen')}</span>
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            {t('common.close', 'Schließen')}
          </button>
        </div>
      </div>
    </div>
  );
}
