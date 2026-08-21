import React from 'react';
import { X, Calendar, User, Pin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CategoryBadge } from '../common/Badge';

export function AnnouncementModal({ announcement, onClose }) {
  const { t, formatDate } = useLanguage();
  if (!announcement) return null;

  const formattedDate = formatDate(announcement.created_at || Date.now());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image if available */}
        {announcement.cover_image && (
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900">
            <img
              src={announcement.cover_image}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal content body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
          {!announcement.cover_image && (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <CategoryBadge category={announcement.category} />
            {announcement.is_pinned && (
              <span className="inline-flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                <Pin className="w-3 h-3 mr-1" />
                {t('announcements.pinned')}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
            {announcement.title}
          </h2>

          <div className="flex items-center space-x-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">{announcement.author_name}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Content markdown-like text */}
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
            {announcement.content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            {t('announcements.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
