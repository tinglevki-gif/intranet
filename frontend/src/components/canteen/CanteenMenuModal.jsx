import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Calendar, 
  Upload, 
  FileText, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Leaf, 
  UtensilsCrossed, 
  Coffee, 
  AlertCircle,
  Clock,
  Euro,
  Plus,
  RefreshCw
} from 'lucide-react';
import { api, getAssetUrl } from '../../services/api';

const ALLERGEN_OPTIONS = [
  { code: 'A', label: 'Glutenhaltiges Getreide (A)' },
  { code: 'B', label: 'Krebstiere (B)' },
  { code: 'C', label: 'Eier (C)' },
  { code: 'D', label: 'Fisch (D)' },
  { code: 'E', label: 'Erdnüsse (E)' },
  { code: 'F', label: 'Soja (F)' },
  { code: 'G', label: 'Milch & Laktose (G)' },
  { code: 'H', label: 'Schalenfrüchte / Nüsse (H)' },
  { code: 'L', label: 'Sellerie (L)' },
  { code: 'M', label: 'Senf (M)' },
  { code: 'N', label: 'Sesam (N)' },
  { code: 'O', label: 'Schwefeldioxid / Sulfite (O)' },
  { code: 'P', label: 'Lupinen (P)' },
  { code: 'R', label: 'Weichtiere (R)' },
];

const DEFAULT_DAYS = [
  { name: 'Montag', short: 'Mo' },
  { name: 'Dienstag', short: 'Di' },
  { name: 'Mittwoch', short: 'Mi' },
  { name: 'Donnerstag', short: 'Do' },
  { name: 'Freitag', short: 'Fr' },
];

function getIsoWeekDates(year, week) {
  try {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const isoMon = new Date(simple);
    if (dow <= 4) {
      isoMon.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      isoMon.setDate(simple.getDate() + 8 - simple.getDay());
    }
    const isoFri = new Date(isoMon);
    isoFri.setDate(isoMon.getDate() + 4);
    return {
      mon: isoMon.toISOString().split('T')[0],
      fri: isoFri.toISOString().split('T')[0],
      days: Array.from({ length: 5 }, (_, i) => {
        const d = new Date(isoMon);
        d.setDate(isoMon.getDate() + i);
        return d.toISOString().split('T')[0];
      })
    };
  } catch {
    const today = new Date().toISOString().split('T')[0];
    return { mon: today, fri: today, days: [today, today, today, today, today] };
  }
}

export function CanteenMenuModal({
  isOpen,
  onClose,
  initialWeek = 35,
  initialYear = 2026,
  existingMenu = null,
  onSaved
}) {
  const [calendarWeek, setCalendarWeek] = useState(initialWeek);
  const [year, setYear] = useState(initialYear);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [days, setDays] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(false);

  // Google Gemini AI Generator State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [aiGeneratedSuccess, setAiGeneratedSuccess] = useState(false);

  // Initialize dates and day data
  useEffect(() => {
    if (!isOpen) return;

    const targetWk = existingMenu?.calendar_week || initialWeek;
    const targetYr = existingMenu?.year || initialYear;
    setCalendarWeek(targetWk);
    setYear(targetYr);

    const dates = getIsoWeekDates(targetYr, targetWk);
    setValidFrom(existingMenu?.valid_from || dates.mon);
    setValidTo(existingMenu?.valid_to || dates.fri);
    setIsPublished(existingMenu?.is_published !== undefined ? existingMenu.is_published : true);
    setPdfUrl(existingMenu?.pdf_url || null);
    setError(null);

    if (existingMenu?.days_data && existingMenu.days_data.length === 5) {
      setDays(existingMenu.days_data);
    } else {
      // Create empty 5 days
      const initDays = DEFAULT_DAYS.map((d, i) => ({
        tag: d.name,
        datum: dates.days[i],
        gericht_haupt: {
          titel: '',
          beschreibung: '',
          preis: '6,90 €',
          kalorien: '',
          is_vegan: false,
          is_vegetarian: false,
        },
        gericht_vegetarisch_vegan: {
          titel: '',
          beschreibung: '',
          preis: '5,80 €',
          kalorien: '',
          is_vegan: false,
          is_vegetarian: true,
        },
        dessert_beilage: {
          titel: '',
          preis: '1,80 €',
        },
        allergene_zusatzstoffe: [],
      }));
      setDays(initDays);
    }
  }, [isOpen, existingMenu, initialWeek, initialYear]);

  // Handle Week / Year change to recompute date range
  const handleWeekYearChange = (newWk, newYr) => {
    setCalendarWeek(newWk);
    setYear(newYr);
    const dates = getIsoWeekDates(newYr, newWk);
    setValidFrom(dates.mon);
    setValidTo(dates.fri);
    setDays((prev) =>
      prev.map((day, i) => ({
        ...day,
        datum: dates.days[i] || day.datum,
      }))
    );
  };

  // Day field updater
  const updateCurrentDay = (section, field, value) => {
    setDays((prev) => {
      const next = [...prev];
      const current = { ...next[activeDayIdx] };
      if (section === 'root') {
        current[field] = value;
      } else {
        current[section] = {
          ...current[section],
          [field]: value,
        };
      }
      next[activeDayIdx] = current;
      return next;
    });
  };

  // Toggle Allergen Code
  const toggleAllergen = (code) => {
    setDays((prev) => {
      const next = [...prev];
      const current = { ...next[activeDayIdx] };
      const currentAllergens = Array.isArray(current.allergene_zusatzstoffe)
        ? [...current.allergene_zusatzstoffe]
        : [];
      if (currentAllergens.includes(code)) {
        current.allergene_zusatzstoffe = currentAllergens.filter((c) => c !== code);
      } else {
        current.allergene_zusatzstoffe = [...currentAllergens, code];
      }
      next[activeDayIdx] = current;
      return next;
    });
  };

  // PDF Upload handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Bitte nur PDF-Dateien hochladen.');
      return;
    }

    try {
      setUploadingPdf(true);
      setError(null);
      const res = await api.uploadCanteenPdf(file);
      setPdfUrl(res.pdf_url);
      setPdfFileName(file.name);
    } catch (err) {
      setError(err.message || 'Fehler beim Hochladen der PDF-Datei');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Load sample German menu template
  const handleLoadTemplate = () => {
    const sampleDishes = [
      {
        tag: 'Montag',
        haupt: { titel: 'Knuspriges Hähnchenschnitzel Wiener Art', beschreibung: 'Mit Zitrone, Pommes Frites oder Kartoffelsalat und Preiselbeeren', preis: '6,90 €' },
        veggie: { titel: 'Mediterrane Gemüse-Lasagne', beschreibung: 'Mit Zucchini, Auberginen und frischem Rucola', preis: '5,80 €', is_vegan: false, is_vegetarian: true },
        dessert: { titel: 'Grießpudding mit Waldbeeren', preis: '1,80 €' },
        allergene: ['A', 'C', 'G']
      },
      {
        tag: 'Dienstag',
        haupt: { titel: 'Dänischer Rinderbraten an Rosmarin-Jus', beschreibung: 'Zart geschmort mit Apfel-Rotkohl und Kartoffelgratin', preis: '7,50 €' },
        veggie: { titel: 'Cremiges Waldpilz-Risotto', beschreibung: 'Mit Pfifferlingen, Kräuterseitlingen und Grana Padano', preis: '6,20 €', is_vegan: false, is_vegetarian: true },
        dessert: { titel: 'Frischer Obstsalat mit Minze', preis: '1,80 €' },
        allergene: ['G', 'L']
      },
      {
        tag: 'Mittwoch',
        haupt: { titel: 'Hausgemachte Lasagne al Forno', beschreibung: 'Mit 100% Rinderhackfleisch und Gouda überbacken', preis: '6,80 €' },
        veggie: { titel: 'Süßkartoffel-Kichererbsen-Curry (Vegan)', beschreibung: 'Mit Kokosmilch, Spinat und Basmatireis', preis: '5,90 €', is_vegan: true, is_vegetarian: true },
        dessert: { titel: 'Tiramisu im Glas', preis: '2,00 €' },
        allergene: ['A', 'F', 'G']
      },
      {
        tag: 'Donnerstag',
        haupt: { titel: 'Gebratenes Lachsfilet auf Blattspinat', beschreibung: 'Mit Zitronen-Dill-Sauce und Petersilienkartoffeln', preis: '8,20 €' },
        veggie: { titel: 'Gefüllte Paprika mit Quinoa (Vegan)', beschreibung: 'Auf Tomatenragout mit Kräuter-Couscous', preis: '5,80 €', is_vegan: true, is_vegetarian: true },
        dessert: { titel: 'Schokoladenmousse', preis: '1,80 €' },
        allergene: ['D', 'G']
      },
      {
        tag: 'Freitag',
        haupt: { titel: 'Tinglev Gourmet Burger & Süßkartoffel-Pommes', beschreibung: '180g Angus Beef, Bacon, Cheddar und BBQ-Dip', preis: '7,80 €' },
        veggie: { titel: 'Knuspriger Falafel-Wrap', beschreibung: 'Mit Hummus, Minz-Joghurt und buntem Salat', preis: '5,60 €', is_vegan: false, is_vegetarian: true },
        dessert: { titel: 'Panna Cotta mit Erdbeerspiegel', preis: '1,80 €' },
        allergene: ['A', 'C', 'G', 'N']
      }
    ];

    const dates = getIsoWeekDates(year, calendarWeek);
    setDays(
      sampleDishes.map((s, i) => ({
        tag: s.tag,
        datum: dates.days[i],
        gericht_haupt: {
          titel: s.haupt.titel,
          beschreibung: s.haupt.beschreibung,
          preis: s.haupt.preis,
          kalorien: '650 kcal',
          is_vegan: false,
          is_vegetarian: false,
        },
        gericht_vegetarisch_vegan: {
          titel: s.veggie.titel,
          beschreibung: s.veggie.beschreibung,
          preis: s.veggie.preis,
          kalorien: '480 kcal',
          is_vegan: s.veggie.is_vegan,
          is_vegetarian: s.veggie.is_vegetarian,
        },
        dessert_beilage: {
          titel: s.dessert.titel,
          preis: s.dessert.preis,
        },
        allergene_zusatzstoffe: s.allergene,
      }))
    );
  };

  // Google Gemini AI Weekly Menu Generator
  const handleAIGenerateWeeklyMenu = async () => {
    try {
      setAiGenerating(true);
      setError(null);
      setAiGeneratedSuccess(false);

      const res = await api.aiGenerateCanteenMenu({
        calendar_week: parseInt(calendarWeek, 10),
        year: parseInt(year, 10),
        theme_or_notes: aiTheme.trim() || undefined,
      });

      if (res?.days_data && res.days_data.length === 5) {
        setDays(res.days_data);
        setAiGeneratedSuccess(true);
        setAiPromptOpen(false);
        setTimeout(() => setAiGeneratedSuccess(false), 4000);
      } else {
        throw new Error('Ungültiges Antwortformat vom KI-Dienst erhalten.');
      }
    } catch (err) {
      setError(err.message || 'Fehler bei der KI-Generierung des Speiseplans.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Submit
  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation: Check that at least one dish has a title
    const hasAnyDish = days.some(
      (d) => d.gericht_haupt?.titel?.trim() || d.gericht_vegetarisch_vegan?.titel?.trim()
    );

    if (!hasAnyDish) {
      setError('Bitte tragen Sie mindestens ein Haupt- oder vegetarisches Gericht ein.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        calendar_week: parseInt(calendarWeek, 10),
        year: parseInt(year, 10),
        valid_from: validFrom,
        valid_to: validTo,
        days_data: days,
        pdf_url: pdfUrl,
        is_published: isPublished,
      };

      let saved;
      if (existingMenu?.id && existingMenu.id > 0) {
        saved = await api.updateCanteenMenu(existingMenu.id, payload);
      } else {
        saved = await api.saveCanteenMenu(payload);
      }

      setSuccessToast(true);
      if (onSaved) {
        onSaved(saved);
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Speiseplans');
    } finally {
      setLoading(false);
    }
  };

  // Delete menu
  const handleDelete = async () => {
    if (!existingMenu?.id || existingMenu.id === 0) return;
    if (!window.confirm(`Möchten Sie den Speiseplan für KW ${calendarWeek} wirklich löschen?`)) return;

    try {
      setLoading(true);
      await api.deleteCanteenMenu(existingMenu.id);
      if (onSaved) onSaved(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen des Speiseplans');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentDay = days[activeDayIdx] || {
    tag: DEFAULT_DAYS[activeDayIdx]?.name || 'Tag',
    gericht_haupt: {},
    gericht_vegetarisch_vegan: {},
    dessert_beilage: {},
    allergene_zusatzstoffe: []
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">
                {existingMenu?.id > 0 ? 'Speiseplan bearbeiten' : 'Neuen Wochen-Speiseplan anlegen'}
              </h2>
              <p className="text-xs text-slate-300">
                Kalenderwoche {calendarWeek} / {year} • Gültig {validFrom} bis {validTo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Controls: KW, Jahr, Gültigkeit & Veröffentlichung */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Kalenderwoche (KW) *
              </label>
              <select
                value={calendarWeek}
                onChange={(e) => handleWeekYearChange(parseInt(e.target.value, 10), year)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map((wk) => (
                  <option key={wk} value={wk}>
                    KW {wk} {wk === 35 ? '(Aktuelle Woche)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Jahr *
              </label>
              <select
                value={year}
                onChange={(e) => handleWeekYearChange(calendarWeek, parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Gültig von – bis
              </label>
              <div className="text-xs font-mono font-semibold text-slate-700 py-2">
                {validFrom} – {validTo}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Status
              </label>
              <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">
                  {isPublished ? 'Veröffentlicht' : 'Entwurf (unsichtbar)'}
                </span>
              </label>
            </div>
          </div>

          {/* AI Success Notification */}
          {aiGeneratedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between animate-fade-in shadow-2xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✨ Speiseplan für KW {calendarWeek} erfolgreich mit Google Gemini 2.5 Flash generiert und ausgefüllt!</span>
              </div>
              <button onClick={() => setAiGeneratedSuccess(false)} className="text-emerald-600 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Bar: KI-Generator, Vorlage laden & PDF Upload */}
          <div className="p-3.5 bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-amber-50/50 rounded-2xl border border-violet-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Gemini AI Generate Button */}
                <button
                  type="button"
                  onClick={() => setAiPromptOpen(!aiPromptOpen)}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-200 transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ Woche automatisch mit KI generieren</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-slate-500" />
                  <span>Klassische Vorlage</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>{uploadingPdf ? 'Lade hoch...' : 'PDF-Aushang hochladen'}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </label>
                {pdfUrl && (
                  <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <a
                      href={getAssetUrl(pdfUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-emerald-900 truncate max-w-[140px]"
                    >
                      {pdfFileName || 'PDF vorhanden'}
                    </a>
                    <button
                      type="button"
                      onClick={() => setPdfUrl(null)}
                      className="p-0.5 hover:text-rose-600"
                      title="PDF entfernen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Generator Prompt & Options Drawer */}
            {aiPromptOpen && (
              <div className="p-3.5 bg-white rounded-xl border border-violet-200 shadow-sm space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-violet-950">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    Google Gemini 2.5 Flash Wochenspeiseplan-Konfigurator (KW {calendarWeek} / {year})
                  </span>
                  <button onClick={() => setAiPromptOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Thema / Wünsche (optional, z. B. 'Italienische Woche', 'Herbstgerichte', 'Fisch & leichte Salate')..."
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAIGenerateWeeklyMenu}
                    disabled={aiGenerating}
                    className="inline-flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generiere Speiseplan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Jetzt generieren</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Erstellt automatisch 5 vollwertige Hauptgerichte, 5 vegetarische/vegane Alternativen, Desserts, Preise und Allergen-Deklarationen für Mo–Fr.
                </p>
              </div>
            )}
          </div>

          {/* Weekday Tabs (Montag bis Freitag) */}
          <div>
            <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {DEFAULT_DAYS.map((d, idx) => {
                const dayItem = days[idx];
                const hasData = dayItem?.gericht_haupt?.titel?.trim() || dayItem?.gericht_vegetarisch_vegan?.titel?.trim();
                const isActive = activeDayIdx === idx;
                return (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setActiveDayIdx(idx)}
                    className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-900 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{d.name}</span>
                      {hasData && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-emerald-500'}`} />
                      )}
                    </div>
                    <span className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {dayItem?.datum || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form for Active Day */}
          <div className="space-y-5 p-5 bg-slate-50/70 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs">
                  {currentDay.tag}
                </span>
                <span>Gerichte & Angebote konfigurieren</span>
              </h3>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                Datum: {currentDay.datum || validFrom}
              </span>
            </div>

            {/* 1. Hauptgericht */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hauptgericht (Tagesgericht 1)</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gerichts-Titel *
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Hähnchenschnitzel Wiener Art mit Pommes"
                    value={currentDay.gericht_haupt?.titel || ''}
                    onChange={(e) => updateCurrentDay('gericht_haupt', 'titel', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Preis (€)
                  </label>
                  <input
                    type="text"
                    placeholder="6,90 €"
                    value={currentDay.gericht_haupt?.preis || ''}
                    onChange={(e) => updateCurrentDay('gericht_haupt', 'preis', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Beschreibung & Beilagen
                </label>
                <input
                  type="text"
                  placeholder="z. B. Mit Zitrone, Pommes Frites oder Kartoffelsalat und Preiselbeeren"
                  value={currentDay.gericht_haupt?.beschreibung || ''}
                  onChange={(e) => updateCurrentDay('gericht_haupt', 'beschreibung', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* 2. Vegetarisches / Veganes Gericht */}
            <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vegetarisch / Veganes Tagesgericht</span>
                </span>
                <div className="flex items-center space-x-3 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={currentDay.gericht_vegetarisch_vegan?.is_vegetarian !== false}
                      onChange={(e) => updateCurrentDay('gericht_vegetarisch_vegan', 'is_vegetarian', e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Vegetarisch</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={currentDay.gericht_vegetarisch_vegan?.is_vegan === true}
                      onChange={(e) => updateCurrentDay('gericht_vegetarisch_vegan', 'is_vegan', e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Rein Vegan 🌱</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gerichts-Titel
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Cremiges Waldpilz-Risotto mit Grana Padano"
                    value={currentDay.gericht_vegetarisch_vegan?.titel || ''}
                    onChange={(e) => updateCurrentDay('gericht_vegetarisch_vegan', 'titel', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Preis (€)
                  </label>
                  <input
                    type="text"
                    placeholder="5,80 €"
                    value={currentDay.gericht_vegetarisch_vegan?.preis || ''}
                    onChange={(e) => updateCurrentDay('gericht_vegetarisch_vegan', 'preis', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Beschreibung
                </label>
                <input
                  type="text"
                  placeholder="z. B. Mit frischen Pfifferlingen, Kräuterseitlingen und Thymian-Topping"
                  value={currentDay.gericht_vegetarisch_vegan?.beschreibung || ''}
                  onChange={(e) => updateCurrentDay('gericht_vegetarisch_vegan', 'beschreibung', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 3. Beilage / Dessert / Suppe */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Coffee className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dessert / Tages-Suppe / Beilage</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="z. B. Grießpudding mit Waldbeeren oder Tagessuppe"
                    value={currentDay.dessert_beilage?.titel || ''}
                    onChange={(e) => updateCurrentDay('dessert_beilage', 'titel', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="1,80 €"
                    value={currentDay.dessert_beilage?.preis || ''}
                    onChange={(e) => updateCurrentDay('dessert_beilage', 'preis', e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. Allergen-Kennzeichnung */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Allergene & Zusatzstoffe auswählen ({currentDay.tag})
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ALLERGEN_OPTIONS.map((a) => {
                  const isSelected = (currentDay.allergene_zusatzstoffe || []).includes(a.code);
                  return (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => toggleAllergen(a.code)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {existingMenu?.id > 0 && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Wochenplan löschen</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Speiseplan speichern</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
