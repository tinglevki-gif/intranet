import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  FileText,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNews } from '../context/NewsContext';
import { useLanguage } from '../context/LanguageContext';
import { NewsCard } from '../components/news/NewsCard';
import { NewsDetailModal } from '../components/news/NewsDetailModal';
import { NewsFormModal } from '../components/news/NewsFormModal';
import { DeleteNewsModal } from '../components/news/DeleteNewsModal';

const CATEGORY_FILTERS = [
  { key: 'ALL', label: 'Alle Kategorien', icon: '🌐' },
  { key: 'Allgemein', label: 'Allgemein', icon: '🏢' },
  { key: 'IT-Sicherheit', label: 'IT-Sicherheit', icon: '🔒' },
  { key: 'HR-Update', label: 'HR-Update', icon: '🌴' },
  { key: 'Event', label: 'Events', icon: '🎉' },
  { key: 'Produktion & Technik', label: 'Produktion & Technik', icon: '🏗️' },
  { key: 'Wichtig', label: 'Wichtige Eilmeldungen', icon: '⚡' },
];

export function AnnouncementsPage() {
  const { t } = useLanguage();
  const { user, hasRole } = useAuth();
  const { markAllAsRead, refreshNews } = useNews();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = hasRole('ADMIN');

  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeDetailNews, setActiveDetailNews] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState(null);
  const [deleteModalNews, setDeleteModalNews] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getNews();
      setNewsList(data || []);
      markAllAsRead();

      // Check if URL contains direct news ID param
      const newsIdParam = searchParams.get('id');
      if (newsIdParam && data) {
        const target = data.find((n) => n.id === parseInt(newsIdParam, 10));
        if (target) setActiveDetailNews(target);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Nachrichten:', err);
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Filtered news calculation
  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      // Category match
      let matchCat = true;
      if (selectedCategory !== 'ALL') {
        matchCat = (item.category || '').toLowerCase().includes(selectedCategory.toLowerCase());
      }

      // Search match
      let matchSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = (item.title || '').toLowerCase().includes(q);
        const inSummary = (item.summary || '').toLowerCase().includes(q);
        const inContent = (item.content || '').toLowerCase().includes(q);
        const inAuthor = (item.author_name || '').toLowerCase().includes(q);
        matchSearch = inTitle || inSummary || inContent || inAuthor;
      }

      return matchCat && matchSearch;
    });
  }, [newsList, selectedCategory, searchQuery]);

  // Statistics
  const pinnedCount = useMemo(() => newsList.filter((n) => n.is_pinned).length, [newsList]);

  const handleCreateNew = () => {
    setNewsToEdit(null);
    setFormModalOpen(true);
  };

  const handleEdit = (news) => {
    setNewsToEdit(news);
    setFormModalOpen(true);
  };

  const handleDelete = (news) => {
    setDeleteModalNews(news);
  };

  const handleSaved = (savedNews) => {
    loadNews();
    showToast(newsToEdit ? 'Beitrag erfolgreich aktualisiert!' : 'Neuer Beitrag erfolgreich veröffentlicht!');
  };

  const handleDeleted = (deletedId) => {
    setNewsList((prev) => prev.filter((n) => n.id !== deletedId));
    if (activeDetailNews && activeDetailNews.id === deletedId) {
      setActiveDetailNews(null);
    }
    showToast('Beitrag erfolgreich gelöscht.');
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-300">
              <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Unternehmenskommunikation & Bekanntmachungen</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Mitteilungszentrale & News
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Zentrale Plattform für offizielle Ankündigungen der Geschäftsleitung, Sicherheitsupdates, Personalmitteilungen und Eventberichte der Tiglev Elementfabrik.
            </p>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3 pt-2 flex-wrap text-xs font-medium">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span><strong>{newsList.length}</strong> Beiträge gesamt</span>
              </div>

              {pinnedCount > 0 && (
                <div className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-300 flex items-center space-x-1.5 font-semibold">
                  <Pin className="w-3.5 h-3.5 fill-current" />
                  <span><strong>{pinnedCount}</strong> Wichtig / Angeheftet</span>
                </div>
              )}
            </div>
          </div>

          {/* SuperAdmin Action Button */}
          {isAdmin && (
            <div className="shrink-0">
              <button
                onClick={handleCreateNew}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Neuen Beitrag erstellen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls: Search Bar & Category Pills */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nachrichten nach Stichwort, Thema oder Autor durchsuchen..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-xs text-slate-500 font-medium shrink-0 flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>{filteredNews.length} {filteredNews.length === 1 ? 'Beitrag gefunden' : 'Beiträge gefunden'}</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORY_FILTERS.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm scale-[1.02]'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-card">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium text-slate-500">Unternehmensnachrichten werden geladen...</p>
        </div>
      ) : error ? (
        <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl border border-rose-100 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Fehler beim Laden</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={loadNews}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Erneut versuchen</span>
          </button>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Keine Mitteilungen gefunden</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Für die gewählten Filter oder den Suchbegriff „{searchQuery}“ liegen keine Einträge vor.
            </p>
          </div>
          {(selectedCategory !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : (
        /* News Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, index) => (
            <NewsCard
              key={item.id}
              news={item}
              isAdmin={isAdmin}
              featured={index === 0 && selectedCategory === 'ALL' && !searchQuery}
              onClick={(n) => setActiveDetailNews(n)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Detail Article Modal */}
      {activeDetailNews && (
        <NewsDetailModal
          news={activeDetailNews}
          isAdmin={isAdmin}
          onClose={() => setActiveDetailNews(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create / Edit Modal */}
      {formModalOpen && (
        <NewsFormModal
          newsToEdit={newsToEdit}
          onClose={() => {
            setFormModalOpen(false);
            setNewsToEdit(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalNews && (
        <DeleteNewsModal
          news={deleteModalNews}
          onClose={() => setDeleteModalNews(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
