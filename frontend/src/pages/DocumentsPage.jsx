import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  FolderOpen, 
  Search, 
  Download, 
  FileText, 
  Upload, 
  Sparkles, 
  Bot, 
  Send, 
  Check, 
  AlertCircle, 
  Trash2, 
  Layers, 
  ShieldCheck, 
  ShieldAlert,
  Clock, 
  FileCode, 
  ExternalLink,
  HelpCircle,
  ChevronRight,
  Lock,
  Eye,
  Tag,
  Calendar,
  DollarSign,
  Folder,
  X,
  Scan,
  LayoutGrid,
  List,
  Filter,
  FileSpreadsheet,
  FileQuestion,
  ArrowUpDown,
  Maximize2
} from 'lucide-react';

export function DocumentsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedDocModal, setSelectedDocModal] = useState(null);

  // AI Search State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Upload & Live OCR Progress State (SuperAdmin only)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('');
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('GENERAL');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { key: 'ALL', label: t('documents.cat_ALL') || 'Alle Dokumente' },
    { key: 'HR', label: t('documents.cat_HR') || 'Personal & HR' },
    { key: 'IT_POLICIES', label: t('documents.cat_IT_POLICIES') || 'IT-Sicherheit & 2FA' },
    { key: 'FINANCE', label: t('documents.cat_FINANCE') || 'Finanzen & Spesen' },
    { key: 'GENERAL', label: t('documents.cat_GENERAL') || 'Compliance & Leitbilder' },
    { key: 'BRAND', label: t('documents.cat_BRAND') || 'Brand & Marketing Kit' },
  ];

  const presetQuestions = [
    t('documents.ai_prompt_suggestion_1') || 'Wie viele Tage Homeoffice sind pro Woche erlaubt?',
    t('documents.ai_prompt_suggestion_2') || 'Wie funktioniert die 2FA-Aktivierung für das VPN?',
    t('documents.ai_prompt_suggestion_3') || 'Welche Verpflegungspauschale gilt bei Dienstreisen?',
    t('documents.ai_prompt_suggestion_4') || 'Wie melde ich einen verdächtigen Phishing-Versuch?',
  ];

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments(activeCategory, 'ALL', searchQuery);
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeCategory, searchQuery]);

  // Handle AI Search Execution
  const handleAISearch = async (queryText) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;

    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.searchDocumentsAI(q.trim(), 4, activeCategory !== 'ALL' ? activeCategory : null);
      setAiResult(res);
    } catch (err) {
      console.error('AI search error:', err);
      setToastMessage('Fehler bei der KI-Suche: ' + (err.message || 'Serverfehler'));
    } finally {
      setAiLoading(false);
    }
  };

  // Handle File Upload with Live OCR Progress Counter
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!isSuperAdmin) {
      alert('Ausschließlich Benutzer mit der Rolle SuperAdmin dürfen neue Dokumente hochladen.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadingFileName(file.name);
    setUploadPhase('1/4 • Datei wird hochgeladen und validiert...');

    let currentPct = 10;
    const progressInterval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 6) + 3;
      if (currentPct > 92) {
        currentPct = 92;
      }
      setUploadProgress(currentPct);

      if (currentPct < 30) {
        setUploadPhase('1/4 • Datei wird hochgeladen und validiert...');
      } else if (currentPct < 60) {
        setUploadPhase('2/4 • PDF-Seitenrasterisierung (250 DPI) & Bildanalyse...');
      } else if (currentPct < 82) {
        setUploadPhase('3/4 • Tesseract OCR-Texterkennung (Deutsch & Englisch)...');
      } else {
        setUploadPhase('4/4 • KI-Klassifizierung & Strukturierte Metadaten-Extraktion...');
      }
    }, 320);

    try {
      const res = await api.uploadDocument(file, uploadCategory);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadPhase('✨ 100% • Fertiggestellt! Dokument katalogisiert und indiziert.');
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadPhase('');
        setUploadingFileName('');
        setToastMessage(`${t('documents.upload_success_toast') || 'Dokument erfolgreich hochgeladen'}: ${res.original_name}`);
        setTimeout(() => setToastMessage(null), 4000);
        loadDocuments();
      }, 700);
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadPhase('');
      setUploadingFileName('');
      alert(err.message || t('documents.upload_error_toast') || 'Fehler beim Hochladen der Datei');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    if (!isSuperAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    if (!isSuperAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = (docId) => {
    const url = api.getDownloadUrl(docId);
    window.open(url, '_blank');
  };

  const handleDelete = async (docId) => {
    if (!isSuperAdmin) {
      alert('Ausschließlich Benutzer mit der Rolle SuperAdmin dürfen Dokumente löschen.');
      return;
    }
    if (!window.confirm(t('documents.delete_confirm') || 'Möchten Sie dieses Dokument wirklich löschen?')) return;
    try {
      await api.deleteDocument(docId);
      setToastMessage(t('documents.deleted_toast') || 'Dokument wurde gelöscht');
      setTimeout(() => setToastMessage(null), 3000);
      loadDocuments();
      if (aiResult) setAiResult(null);
    } catch (err) {
      alert(err.message || 'Fehler beim Löschen des Dokuments');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFormatBadge = (type) => {
    const tLower = (type || '').toLowerCase();
    if (tLower === 'pdf') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    if (tLower === 'docx') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    if (tLower === 'xlsx' || tLower === 'csv') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 w-full max-w-full overflow-hidden">
      {/* ========================================================= */}
      {/* 1. FLUID HEADER BANNER                                    */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4 min-w-0">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight break-words">
              {t('documents.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {t('documents.subtitle')}
            </p>
          </div>
        </div>

        {/* Responsive Access & Count Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-semibold shrink-0">
          {isSuperAdmin ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SuperAdmin (Vollzugriff)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Lese- &amp; Download-Zugriff</span>
            </span>
          )}

          <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>{documents.length} Dokumente</span>
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. INTELLIGENT AI SEARCH ASSISTANT (RAG SECTION)           */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-2xl relative overflow-hidden transition-all">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 sm:space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight truncate">
                {t('documents.ai_search_title')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 line-clamp-2 sm:line-clamp-none">
                {t('documents.ai_search_desc')}
              </p>
            </div>
          </div>

          {/* Search Input Bar (Adaptive Form) */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAISearch();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1 min-w-0">
              <Bot className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder={t('documents.ai_search_placeholder')}
                className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 bg-slate-900/90 border border-purple-500/30 rounded-2xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="px-5 py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0"
            >
              {aiLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{t('documents.ai_search_button')}</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Prompt Suggestions Pills */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80 flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('documents.ai_prompt_suggestions_label')}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiQuery(q);
                    handleAISearch(q);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-slate-200 hover:text-white transition-all text-left flex items-center space-x-1.5 max-w-full break-words"
                >
                  <span className="truncate max-w-[280px] sm:max-w-md">{q}</span>
                  <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Box */}
          {aiResult && (
            <div className="mt-5 sm:mt-6 bg-slate-900/95 rounded-2xl p-4 sm:p-6 border border-purple-500/30 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('documents.ai_answer_label') || 'Synthetisierte KI-Antwort:'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {aiResult.source_count} Quellen analysiert • KI: {aiResult.ai_model || 'Gemini Pro'}
                </span>
              </div>

              {/* Synthesized Answer Text */}
              <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans bg-purple-950/40 p-3.5 sm:p-4 rounded-xl border border-purple-500/20 whitespace-pre-line break-words">
                {aiResult.answer}
              </div>

              {/* Source Documents Reference Cards Grid */}
              {aiResult.results && aiResult.results.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('documents.ai_citations_label') || 'Gefundene Zitate & Dokumentenquellen:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {aiResult.results.map((src, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between space-x-3 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{src.document_title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Relevanz: {Math.round(src.similarity_score * 100)}% {src.page_number && `• Seite ${src.page_number}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(src.document_id)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-purple-600 text-white transition-colors shrink-0"
                          title="Dokument öffnen"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ADAPTIVE DRAG & DROP UPLOAD ZONE (SUPERADMIN ONLY)     */}
      {/* ========================================================= */}
      {isSuperAdmin && (
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border-2 border-dashed transition-all duration-200 shadow-card ${
            dragActive 
              ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 scale-[1.01]' 
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="max-w-2xl mx-auto w-full">
            {isUploading ? (
              /* LIVE OCR PROGRESS TRACKER CARD */
              <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-amber-50/70 dark:from-indigo-950/40 dark:via-slate-900 dark:to-amber-950/30 rounded-3xl p-5 sm:p-8 border border-indigo-200/80 dark:border-indigo-800 shadow-lg text-center space-y-4 sm:space-y-5 animate-fade-in relative overflow-hidden">
                {/* Laser scanning beam animation */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <Scan className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1 max-w-full px-2">
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-700 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      <span>Echtzeit-Dokumentenanalyse &amp; OCR</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-sm mx-auto mt-1 font-mono">
                      {uploadingFileName || 'Dokument wird verarbeitet...'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-xs font-semibold px-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] sm:text-xs truncate max-w-[240px] text-left">
                      {uploadPhase}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="w-full bg-white/90 dark:bg-slate-800 rounded-full h-3.5 sm:h-4 p-0.5 sm:p-1 overflow-hidden border border-indigo-200/80 dark:border-indigo-700 shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 transition-all duration-300 ease-out shadow-xs relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* 4 Pipeline Step Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/60 text-[10px]">
                  <div className={`p-2 rounded-xl flex items-center space-x-1.5 font-bold transition-all ${
                    uploadProgress >= 20 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-white/80 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {uploadProgress >= 20 ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>}
                    <span className="truncate">1. Upload &amp; Check</span>
                  </div>

                  <div className={`p-2 rounded-xl flex items-center space-x-1.5 font-bold transition-all ${
                    uploadProgress >= 50 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : uploadProgress >= 20 ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 animate-pulse' : 'bg-white/80 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {uploadProgress >= 50 ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>}
                    <span className="truncate">2. Raster (250 DPI)</span>
                  </div>

                  <div className={`p-2 rounded-xl flex items-center space-x-1.5 font-bold transition-all ${
                    uploadProgress >= 80 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : uploadProgress >= 50 ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 animate-pulse' : 'bg-white/80 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {uploadProgress >= 80 ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>}
                    <span className="truncate">3. Tesseract OCR</span>
                  </div>

                  <div className={`p-2 rounded-xl flex items-center space-x-1.5 font-bold transition-all ${
                    uploadProgress >= 100 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : uploadProgress >= 80 ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 animate-pulse' : 'bg-white/80 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {uploadProgress >= 100 ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>}
                    <span className="truncate">4. KI-Klassifizierung</span>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD UPLOAD DROPZONE */
              <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
                  <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                <div className="max-w-md">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SuperAdmin Upload</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {t('documents.upload_drag_title')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('documents.upload_drag_subtitle')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unterstützte Formate: PDF (digital &amp; gescannt), Scans (PNG, JPG, TIFF, WEBP), DOCX, TXT, CSV, XLSX
                  </p>
                </div>

                {/* Fluid Category Selector & Upload Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full max-w-md pt-1">
                  <div className="flex items-center space-x-2 text-xs flex-1 min-w-0">
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 truncate"
                    >
                      <option value="GENERAL">Automatisch erkennen (KI / OCR)</option>
                      <option value="HR">{t('documents.cat_HR') || 'Personal & HR'}</option>
                      <option value="IT_POLICIES">{t('documents.cat_IT_POLICIES') || 'IT-Sicherheit & 2FA'}</option>
                      <option value="FINANCE">{t('documents.cat_FINANCE') || 'Finanzen & Spesen'}</option>
                      <option value="BRAND">{t('documents.cat_BRAND') || 'Brand & Marketing Kit'}</option>
                    </select>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.png,.jpg,.jpeg,.tiff,.tif,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t('documents.upload_btn')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. FLUID FILTER TOOLBAR & VIEW MODE SWITCHER             */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 transition-all">
          {/* Scrollable Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.key
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right Controls: Search bar & View mode toggle */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dokument suchen..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Switcher (Table / Cards) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Tabellenansicht"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Kartenansicht"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. DOCUMENTS DISPLAY: RESPONSIVE TABLE & CARD GRID        */}
        {/* ========================================================= */}
        {loading ? (
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">{t('common.loading')}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 text-slate-400 text-sm">
            Keine Dokumente in dieser Kategorie gefunden.
          </div>
        ) : viewMode === 'grid' ? (
          /* RESPONSIVE CARD GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {documents.map((doc) => {
              let metaObj = null;
              try {
                if (doc.extracted_metadata) {
                  metaObj = JSON.parse(doc.extracted_metadata);
                }
              } catch (e) {
                metaObj = null;
              }

              return (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getFormatBadge(doc.file_type)}`}>
                        {doc.file_type}
                      </span>
                      {doc.ocr_applied && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                          <Scan className="w-2.5 h-2.5" />
                          <span>OCR {Math.round(doc.ocr_confidence || 90)}%</span>
                        </span>
                      )}
                    </div>

                    {/* Document Title */}
                    <div>
                      <h3 
                        onClick={() => setSelectedDocModal(doc)}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 cursor-pointer line-clamp-2 leading-snug"
                        title={doc.original_name}
                      >
                        {doc.original_name}
                      </h3>
                      {doc.summary && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-1">
                          {doc.summary}
                        </p>
                      )}
                    </div>

                    {/* Tags & Metadata */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                          {doc.doc_type || 'Allgemeines Dokument'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t(`documents.cat_${doc.category}`, doc.category)}
                        </span>
                      </div>

                      {metaObj && metaObj.amounts_found && metaObj.amounts_found.length > 0 && (
                        <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold truncate">
                          Beträge: {metaObj.amounts_found.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Metadata & Action buttons */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">{formatFileSize(doc.file_size)}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setSelectedDocModal(doc)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                        title="Vorschau &amp; Metadaten"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-600 text-amber-700 dark:text-amber-300 hover:text-white transition-colors"
                        title="Herunterladen"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Löschen (SuperAdmin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* RESPONSIVE TABLE VIEW WITH HORIZONTAL SCROLLING */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden transition-all">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[680px] lg:min-w-full">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">{t('documents.table_name')}</th>
                    <th className="px-4 py-4">Dokumenttyp &amp; Analyse</th>
                    <th className="px-4 py-4">{t('documents.table_category')}</th>
                    <th className="px-4 py-4 hidden md:table-cell">{t('documents.table_size')}</th>
                    <th className="px-4 py-4 hidden lg:table-cell">{t('documents.table_uploader')}</th>
                    <th className="px-4 py-4 hidden sm:table-cell">{t('documents.table_date')}</th>
                    <th className="px-5 py-4 text-right">{t('documents.table_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {documents.map((doc) => {
                    let metaObj = null;
                    try {
                      if (doc.extracted_metadata) {
                        metaObj = JSON.parse(doc.extracted_metadata);
                      }
                    } catch (e) {
                      metaObj = null;
                    }

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Name + Format + Summary */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border shrink-0 ${getFormatBadge(doc.file_type)}`}>
                              {doc.file_type}
                            </span>
                            <div className="min-w-0 max-w-xs sm:max-w-sm lg:max-w-md">
                              <div className="flex items-center space-x-2">
                                <p 
                                  className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer truncate" 
                                  onClick={() => setSelectedDocModal(doc)}
                                  title={doc.original_name}
                                >
                                  {doc.original_name}
                                </p>
                                {doc.ocr_applied && (
                                  <span 
                                    className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800 shrink-0"
                                    title={`OCR angewendet (Konfidenz: ${Math.round(doc.ocr_confidence || 90)}%)`}
                                  >
                                    <Scan className="w-2.5 h-2.5 text-purple-600" />
                                    <span>OCR {Math.round(doc.ocr_confidence || 90)}%</span>
                                  </span>
                                )}
                              </div>
                              {doc.summary && (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {doc.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Doc Type & Amounts */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                              <Tag className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[120px]">{doc.doc_type || 'Allgemein'}</span>
                            </span>
                            {metaObj && metaObj.amounts_found && metaObj.amounts_found.length > 0 && (
                              <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-[120px]">
                                {metaObj.amounts_found.join(', ')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Category & Folder */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate inline-block max-w-[130px]">
                              {t(`documents.cat_${doc.category}`, doc.category)}
                            </span>
                            {doc.folder_path && (
                              <p className="text-[10px] font-mono text-slate-400 flex items-center space-x-1 truncate max-w-[130px]">
                                <Folder className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{doc.folder_path}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* File Size */}
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 hidden md:table-cell">
                          {formatFileSize(doc.file_size)}
                        </td>

                        {/* Uploader */}
                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium hidden lg:table-cell truncate max-w-[120px]">
                          {doc.uploader_name || 'System'}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] hidden sm:table-cell whitespace-nowrap">
                          {new Date(doc.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedDocModal(doc)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all shadow-2xs"
                              title="Dokumentendetails &amp; OCR-Metadaten ansehen"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownload(doc.id)}
                              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-600 text-amber-700 dark:text-amber-300 hover:text-white transition-all shadow-2xs"
                              title={t('documents.download')}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Dokument löschen (SuperAdmin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 6. METADATA & OCR DETAIL INSPECTION MODAL (RESPONSIVE)    */}
      {/* ========================================================= */}
      {selectedDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Scan className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md lg:max-w-lg">
                    {selectedDocModal.original_name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-purple-200/80 truncate">
                    Dokumentenvorschau (Seite 1) &amp; Strukturierte Metadaten-Analyse
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDocModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Responsive 2-Column Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN (5 Cols): Live First-Page Visual Preview */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center space-x-1.5">
                      <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Dokumentenvorschau (Seite 1)</span>
                    </span>
                    <a
                      href={api.getDownloadUrl(selectedDocModal.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <span>Vollbild</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Thumbnail Frame */}
                  <div className="relative group bg-slate-900/5 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[260px] sm:min-h-[340px] max-h-[440px] overflow-hidden shadow-inner">
                    <img
                      src={api.getPreviewUrl(selectedDocModal.id)}
                      alt={selectedDocModal.original_name}
                      className="w-full h-auto max-h-[420px] object-contain rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700 bg-white transition-transform group-hover:scale-[1.02] duration-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const fallbackEl = document.getElementById(`preview-fallback-${selectedDocModal.id}`);
                        if (fallbackEl) fallbackEl.style.display = 'flex';
                      }}
                    />

                    {/* Fallback if preview image not loadable */}
                    <div 
                      id={`preview-fallback-${selectedDocModal.id}`}
                      className="hidden flex-col items-center justify-center space-y-3 p-6 text-center"
                    >
                      <FileText className="w-14 h-14 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[220px] truncate">{selectedDocModal.original_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedDocModal.file_type.toUpperCase()} Dokument</p>
                      </div>
                      <a
                        href={api.getDownloadUrl(selectedDocModal.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-500 transition-colors"
                      >
                        Dokument öffnen
                      </a>
                    </div>
                  </div>

                  {/* Visual Status Under Preview */}
                  <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                    <span className="font-mono">{selectedDocModal.file_type.toUpperCase()} • {formatFileSize(selectedDocModal.file_size)}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Seite 1 gerendert</span>
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN (7 Cols): Metadata, Classification & Entities */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Classification & OCR Overview Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Erkannter Typ</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {selectedDocModal.doc_type || 'Allgemein'}
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-800">
                      <span className="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-300">OCR-Status</span>
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200 mt-0.5 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">{selectedDocModal.ocr_applied ? `Aktiv (${Math.round(selectedDocModal.ocr_confidence || 90)}%)` : 'Digitaler Text'}</span>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Kategorie</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {selectedDocModal.category}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Dateigröße</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        {formatFileSize(selectedDocModal.file_size)}
                      </p>
                    </div>
                  </div>

                  {/* Extracted Structured Entities */}
                  {(() => {
                    let meta = null;
                    try {
                      if (selectedDocModal.extracted_metadata) {
                        meta = JSON.parse(selectedDocModal.extracted_metadata);
                      }
                    } catch (e) {
                      meta = null;
                    }

                    return (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
                          <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Extrahierte Metadaten &amp; Entitäten</span>
                        </h4>

                        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs">
                          {meta?.dates_found && meta.dates_found.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className="text-slate-500 font-medium flex items-center space-x-1 shrink-0">
                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                <span>Erkannte Datumsangaben:</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {meta.dates_found.map((d, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-md font-mono text-[11px] font-semibold">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {meta?.amounts_found && meta.amounts_found.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className="text-slate-500 font-medium flex items-center space-x-1 shrink-0">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Geldbeträge / Summen:</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {meta.amounts_found.map((a, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md font-mono text-[11px] font-bold">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {meta?.invoice_numbers && meta.invoice_numbers.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className="text-slate-500 font-medium flex items-center space-x-1 shrink-0">
                                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                                <span>Rechnungs- &amp; Belegnummern:</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {meta.invoice_numbers.map((n, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md font-mono text-[11px] font-bold">
                                    {n}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {meta?.iban_found && meta.iban_found.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className="text-slate-500 font-medium flex items-center space-x-1 shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                                <span>Erkannte IBAN:</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {meta.iban_found.map((ib, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-md font-mono text-[11px] break-all">
                                    {ib}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedDocModal.folder_path && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-slate-500 font-medium flex items-center space-x-1 shrink-0">
                                <Folder className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Automatischer Zielordner:</span>
                              </span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 break-all text-[11px]">
                                uploads/documents/{selectedDocModal.folder_path}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Executive Summary */}
                  {selectedDocModal.summary && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Automatische Zusammenfassung
                      </h4>
                      <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                        {selectedDocModal.summary}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: #{selectedDocModal.id} • {selectedDocModal.file_type.toUpperCase()}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedDocModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                >
                  Schließen
                </button>

                <button
                  onClick={() => handleDownload(selectedDocModal.id)}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Herunterladen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;
