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
  Scan
} from 'lucide-react';

export function DocumentsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedDocModal, setSelectedDocModal] = useState(null);

  // AI Search State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Upload State (SuperAdmin only)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('GENERAL');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { key: 'ALL', label: t('documents.cat_ALL') },
    { key: 'HR', label: t('documents.cat_HR') },
    { key: 'IT_POLICIES', label: t('documents.cat_IT_POLICIES') },
    { key: 'FINANCE', label: t('documents.cat_FINANCE') },
    { key: 'GENERAL', label: t('documents.cat_GENERAL') },
    { key: 'BRAND', label: t('documents.cat_BRAND') },
  ];

  const presetQuestions = [
    t('documents.ai_prompt_suggestion_1'),
    t('documents.ai_prompt_suggestion_2'),
    t('documents.ai_prompt_suggestion_3'),
    t('documents.ai_prompt_suggestion_4'),
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

  // Handle File Upload (SuperAdmin only)
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!isSuperAdmin) {
      alert('Ausschließlich Benutzer mit der Rolle SuperAdmin dürfen neue Dokumente hochladen.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadDocument(file, uploadCategory);
      setToastMessage(`${t('documents.upload_success_toast')}: ${res.original_name}`);
      setTimeout(() => setToastMessage(null), 4000);
      loadDocuments();
    } catch (err) {
      alert(err.message || t('documents.upload_error_toast'));
    } finally {
      setIsUploading(false);
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
    if (!window.confirm(t('documents.delete_confirm'))) return;
    try {
      await api.deleteDocument(docId);
      setToastMessage(t('documents.deleted_toast'));
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
    if (tLower === 'pdf') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (tLower === 'docx') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (tLower === 'xlsx' || tLower === 'csv') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('documents.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('documents.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-xs font-semibold">
          {isSuperAdmin ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SuperAdmin (Vollzugriff)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Lese- & Download-Zugriff</span>
            </span>
          )}

          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {documents.length} Dokumente indiziert
          </span>
        </div>
      </div>

      {/* 1. INTELLIGENT AI SEARCH ASSISTANT (RAG) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {t('documents.ai_search_title')}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {t('documents.ai_search_desc')}
              </p>
            </div>
          </div>

          {/* Search Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAISearch();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder={t('documents.ai_search_placeholder')}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-purple-500/30 rounded-2xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 disabled:opacity-50 shrink-0"
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

          {/* Prompt Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80 flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('documents.ai_prompt_suggestions_label')}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiQuery(q);
                    handleAISearch(q);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-slate-200 hover:text-white transition-all text-left flex items-center space-x-1.5"
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Box */}
          {aiResult && (
            <div className="mt-6 bg-slate-900/90 rounded-2xl p-6 border border-purple-500/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('documents.ai_answer_heading')}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {aiResult.source_count} Quellen analysiert • KI: {aiResult.ai_model || 'Gemini Pro'}
                </span>
              </div>

              {/* Synthesized Answer Text */}
              <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans bg-purple-950/40 p-4 rounded-xl border border-purple-500/20 whitespace-pre-line">
                {aiResult.answer}
              </div>

              {/* Source Documents Reference Cards */}
              {aiResult.results && aiResult.results.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('documents.ai_sources_label')}
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DRAG & DROP UPLOAD ZONE (STRICTLY SUPERADMIN ONLY) */}
      {/* ========================================================= */}
      {isSuperAdmin && (
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`bg-white rounded-3xl p-6 sm:p-8 border-2 border-dashed transition-all duration-200 shadow-card ${
            dragActive 
              ? 'border-amber-500 bg-amber-50/40 scale-[1.01]' 
              : 'border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>SuperAdmin Upload</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {t('documents.upload_drag_title')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('documents.upload_drag_subtitle')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Unterstützte Formate: PDF (digital & gescannt), Scans & Fotos (PNG, JPG, TIFF, WEBP), DOCX, TXT, CSV, XLSX
              </p>
            </div>

            {/* Category Selector */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-semibold">{t('documents.upload_category_label')}:</span>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="GENERAL">Automatisch erkennen (KI / OCR)</option>
                <option value="HR">{t('documents.cat_HR')}</option>
                <option value="IT_POLICIES">{t('documents.cat_IT_POLICIES')}</option>
                <option value="FINANCE">{t('documents.cat_FINANCE')}</option>
                <option value="BRAND">{t('documents.cat_BRAND')}</option>
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
              disabled={isUploading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>OCR-Textextraktion & KI-Analyse läuft...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{t('documents.upload_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. DOCUMENTS DIRECTORY TABLE */}
      <div className="space-y-4">
        {/* Category Tabs & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.key
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Name, Rechnungs-Nr, Typ oder Metadaten suchen..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table Rendering */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">{t('common.loading')}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 text-slate-400 text-sm">
            Keine Dokumente in dieser Kategorie gefunden.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t('documents.table_name')}</th>
                    <th className="px-6 py-4">Dokumenttyp & Analyse</th>
                    <th className="px-6 py-4">{t('documents.table_category')}</th>
                    <th className="px-6 py-4">{t('documents.table_size')}</th>
                    <th className="px-6 py-4">{t('documents.table_uploader')}</th>
                    <th className="px-6 py-4">{t('documents.table_date')}</th>
                    <th className="px-6 py-4 text-right">{t('documents.table_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getFormatBadge(doc.file_type)}`}>
                              {doc.file_type}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <p 
                                  className="font-bold text-slate-900 text-sm hover:text-amber-600 cursor-pointer truncate max-w-xs" 
                                  onClick={() => setSelectedDocModal(doc)}
                                >
                                  {doc.original_name}
                                </p>
                                {doc.ocr_applied && (
                                  <span 
                                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200"
                                    title={`OCR angewendet (Konfidenz: ${Math.round(doc.ocr_confidence || 90)}%)`}
                                  >
                                    <Scan className="w-3 h-3 text-purple-600" />
                                    <span>OCR {Math.round(doc.ocr_confidence || 90)}%</span>
                                  </span>
                                )}
                              </div>
                              {doc.summary && (
                                <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                                  {doc.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{doc.doc_type || 'Allgemeines Dokument'}</span>
                            </span>
                            {metaObj && metaObj.amounts_found && metaObj.amounts_found.length > 0 && (
                              <p className="text-[10px] font-mono text-emerald-700 font-bold">
                                {metaObj.amounts_found.join(', ')}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {t(`documents.cat_${doc.category}`, doc.category)}
                            </span>
                            {doc.folder_path && (
                              <p className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                                <Folder className="w-2.5 h-2.5 text-slate-400" />
                                <span>{doc.folder_path}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-600">
                          {formatFileSize(doc.file_size)}
                        </td>

                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {doc.uploader_name || 'System'}
                        </td>

                        <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                          {new Date(doc.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Inspect Metadata / OCR Preview Button */}
                            <button
                              onClick={() => setSelectedDocModal(doc)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-all shadow-2xs"
                              title="Dokumentendetails & OCR-Metadaten ansehen"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDownload(doc.id)}
                              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white transition-all shadow-2xs"
                              title={t('documents.download')}
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Delete Button STRICTLY SuperAdmin Only */}
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Dokument löschen (SuperAdmin)"
                              >
                                <Trash2 className="w-4 h-4" />
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
      {/* 4. METADATA & OCR DETAIL INSPECTION MODAL */}
      {/* ========================================================= */}
      {selectedDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white truncate max-w-md">
                    {selectedDocModal.original_name}
                  </h3>
                  <p className="text-xs text-purple-200/80">
                    Dokumentenanalyse & Strukturierte Metadaten
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDocModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Classification & OCR Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Erkannter Typ</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {selectedDocModal.doc_type || 'Allgemein'}
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100">
                  <span className="text-[10px] uppercase font-bold text-purple-600">OCR-Status</span>
                  <p className="text-xs font-bold text-purple-900 mt-1 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{selectedDocModal.ocr_applied ? `Aktiv (${Math.round(selectedDocModal.ocr_confidence || 90)}%)` : 'Digitaler Text'}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Kategorie</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {selectedDocModal.category}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Dateigröße</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 font-mono">
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
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Extrahierte Metadaten & Entitäten</span>
                    </h4>

                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3 text-xs">
                      {meta?.dates_found && meta.dates_found.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-slate-500 font-medium">Erkannte Datumsangaben:</span>
                          <div className="flex flex-wrap gap-1">
                            {meta.dates_found.map((d, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-mono text-[11px] font-semibold">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {meta?.amounts_found && meta.amounts_found.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-slate-500 font-medium">Geldbeträge / Summen:</span>
                          <div className="flex flex-wrap gap-1">
                            {meta.amounts_found.map((a, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-mono text-[11px] font-bold">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {meta?.invoice_numbers && meta.invoice_numbers.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-slate-500 font-medium">Rechnungs- / Belegnummern:</span>
                          <div className="flex flex-wrap gap-1">
                            {meta.invoice_numbers.map((n, i) => (
                              <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-mono text-[11px] font-bold">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {meta?.iban_found && meta.iban_found.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="text-slate-500 font-medium">Erkannte IBAN:</span>
                          <div className="flex flex-wrap gap-1">
                            {meta.iban_found.map((ib, i) => (
                              <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md font-mono text-[11px]">
                                {ib}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDocModal.folder_path && (
                        <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/50">
                          <Folder className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-slate-500 font-medium">Automatischer Zielordner:</span>
                          <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
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
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Automatische Zusammenfassung
                  </h4>
                  <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl text-xs text-slate-700 leading-relaxed">
                    {selectedDocModal.summary}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: #{selectedDocModal.id} • {selectedDocModal.file_type.toUpperCase()}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedDocModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
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
