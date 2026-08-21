import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Pin, 
  Bold, 
  Italic, 
  Heading3, 
  List, 
  Quote, 
  AlertCircle, 
  Info, 
  Check, 
  Loader2, 
  Eye, 
  Edit3, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api, getNewsCoverUrl } from '../../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

const CATEGORIES = [
  { value: 'Allgemein', label: 'Allgemein & Unternehmen', color: 'bg-indigo-50 text-indigo-700' },
  { value: 'IT-Sicherheit', label: 'IT-Sicherheit & Systeme', color: 'bg-amber-50 text-amber-700' },
  { value: 'HR-Update', label: 'HR & Personalabteilung', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'Event', label: 'Events & Feiern', color: 'bg-purple-50 text-purple-700' },
  { value: 'Produktion & Technik', label: 'Produktion, Bau & Technik', color: 'bg-cyan-50 text-cyan-800' },
  { value: 'Wichtig', label: 'Wichtige Eilmeldung', color: 'bg-rose-50 text-rose-700' },
];

export function NewsFormModal({ newsToEdit = null, onClose, onSaved }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [title, setTitle] = useState(newsToEdit?.title || '');
  const [category, setCategory] = useState(newsToEdit?.category || 'Allgemein');
  const [isPinned, setIsPinned] = useState(newsToEdit?.is_pinned || false);
  const [summary, setSummary] = useState(newsToEdit?.summary || '');
  const [content, setContent] = useState(newsToEdit?.content || '');
  const [coverImage, setCoverImage] = useState(newsToEdit?.cover_image || '');
  
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Insert markdown helpers into textarea
  const insertMarkdown = (prefix, suffix = '', placeholder = 'Text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || placeholder;
    const replacement = `${prefix}${selected}${suffix}`;
    
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      setError(null);
      const res = await api.uploadNewsCover(file);
      if (res && res.url) {
        setCoverImage(res.url);
      }
    } catch (err) {
      console.error('Fehler beim Bild-Upload:', err);
      setError(err.message || 'Fehler beim Hochladen des Bildes.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Bitte geben Sie einen Titel für die Nachricht ein.');
      return;
    }
    if (!content.trim()) {
      setError('Bitte verfassen Sie den Hauptinhalt der Nachricht.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        category,
        is_pinned: isPinned,
        summary: summary.trim(),
        content: content.trim(),
        cover_image: coverImage.trim() || null,
      };

      let result;
      if (newsToEdit && newsToEdit.id) {
        result = await api.updateNews(newsToEdit.id, payload);
      } else {
        result = await api.createNews(payload);
      }

      onSaved(result);
      onClose();
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setError(err.message || 'Fehler beim Speichern des Beitrags.');
    } finally {
      setSaving(false);
    }
  };

  const coverUrl = getNewsCoverUrl(coverImage);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-100/90 overflow-hidden max-h-[94vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {newsToEdit ? t('news.modal_edit_title', 'Beitrag bearbeiten') : t('news.modal_create_title', 'Neuen Beitrag erstellen')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('news.modal_subtitle', 'Veröffentlichen Sie Unternehmensnachrichten für alle Mitarbeiter.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="news-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('news.field_title', 'Titel des Beitrags')} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. 🚀 Wichtiges Unternehmens-Update für Q2..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
            />
          </div>

          {/* 2. Category & Pinned Toggle Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('news.field_category', 'Kategorie')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="w-full flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <Pin className="w-4 h-4 text-amber-600 fill-current" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">{t('news.field_pinned_title', 'Ganz oben anheften')}</p>
                    <p className="text-[11px] text-amber-700">{t('news.field_pinned_desc', 'Als wichtige Eilmeldung hervorheben')}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-amber-300"
                />
              </label>
            </div>
          </div>

          {/* 3. Summary / Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('news.field_summary', 'Kurzbeschreibung / Vorschautext')}
              </label>
              <span className="text-[11px] text-slate-400">
                {summary.length}/200 Zeichen
              </span>
            </div>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Prägnanter 1-2 Satz Teaser für den News-Feed und das Startseiten-Widget..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
            />
          </div>

          {/* 4. Cover Image Upload & Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('news.field_cover_image', 'Titelbild / Header-Grafik')}
            </label>

            {coverUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-44 group">
                <img
                  src={coverUrl}
                  alt="Titelbild Vorschau"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center space-x-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bild austauschen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Entfernen</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center py-2 space-y-2">
                    <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Titelbild wird hochgeladen...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Bild hochladen oder hierher ziehen
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, WEBP bis 10 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {/* Alternative Direct URL Input */}
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Oder Bild-URL einfügen (z. B. https://images.unsplash.com/...)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          {/* 5. Main Content Editor with Markdown Tools & Tabs */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('news.field_content', 'Hauptinhalt der Nachricht (Markdown-Unterstützung)')} *
              </label>

              {/* Mode Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'editor'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Vorschau</span>
                </button>
              </div>
            </div>

            {activeTab === 'editor' ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all bg-white">
                {/* Markdown Toolbar */}
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1 flex-wrap text-slate-600">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**', 'Fetter Text')}
                    title="Fett (**text**)"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*', 'Kursiver Text')}
                    title="Kursiv (*text*)"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('### ', '', 'Überschrift')}
                    title="Überschrift (### Titel)"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertMarkdown('- ', '', 'Listenpunkt')}
                    title="Aufzählung (- punkt)"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> ', '', 'Zitat')}
                    title="Zitat (> text)"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> [!NOTE]\n> ', '', 'Wichtiger Hinweis')}
                    title="Hinweis-Box"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold text-sky-700 bg-sky-50"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> [!WARNING]\n> ', '', 'Warnhinweis')}
                    title="Warn-Box"
                    className="p-1.5 hover:bg-slate-200/80 rounded-lg text-xs font-bold text-amber-700 bg-amber-50"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={10}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Verfassen Sie Ihren Beitrag hier. Sie können Überschriften (#), Aufzählungen (-), Fett (**fett**) und Absätze verwenden..."
                  className="w-full p-4 bg-white text-sm text-slate-900 focus:outline-none resize-y leading-relaxed font-sans"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 min-h-[250px] overflow-y-auto">
                {content.trim() ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Kein Inhalt vorhanden. Wechseln Sie in den Editor, um Text einzugeben.
                  </p>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            {t('common.cancel', 'Abbrechen')}
          </button>

          <button
            type="submit"
            form="news-form"
            disabled={saving || uploadingImage}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('common.saving', 'Speichern...')}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{newsToEdit ? t('news.save_changes', 'Änderungen speichern') : t('news.publish_now', 'Beitrag veröffentlichen')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
