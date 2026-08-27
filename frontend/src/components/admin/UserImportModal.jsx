import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Users,
  ShieldCheck,
  Check,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function UserImportModal({ isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [defaultPassword, setDefaultPassword] = useState('Passwort123!');

  // Preview & Processing state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'json', 'txt'].includes(ext)) {
      setError('Bitte nur CSV- oder JSON-Dateien auswählen.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setImportSummary(null);
    setPreviewLoading(true);

    try {
      const preview = await api.previewAdminUsersImport(selectedFile);
      setPreviewData(preview);
    } catch (err) {
      setError(err.message || 'Fehler beim Analysieren der Datei.');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await api.downloadUserImportTemplate();
    } catch (err) {
      setError(err.message || 'Fehler beim Herunterladen der Vorlage.');
    }
  };

  const handleExecuteImport = async () => {
    if (!file) {
      setError('Bitte wählen Sie zuerst eine Datei aus.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const summary = await api.importAdminUsers(file, {
        updateExisting,
        defaultPassword: defaultPassword.trim() || 'Passwort123!',
      });
      setImportSummary(summary);
      if (onSuccess) {
        onSuccess(summary);
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Importieren der Benutzer.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setImportSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">
                Benutzer importieren (CSV & JSON)
              </h2>
              <p className="text-xs text-slate-300">
                Mitarbeiterstammdaten per Stapelverarbeitung anlegen und synchronisieren
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Summary Banner */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-center space-x-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import erfolgreich abgeschlossen!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-slate-500 block">Verarbeitet</span>
                  <span className="font-bold text-slate-900 text-sm">{importSummary.total_processed}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block">Neu angelegt</span>
                  <span className="font-bold text-emerald-800 text-sm">+{importSummary.created_count}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-blue-700 block">Aktualisiert</span>
                  <span className="font-bold text-blue-800 text-sm">{importSummary.updated_count}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-slate-500 block">Übersprungen / Fehler</span>
                  <span className="font-bold text-slate-700 text-sm">{importSummary.skipped_count + importSummary.error_count}</span>
                </div>
              </div>

              {importSummary.errors && importSummary.errors.length > 0 && (
                <div className="pt-2 text-xs">
                  <span className="font-bold text-amber-800 block">Hinweise / Warnungen:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-700 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                    {importSummary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Top Options & Template Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">Import-Musterdatei benötigt?</span>
              <p className="text-[11px] text-slate-500">
                Nutzen Sie unsere offizielle Excel/CSV-Vorlage mit Beispieldaten für den schnellen Start.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vorlage herunterladen (.csv)</span>
            </button>
          </div>

          {/* File Upload Box */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                CSV- oder JSON-Datei hierher ziehen oder <span className="text-indigo-600 underline">durchsuchen</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unterstützt CSV (Semikolon- oder Komma-getrennt) und JSON-Arrays bis 5 MB
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{file.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB • {previewData ? `${previewData.total_rows} Datensätze gefunden` : 'Wird analysiert...'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
              >
                Andere Datei wählen
              </button>
            </div>
          )}

          {/* Import Settings (Options) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Duplikats-Behandlung
              </label>
              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">
                  Bestehende Benutzer aktualisieren (nach E-Mail-Adresse)
                </span>
              </label>
              <p className="text-[10px] text-slate-500 mt-1 pl-6">
                Aktualisiert Name, Abteilung, Rolle, etc. Passwörter bestehender Benutzer bleiben unverändert.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Standard-Passwort für Neuanlagen
              </label>
              <input
                type="text"
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
                placeholder="Passwort123!"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Wird vergeben, falls in der Importdatei kein individuelles Passwort hinterlegt ist.
              </p>
            </div>
          </div>

          {/* Live Preview Section */}
          {previewLoading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-500">Datei wird analysiert und validiert...</span>
            </div>
          )}

          {previewData && !previewLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Pre-Validation Vorschau ({previewData.total_rows} Zeilen)
                </h4>
                <div className="flex items-center space-x-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    +{previewData.create_count} Neu
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg">
                    {previewData.update_count} Update
                  </span>
                  {previewData.error_count > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-lg">
                      {previewData.error_count} Fehler
                    </span>
                  )}
                </div>
              </div>

              {/* Table of Rows */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Aktion</th>
                      <th className="py-2 px-3">E-Mail</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Abteilung</th>
                      <th className="py-2 px-3">Rolle</th>
                      <th className="py-2 px-3">Status / Fehler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewData.rows.map((r, i) => (
                      <tr key={i} className={r.action === 'ERROR' ? 'bg-rose-50/60' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{r.row_number}</td>
                        <td className="py-2 px-3">
                          {r.action === 'CREATE' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              Neu
                            </span>
                          )}
                          {r.action === 'UPDATE' && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                              Update
                            </span>
                          )}
                          {r.action === 'ERROR' && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px]">
                              Fehler
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-800">{r.email}</td>
                        <td className="py-2 px-3 text-slate-900 font-bold">{r.full_name}</td>
                        <td className="py-2 px-3 text-slate-600">{r.department}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{r.role}</td>
                        <td className="py-2 px-3">
                          {r.errors && r.errors.length > 0 ? (
                            <span className="text-rose-600 font-semibold text-[11px]">{r.errors.join(', ')}</span>
                          ) : (
                            <span className="text-emerald-600 text-[11px] flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Gültig</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            Schließen
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!file || importing || previewLoading || (previewData && previewData.valid_rows === 0)}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {importing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {importing ? 'Importiere Benutzer...' : previewData ? `${previewData.valid_rows} Benutzer importieren` : 'Importieren'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
