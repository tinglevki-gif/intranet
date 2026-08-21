import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

export function DeleteNewsModal({ news, onClose, onDeleted }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!news) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.deleteNews(news.id);
      onDeleted(news.id);
      onClose();
    } catch (err) {
      console.error('Fehler beim Löschen des Beitrags:', err);
      setError(err.message || 'Fehler beim Löschen des Beitrags.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-slate-900">
            {t('news.delete_confirm_title', 'Beitrag wirklich löschen?')}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Möchten Sie den Beitrag <strong className="text-slate-800">„{news.title}“</strong> unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {t('common.cancel', 'Abbrechen')}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Löschen...</span>
              </>
            ) : (
              <span>Ja, löschen</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
