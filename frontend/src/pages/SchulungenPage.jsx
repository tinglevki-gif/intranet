import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Bot, 
  Send, 
  Search, 
  Download, 
  Trash2, 
  Upload, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  User, 
  Layers, 
  ExternalLink, 
  RotateCcw, 
  Clock, 
  ShieldAlert, 
  X,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function SchulungenPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('chat'); // 'manuals' or 'chat'
  const [manuals, setManuals] = useState([]);
  const [loadingManuals, setLoadingManuals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Software-Bedienung');
  const [uploadVersion, setUploadVersion] = useState('1.0');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Willkommen beim **Tiglev KI-Schulungsassistenten**! 🏗️\n\nIch beantworte Ihre Fragen zu unseren Arbeitsabläufen, Software-Modulen (z. B. *Abwicklung*, *Planung*), Urlaubsrichtlinien, UVV-Arbeitssicherheit und IT-Themen. Alle Antworten basieren direkt auf den verifizierten Firmenhandbüchern der Tiglev Elementfabrik.',
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  const categories = [
    { key: 'ALL', label: t('schulungen.cat_ALL') },
    { key: 'Software-Bedienung', label: t('schulungen.cat_SOFTWARE') },
    { key: 'Onboarding', label: t('schulungen.cat_ONBOARDING') },
    { key: 'Arbeitssicherheit', label: t('schulungen.cat_SAFETY') },
    { key: 'IT-Leitfäden', label: t('schulungen.cat_IT_GUIDES') },
    { key: 'Allgemein', label: t('schulungen.cat_GENERAL') },
  ];

  const promptSuggestions = [
    'Wie bediene ich das Modul Abwicklung?',
    'Wie erstelle ich einen Urlaubsantrag?',
    'Welche Sicherheitsregeln gelten im Werk Tinglev?',
    'Wie richte ich die 2FA für das VPN ein?',
  ];

  const loadManuals = async () => {
    try {
      setLoadingManuals(true);
      const data = await api.getSchulungen(searchQuery, selectedCategory);
      setManuals(data || []);
    } catch (err) {
      console.error('Error loading training manuals:', err);
    } finally {
      setLoadingManuals(false);
    }
  };

  useEffect(() => {
    loadManuals();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isThinking]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isThinking) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      sources: []
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsThinking(true);

    try {
      const chatHistory = chatMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await api.chatSchulungen(textToSend.trim(), null, chatHistory);

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        sources: res.sources || []
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error in chat:', err);
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ Entschuldigung, bei der Bearbeitung Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
        sources: []
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('title', uploadTitle);
    if (uploadDesc) formData.append('description', uploadDesc);
    formData.append('category', uploadCategory);
    formData.append('version', uploadVersion);
    formData.append('file', uploadFile);

    try {
      await api.uploadSchulungDocument(formData);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFile(null);
      loadManuals();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteManual = async (docId, title) => {
    if (window.confirm(`Möchten Sie das Schulungshandbuch "${title}" wirklich löschen?`)) {
      try {
        await api.deleteSchulungDocument(docId);
        loadManuals();
      } catch (err) {
        alert(err.message || 'Fehler beim Löschen');
      }
    }
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Software-Bedienung':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Onboarding':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Arbeitssicherheit':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IT-Leitfäden':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('schulungen.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('schulungen.subtitle')}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-700 shadow-md shadow-emerald-700/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{t('schulungen.tab_chat')}</span>
          </button>
          <button
            onClick={() => setActiveTab('manuals')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manuals'
                ? 'bg-white text-indigo-700 shadow-md shadow-indigo-700/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>{t('schulungen.tab_manuals')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE AI TRAINING CHATBOT */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card flex flex-col h-[700px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t('schulungen.chat_title')}</h3>
                <p className="text-[11px] text-emerald-300 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                  <span>RAG-Wissensdatenbank bereit • Stand {manuals.length} Handbücher</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setChatMessages([chatMessages[0]])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 flex items-center space-x-1.5 transition-colors"
              title="Chatverlauf zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('schulungen.clear_chat')}</span>
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/40">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                <div className="flex items-start space-x-2.5 max-w-2xl">
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Cited Sources for Bot Message */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>{t('schulungen.sources_title')}</span>
                        </p>

                        <div className="space-y-1.5">
                          {msg.sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-emerald-50/50 transition-colors"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-slate-800">{src.document_title}</span>
                                  <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                                    (Seite {src.page_number})
                                  </span>
                                </div>
                              </div>

                              <a
                                href={src.download_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border border-slate-200 text-[10px] font-bold flex items-center space-x-1 shrink-0 ml-2 transition-all shadow-2xs"
                              >
                                <span>Öffnen</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Typing Animation */}
            {isThinking && (
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-3xl rounded-bl-none shadow-sm flex items-center space-x-2 text-xs text-slate-500">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                  </div>
                  <span className="font-medium">{t('schulungen.thinking')}</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Vorschläge:</span>
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1 bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200/60 rounded-xl text-[11px] font-medium text-slate-600 whitespace-nowrap transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 bg-white border-t border-slate-100 flex items-center space-x-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('schulungen.chat_placeholder')}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isThinking}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t('schulungen.chat_send')}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MANUALS & TRAINING LIBRARY */}
      {activeTab === 'manuals' && (
        <div className="space-y-6">
          {/* Action Bar & Search */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('schulungen.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/20 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('schulungen.upload_btn')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Manuals Grid */}
          {loadingManuals ? (
            <div className="py-20 text-center text-slate-400 text-xs font-medium">
              Handbücher werden geladen...
            </div>
          ) : manuals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-card">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Keine Handbücher in dieser Kategorie gefunden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {manuals.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(doc.category)}`}>
                        {doc.category}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                        v{doc.version}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors mt-3">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                      {doc.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-400 text-[11px]">
                      <span>{doc.chunks_count} Abschnitte</span> • <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={api.getSchulungDownloadUrl(doc.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold transition-colors shadow-2xs"
                        title="Herunterladen"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('schulungen.download')}</span>
                      </a>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteManual(doc.id, doc.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SuperAdmin Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2.5">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">{t('schulungen.upload_modal_title')}</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('schulungen.title_label')}
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={t('schulungen.title_placeholder')}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('schulungen.category_label')}
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Software-Bedienung">Software-Bedienung</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Arbeitssicherheit">Arbeitssicherheit</option>
                    <option value="IT-Leitfäden">IT-Leitfäden</option>
                    <option value="Allgemein">Allgemein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {t('schulungen.version_label')}
                  </label>
                  <input
                    type="text"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {t('schulungen.desc_label')}
                </label>
                <textarea
                  rows={2}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder={t('schulungen.desc_placeholder')}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Datei (PDF, DOCX, TXT, MD)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('schulungen.cancel_btn')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {uploading ? t('schulungen.uploading') : t('schulungen.save_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
