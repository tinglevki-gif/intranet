import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  X,
  Users,
  FileText,
  Wrench,
  Megaphone,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Loader2,
  Sparkles,
  Command,
  Utensils,
  Navigation,
  TrendingUp,
  Layers,
  Briefcase,
  CalendarClock,
  ShieldCheck,
  GraduationCap,
  Network,
  Calendar,
  FolderGit2,
  LifeBuoy,
  Sliders
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  Navigation,
  TrendingUp,
  Layers,
  Briefcase,
  CalendarClock,
  ShieldCheck,
  GraduationCap,
  Phone,
  Network,
  Calendar,
  FolderGit2,
  LifeBuoy,
  Sliders,
  Users,
  FileText,
  Megaphone,
  Wrench
};

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'employees' | 'documents' | 'tools' | 'news'
  
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.globalSearch(query.trim());
        setResults(data);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (url) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const renderToolIcon = (iconName) => {
    const IconComp = ICON_MAP[iconName] || Wrench;
    return <IconComp className="w-4 h-4 text-[#009FE3]" />;
  };

  const hasResults = results && (
    results.employees?.length > 0 ||
    results.documents?.length > 0 ||
    results.tools?.length > 0 ||
    results.news?.length > 0
  );

  return (
    <div className="relative w-full max-w-lg hidden sm:block" ref={searchContainerRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={t('navbar.search_placeholder', 'Mitarbeiter, Dokumente, Tools oder News suchen...')}
          className="w-full pl-10 pr-20 py-2 text-xs md:text-sm bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-[#009FE3] focus:ring-2 focus:ring-[#009FE3]/20 transition-all outline-none shadow-2xs"
        />

        {/* Right side controls (Loading / Clear / Keyboard Shortcut) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-[#009FE3] animate-spin" />
          ) : query ? (
            <button
              onClick={clearSearch}
              type="button"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center space-x-0.5 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Results Dropdown Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] flex flex-col">
          {/* Filter Tabs Header */}
          <div className="flex items-center space-x-1 p-2 bg-slate-50/90 border-b border-slate-100 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-white text-[#001E36] shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Alle Treffer {results ? `(${results.total_count})` : ''}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center space-x-1.5 ${
                activeTab === 'employees'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mitarbeiter {results?.employees?.length ? `(${results.employees.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center space-x-1.5 ${
                activeTab === 'documents'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dokumente {results?.documents?.length ? `(${results.documents.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center space-x-1.5 ${
                activeTab === 'tools'
                  ? 'bg-white text-[#009FE3] shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-[#009FE3]" />
              <span>Tools {results?.tools?.length ? `(${results.tools.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('news')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center space-x-1.5 ${
                activeTab === 'news'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-500" />
              <span>News {results?.news?.length ? `(${results.news.length})` : ''}</span>
            </button>
          </div>

          {/* Results List Body */}
          <div className="overflow-y-auto p-3 space-y-4 max-h-[60vh] divide-y divide-slate-100">
            {loading && !results && (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 text-[#009FE3] animate-spin" />
                <span>Durchsuche Mitarbeiter, Dokumente, Tools und Mitteilungen...</span>
              </div>
            )}

            {!loading && results && !hasResults && (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700">Keine Treffer für „{query}“ gefunden</p>
                <p className="text-xs text-slate-400">
                  Überprüfen Sie die Schreibweise oder suchen Sie nach allgemeinen Begriffen wie z. B. „Kantine“, „Vertrieb“, „Sicherheit“ oder einem Nachnamen.
                </p>
              </div>
            )}

            {results && hasResults && (
              <>
                {/* 1. TOOLS & APPS SECTION */}
                {(activeTab === 'all' || activeTab === 'tools') && results.tools?.length > 0 && (
                  <div className="pt-2 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span className="flex items-center space-x-1.5 text-[#009FE3]">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Tools & Intranet-Module</span>
                      </span>
                      <span>{results.tools.length}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {results.tools.map((tool) => (
                        <div
                          key={tool.id}
                          onClick={() => handleSelectResult(tool.url)}
                          className="flex items-start justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              {renderToolIcon(tool.icon)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#009FE3] transition-colors truncate">
                                  {tool.title}
                                </h4>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  {tool.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tool.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#009FE3] group-hover:translate-x-0.5 transition-all shrink-0 mt-1.5 ml-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. EMPLOYEES SECTION */}
                {(activeTab === 'all' || activeTab === 'employees') && results.employees?.length > 0 && (
                  <div className="pt-2 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span className="flex items-center space-x-1.5 text-indigo-600">
                        <Users className="w-3.5 h-3.5" />
                        <span>Mitarbeiter & Kontakte</span>
                      </span>
                      <span>{results.employees.length}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {results.employees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectResult(emp.url)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {emp.avatar_url ? (
                              <img
                                src={emp.avatar_url}
                                alt={emp.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {emp.name}
                                </h4>
                                {emp.department && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {emp.department}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5 truncate">
                                {emp.job_title && <span>{emp.job_title}</span>}
                                {emp.phone && (
                                  <span className="flex items-center space-x-1 font-mono text-slate-700">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{emp.phone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1 shrink-0 ml-2">
                            <span>Profil</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. DOCUMENTS SECTION */}
                {(activeTab === 'all' || activeTab === 'documents') && results.documents?.length > 0 && (
                  <div className="pt-2 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span className="flex items-center space-x-1.5 text-emerald-600">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Dokumente & OCR-Texte</span>
                      </span>
                      <span>{results.documents.length}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {results.documents.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectResult(doc.url)}
                          className="flex items-start justify-between p-2.5 rounded-xl hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                  {doc.title}
                                </h4>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                                  {doc.file_type}
                                </span>
                              </div>
                              {doc.summary && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{doc.summary}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center space-x-1 shrink-0 ml-2 mt-1">
                            <span>Öffnen</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. NEWS SECTION */}
                {(activeTab === 'all' || activeTab === 'news') && results.news?.length > 0 && (
                  <div className="pt-2 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <span className="flex items-center space-x-1.5 text-amber-600">
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>News & Mitteilungen</span>
                      </span>
                      <span>{results.news.length}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {results.news.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleSelectResult(n.url)}
                          className="flex items-start justify-between p-2.5 rounded-xl hover:bg-amber-50/50 border border-transparent hover:border-amber-100 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Megaphone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                                  {n.title}
                                </h4>
                                {n.is_pinned && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                    Wichtig
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{n.content_snippet}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2 mt-1">{n.created_at}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar with Keyboard Navigation Hints */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#009FE3]" />
              <span>Echtzeit-Index über die gesamte Intranet-Plattform</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded text-[9px]">ESC</kbd>
                <span>Schließen</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearchBar;
