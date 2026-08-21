import React, { useState } from 'react';
import {
  X,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

export function SubscribeModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const feedUrl = api.getIcsFeedUrl();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {t('calendar.subscribe_modal_title')}
              </h3>
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                iCalendar RFC 5545 Sync
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {t('calendar.subscribe_modal_desc')}
          </p>

          {/* URL Box with 1-Click Copy */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
              {t('calendar.feed_url_label')}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t('calendar.copy_feed_url')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
            <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>{t('calendar.instructions_title')}</span>
            </h4>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-purple-600">•</span>
                <span><strong>Outlook:</strong> {t('calendar.instructions_outlook')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-purple-600">•</span>
                <span><strong>Google Kalender:</strong> {t('calendar.instructions_google')}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-purple-600">•</span>
                <span><strong>Apple Calendar:</strong> {t('calendar.instructions_apple')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            {t('calendar.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
