import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Link,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../../services/api';

const PRESET_COLORS = [
  '#0078D4', // Outlook Blue
  '#107C41', // Excel Green
  '#8764B8', // OneNote Purple
  '#D83B01', // Office Orange
  '#E3008C', // Magenta
  '#008272', // Teal
  '#69797E', // Slate Gray
  '#B4009E'  // Violet
];

export function CalendarSourcesModal({ isOpen, onClose, onSourcesUpdated }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // Form State for Add / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [farbe, setFarbe] = useState('#0078D4');
  const [istAktiv, setIstAktiv] = useState(true);
  const [abteilung, setAbteilung] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminCalendarSources();
      setSources(data || []);
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Kalenderquellen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSources();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName('');
    setIcsUrl('');
    setFarbe('#0078D4');
    setIstAktiv(true);
    setAbteilung('');
    setError(null);
  };

  const handleStartEdit = (source) => {
    setIsEditing(true);
    setEditId(source.id);
    setName(source.name);
    setIcsUrl(source.ics_url);
    setFarbe(source.farbe || '#0078D4');
    setIstAktiv(source.ist_aktiv);
    setAbteilung(source.abteilung || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !icsUrl.trim()) {
      setError('Bitte geben Sie einen Namen und eine gültige .ics-URL an.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        ics_url: icsUrl.trim(),
        farbe,
        ist_aktiv: istAktiv,
        abteilung: abteilung.trim() || null
      };

      if (isEditing && editId) {
        await api.updateCalendarSource(editId, payload);
      } else {
        await api.createCalendarSource(payload);
      }

      resetForm();
      await fetchSources();
      if (onSourcesUpdated) onSourcesUpdated();
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern der Kalenderquelle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, sourceName) => {
    if (!window.confirm(`Möchten Sie die Kalenderquelle "${sourceName}" wirklich unwiderruflich löschen?`)) return;

    try {
      await api.deleteCalendarSource(id);
      await fetchSources();
      if (onSourcesUpdated) onSourcesUpdated();
    } catch (err) {
      alert(err.message || 'Fehler beim Löschen der Quelle.');
    }
  };

  const handleForceSync = async (id) => {
    setSyncingId(id);
    try {
      await api.syncCalendarSource(id);
      await fetchSources();
      if (onSourcesUpdated) onSourcesUpdated();
    } catch (err) {
      alert(err.message || 'Fehler beim Synchronisieren.');
    } finally {
      setSyncingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0078D4] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Microsoft Outlook / iCal Kalendersynchronisation
              </h2>
              <p className="text-xs text-slate-500">
                Verwalten Sie externe .ics-Kalenderfeeds aus Microsoft 365, SharePoint oder Outlook.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Sources List */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hinterlegte Outlook- / iCal-Feeds ({sources.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Lade Kalenderquellen...</span>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200">
              Es sind noch keine externen Outlook-Kalenderquellen hinterlegt.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              {sources.map((s) => (
                <div key={s.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <span
                      className="w-4 h-4 rounded-full mt-1 shrink-0 shadow-xs"
                      style={{ backgroundColor: s.farbe || '#0078D4' }}
                    ></span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{s.name}</span>
                        {s.abteilung && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">
                            {s.abteilung}
                          </span>
                        )}
                        {!s.ist_aktiv && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md border border-rose-200">
                            Deaktiviert
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="truncate max-w-xs font-mono text-[11px] text-slate-400" title={s.ics_url}>
                          {s.ics_url.slice(0, 45)}...
                        </span>
                        <span>•</span>
                        <span>{s.anzahl_termine} Termine</span>
                        <span>•</span>
                        <span className="text-[11px] text-emerald-600 font-semibold">{s.letzter_status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleForceSync(s.id)}
                      disabled={syncingId === s.id}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Jetzt synchronisieren"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingId === s.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleStartEdit(s)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={handleSubmit} className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              {isEditing ? <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{isEditing ? 'Kalenderquelle bearbeiten' : 'Neue Outlook-.ics-Quelle hinzufügen'}</span>
            </h4>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Abbrechen
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Name des Kalenders <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="z. B. Microsoft 365 Feiertage, Vertriebstermine..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Abteilung (optional)
              </label>
              <input
                type="text"
                placeholder="z. B. Vertrieb, IT, Produktion (leer für alle)"
                value={abteilung}
                onChange={(e) => setAbteilung(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Outlook- / iCal-Feed-URL (.ics) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://outlook.office365.com/owa/calendar/.../reachcalendar.ics"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>In Outlook Web unter <em>Einstellungen &gt; Kalender &gt; Geteilte Kalender &gt; Kalender veröffentlichen</em> als .ics-Link abrufbar.</span>
            </p>
          </div>

          {/* Color & Active */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Farbe im Kalender:
              </label>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFarbe(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${farbe === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={istAktiv}
                  onChange={(e) => setIstAktiv(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Feed aktivieren & synchronisieren</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {submitting ? 'Wird gespeichert...' : isEditing ? 'Änderungen übernehmen' : 'Quelle hinzufügen & synchronisieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
