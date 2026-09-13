import React, { useState, useEffect } from 'react';
import {
  Menu,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  GripVertical,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const STANDARD_SECTIONS = [
  'Hauptbereich',
  'Arbeitsbereich',
  'Personal & HR',
  'IT & Systeme',
  'Administration'
];

export function MenuManagementCard() {
  const { refreshMenu } = useAuth();
  const { t } = useLanguage();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItemId, setDraggedItemId] = useState(null);

  const fetchMenuItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminMenuItems();
      setMenuItems(data || []);
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Menüeinträge.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Single Item Active State
  const handleToggleActive = async (item) => {
    try {
      const nextActive = !item.is_active;
      const updated = await api.toggleMenuItemActive(item.id, nextActive);

      setMenuItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, is_active: updated.is_active } : it))
      );

      // Refresh global sidebar menu live
      await refreshMenu();
      showToast(
        `Menüpunkt "${item.label}" wurde ${updated.is_active ? 'global aktiviert' : 'global deaktiviert (ausgeblendet)'}.`
      );
    } catch (err) {
      alert(err.message || 'Fehler beim Umschalten des Menüstatus.');
    }
  };

  // Move Item Up or Down within its section or across sections
  const handleMoveItem = async (itemId, direction) => {
    const item = menuItems.find((it) => it.id === itemId);
    if (!item) return;

    const grouped = {};
    STANDARD_SECTIONS.forEach((sec) => (grouped[sec] = []));

    menuItems.forEach((it) => {
      const sec = it.section || 'Hauptbereich';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push({ ...it });
    });

    const currentSec = item.section || 'Hauptbereich';
    const secItems = grouped[currentSec] || [];
    const itemIdx = secItems.findIndex((it) => it.id === itemId);

    if (itemIdx === -1) return;

    const targetIdx = itemIdx + direction;

    if (targetIdx >= 0 && targetIdx < secItems.length) {
      // Swap within the same section
      const temp = secItems[itemIdx];
      secItems[itemIdx] = secItems[targetIdx];
      secItems[targetIdx] = temp;
    } else if (direction === -1) {
      // Move to previous section
      const secIdx = STANDARD_SECTIONS.indexOf(currentSec);
      if (secIdx > 0) {
        const prevSec = STANDARD_SECTIONS[secIdx - 1];
        const [moved] = secItems.splice(itemIdx, 1);
        moved.section = prevSec;
        grouped[prevSec].push(moved);
      } else {
        return; // At top of first section
      }
    } else if (direction === 1) {
      // Move to next section
      const secIdx = STANDARD_SECTIONS.indexOf(currentSec);
      if (secIdx >= 0 && secIdx < STANDARD_SECTIONS.length - 1) {
        const nextSec = STANDARD_SECTIONS[secIdx + 1];
        const [moved] = secItems.splice(itemIdx, 1);
        moved.section = nextSec;
        grouped[nextSec].unshift(moved);
      } else {
        return; // At bottom of last section
      }
    }

    // Flatten and re-assign orders 1..N
    const newItems = [];
    let currentOrder = 1;
    STANDARD_SECTIONS.forEach((sec) => {
      (grouped[sec] || []).forEach((it) => {
        it.order = currentOrder++;
        newItems.push(it);
      });
    });

    Object.keys(grouped).forEach((sec) => {
      if (!STANDARD_SECTIONS.includes(sec)) {
        grouped[sec].forEach((it) => {
          it.order = currentOrder++;
          newItems.push(it);
        });
      }
    });

    setMenuItems(newItems);
    setSaving(true);

    const reorderPayload = newItems.map((it) => ({
      id: it.id,
      order: it.order,
      section: it.section
    }));

    try {
      const savedItems = await api.reorderMenuItems(reorderPayload);
      setMenuItems(savedItems);
      await refreshMenu();
      showToast('Menü-Reihenfolge erfolgreich aktualisiert & global synchronisiert!');
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern der Menüreihenfolge.');
      fetchMenuItems();
    } finally {
      setSaving(false);
    }
  };

  // Directly change item's section dropdown
  const handleSectionChange = async (itemId, newSection) => {
    const item = menuItems.find((it) => it.id === itemId);
    if (!item || item.section === newSection) return;

    const newItems = menuItems.map((it) => (it.id === itemId ? { ...it, section: newSection } : it));

    const grouped = {};
    STANDARD_SECTIONS.forEach((sec) => (grouped[sec] = []));
    newItems.forEach((it) => {
      const sec = it.section || 'Hauptbereich';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push({ ...it });
    });

    const orderedItems = [];
    let currentOrder = 1;
    STANDARD_SECTIONS.forEach((sec) => {
      (grouped[sec] || []).forEach((it) => {
        it.order = currentOrder++;
        orderedItems.push(it);
      });
    });

    Object.keys(grouped).forEach((sec) => {
      if (!STANDARD_SECTIONS.includes(sec)) {
        grouped[sec].forEach((it) => {
          it.order = currentOrder++;
          orderedItems.push(it);
        });
      }
    });

    setMenuItems(orderedItems);
    setSaving(true);

    const reorderPayload = orderedItems.map((it) => ({
      id: it.id,
      order: it.order,
      section: it.section
    }));

    try {
      const savedItems = await api.reorderMenuItems(reorderPayload);
      setMenuItems(savedItems);
      await refreshMenu();
      showToast(`Menüpunkt in den Bereich "${newSection}" verschoben.`);
    } catch (err) {
      setError(err.message || 'Fehler beim Ändern des Menübereichs.');
      fetchMenuItems();
    } finally {
      setSaving(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetItemId, targetSection) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetItemId) return;

    const dragged = menuItems.find((it) => it.id === draggedItemId);
    if (!dragged) return;

    const itemsWithoutDragged = menuItems.filter((it) => it.id !== draggedItemId);
    const targetIdx = itemsWithoutDragged.findIndex((it) => it.id === targetItemId);

    const updatedDragged = { ...dragged, section: targetSection };

    if (targetIdx !== -1) {
      itemsWithoutDragged.splice(targetIdx, 0, updatedDragged);
    } else {
      itemsWithoutDragged.push(updatedDragged);
    }

    const reordered = itemsWithoutDragged.map((it, idx) => ({
      ...it,
      order: idx + 1
    }));

    setMenuItems(reordered);
    setSaving(true);
    setDraggedItemId(null);

    const reorderPayload = reordered.map((it) => ({
      id: it.id,
      order: it.order,
      section: it.section
    }));

    try {
      const savedItems = await api.reorderMenuItems(reorderPayload);
      setMenuItems(savedItems);
      await refreshMenu();
      showToast('Menüpunkte erfolgreich per Drag & Drop neu angeordnet!');
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern der Menüreihenfolge.');
      fetchMenuItems();
    } finally {
      setSaving(false);
    }
  };

  // Reset to default menu configuration
  const handleResetDefaults = async () => {
    if (!window.confirm('Möchten Sie die gesamte Menüstruktur, Reihenfolge und Sichtbarkeiten auf die Werkseinstellungen zurücksetzen?')) {
      return;
    }

    setSaving(true);
    try {
      const resetItems = await api.resetDefaultMenus();
      setMenuItems(resetItems);
      await refreshMenu();
      showToast('Standard-Menüstruktur erfolgreich wiederhergestellt!');
    } catch (err) {
      setError(err.message || 'Fehler beim Zurücksetzen der Menüstruktur.');
    } finally {
      setSaving(false);
    }
  };

  // Group items by section
  const filteredItems = menuItems.filter((it) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.label.toLowerCase().includes(q) ||
      it.key.toLowerCase().includes(q) ||
      it.path.toLowerCase().includes(q) ||
      (it.section && it.section.toLowerCase().includes(q))
    );
  });

  const sectionsMap = {};
  STANDARD_SECTIONS.forEach((sec) => (sectionsMap[sec] = []));
  filteredItems.forEach((it) => {
    const sec = it.section || 'Hauptbereich';
    if (!sectionsMap[sec]) sectionsMap[sec] = [];
    sectionsMap[sec].push(it);
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
            <Menu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Menü- & Navigationsverwaltung
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                Globale Steuerung
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sortieren Sie Menüpunkte per Drag & Drop oder Pfeiltasten und steuern Sie deren Sichtbarkeit global.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            title="Werkseinstellungen wiederherstellen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Standard wiederherstellen</span>
          </button>

          <button
            onClick={fetchMenuItems}
            disabled={loading || saving}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-100"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${loading || saving ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Impact Banner */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start space-x-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-[#0078D4] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Sofortige globale Auswirkung:</span>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            Änderungen der Reihenfolge oder Deaktivierungen von Menüpunkten greifen <strong>in Echtzeit auf alle Benutzergruppen</strong> im gesamten Unternehmen durch.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Menüpunkt suchen (z. B. Kalender, Kantine, Vertrieb, Tickets)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <span className="text-[11px] font-semibold text-slate-400">
          {menuItems.length} Menüeinträge im System
        </span>
      </div>

      {/* Sections & Items List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Lade Menü-Konfiguration...</span>
        </div>
      ) : Object.keys(sectionsMap).length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
          Keine passenden Menüeinträge gefunden.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(sectionsMap).map(([sectionName, items]) => {
            if (items.length === 0 && searchQuery) return null;
            const translatedSection = t(`nav_sections.${sectionName}`, sectionName);

            return (
              <div key={sectionName} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {translatedSection}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                      {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}
                    </span>
                  </div>
                </div>

                <div 
                  className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs min-h-[50px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    if (items.length === 0) {
                      handleDrop(e, null, sectionName);
                    }
                  }}
                >
                  {items.map((item, secIndex) => {
                    const isFirstInSection = secIndex === 0;
                    const isLastInSection = secIndex === items.length - 1;

                    return (
                      <div
                        key={item.id}
                        draggable={!saving}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item.id, sectionName)}
                        className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-move ${
                          draggedItemId === item.id ? 'opacity-40 bg-indigo-50/50 border-2 border-dashed border-indigo-400' : ''
                        } ${
                          item.is_active ? 'hover:bg-slate-50/80' : 'bg-slate-50/70 opacity-65'
                        }`}
                      >
                        {/* Left: Drag Handle, Position & Move Controls */}
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Drag handle icon */}
                          <div className="p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" title="Ziehen zum Neu-Anordnen">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Move up / down control buttons */}
                          <div className="flex flex-col items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveItem(item.id, -1);
                              }}
                              disabled={saving}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                              title="Nach oben verschieben"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{secIndex + 1}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveItem(item.id, 1);
                              }}
                              disabled={saving}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                              title="Nach unten verschieben"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-semibold text-xs border border-slate-200/60">
                            <Menu className="w-4 h-4 text-slate-600" />
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {t(`nav_items.${item.key}`, item.label)}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 text-[10px] font-bold rounded">
                                  {t(`nav_badges.${item.badge}`, item.badge)}
                                </span>
                              )}
                              {!item.is_active && (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md border border-rose-200 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" />
                                  <span>Deaktiviert</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-wrap">
                              <span>{item.path}</span>
                              <span>•</span>
                              <span className="text-slate-500 font-sans">
                                Rollen: {item.allowed_roles?.join(', ') || 'Alle'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Section Dropdown & Active Toggle Switch */}
                        <div className="flex items-center justify-end space-x-3 shrink-0 self-end sm:self-auto">
                          {/* Section Selector */}
                          <select
                            value={item.section || 'Hauptbereich'}
                            onChange={(e) => handleSectionChange(item.id, e.target.value)}
                            disabled={saving}
                            className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            title="Bereich verschieben"
                          >
                            {STANDARD_SECTIONS.map((sec) => (
                              <option key={sec} value={sec}>
                                {t(`nav_sections.${sec}`, sec)}
                              </option>
                            ))}
                          </select>

                          {/* Active Toggle */}
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                              item.is_active
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                            }`}
                            title={item.is_active ? 'Klicken zum Deaktivieren' : 'Klicken zum Aktivieren'}
                          >
                            {item.is_active ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Aktiviert</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ausgeblendet</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
