import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Coffee, 
  Clock, 
  Leaf, 
  Flame, 
  Euro, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Download,
  FileText,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Phone,
  RefreshCw,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, getAssetUrl } from '../services/api';
import { CanteenMenuModal } from '../components/canteen/CanteenMenuModal';

const ALLERGEN_DICT = {
  'A': 'Glutenhaltiges Getreide',
  'B': 'Krebstiere',
  'C': 'Eier von Geflügel',
  'D': 'Fisch & Fischerzeugnisse',
  'E': 'Erdnüsse',
  'F': 'Sojabohnen',
  'G': 'Milch & Laktose',
  'H': 'Schalenfrüchte (Nüsse)',
  'L': 'Sellerie',
  'M': 'Senf',
  'N': 'Sesamsamen',
  'O': 'Schwefeldioxid & Sulfite',
  'P': 'Lupinen',
  'R': 'Weichtiere (Schnecken, Muscheln)',
};

const DISH_SAMPLE_IMAGES = {
  schnitzel: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=700&auto=format&fit=crop&q=80',
  braten: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80',
  lasagne: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=700&auto=format&fit=crop&q=80',
  lachs: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80',
  risotto: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=700&auto=format&fit=crop&q=80',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=700&auto=format&fit=crop&q=80',
  curry: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&auto=format&fit=crop&q=80',
  generic_meat: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&auto=format&fit=crop&q=80',
  generic_veggie: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&auto=format&fit=crop&q=80',
};

function getDishImage(title = '', isVeggie = false) {
  const t = title.toLowerCase();
  if (t.includes('schnitzel')) return DISH_SAMPLE_IMAGES.schnitzel;
  if (t.includes('braten') || t.includes('gulasch') || t.includes('roulade')) return DISH_SAMPLE_IMAGES.braten;
  if (t.includes('lasagne')) return DISH_SAMPLE_IMAGES.lasagne;
  if (t.includes('lachs') || t.includes('fisch') || t.includes('kabeljau') || t.includes('seelachs')) return DISH_SAMPLE_IMAGES.lachs;
  if (t.includes('burger')) return DISH_SAMPLE_IMAGES.burger;
  if (t.includes('risotto')) return DISH_SAMPLE_IMAGES.risotto;
  if (t.includes('pasta') || t.includes('spätzle') || t.includes('gnocchi') || t.includes('nudel')) return DISH_SAMPLE_IMAGES.pasta;
  if (t.includes('curry') || t.includes('masala') || t.includes('wok')) return DISH_SAMPLE_IMAGES.curry;
  return isVeggie ? DISH_SAMPLE_IMAGES.generic_veggie : DISH_SAMPLE_IMAGES.generic_meat;
}

function getCurrentCalendarWeek() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return { week: 35, year: now.getFullYear() || 2026 };
}

export function KantinePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const currentIso = getCurrentCalendarWeek();
  const [selectedWeek, setSelectedWeek] = useState(35);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [activeDayIndex, setActiveDayIndex] = useState(1); // 1 = Dienstag (Heute)
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' or 'grid'

  const [currentMenu, setCurrentMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if current user is SuperAdmin or has manage_canteen permission
  const canManageCanteen = 
    user?.role === 'ADMIN' || 
    user?.can_manage_canteen === true || 
    user?.custom_permissions?.manage_canteen === true || 
    (Array.isArray(user?.allowed_modules) && (user.allowed_modules.includes('manage_canteen') || user.allowed_modules.includes('canteen_admin')));

  const loadMenu = async (week, year) => {
    try {
      setLoading(true);
      const data = await api.getCanteenMenu(week, year);
      setCurrentMenu(data);
    } catch (err) {
      console.error('Error fetching weekly menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear]);

  // Week navigation
  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek((w) => w - 1);
    } else {
      setSelectedWeek(52);
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek < 52) {
      setSelectedWeek((w) => w + 1);
    } else {
      setSelectedWeek(1);
      setSelectedYear((y) => y + 1);
    }
  };

  const handleJumpToToday = () => {
    setSelectedWeek(35);
    setSelectedYear(2026);
    setActiveDayIndex(1); // Tuesday
  };

  const daysData = currentMenu?.days_data || [];
  const activeDay = daysData[activeDayIndex] || daysData[0] || null;

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto px-2 sm:px-4">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                Kantine & Speiseplan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                KW {selectedWeek}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Täglich frisch gekochte Mittagsmenüs, vegetarische Spezialitäten und Desserts im Tinglev Betriebsrestaurant.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {currentMenu?.pdf_url && (
            <a
              href={getAssetUrl(currentMenu.pdf_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition-all transform active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>PDF-Speiseplan</span>
            </a>
          )}

          {canManageCanteen && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Speiseplan bearbeiten / Verwalten</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Navigator & Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Navigation Arrows & KW Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevWeek}
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Vorherige Kalenderwoche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
            <CalendarIcon className="w-4 h-4 text-amber-600" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Kalenderwoche {w} {w === 35 ? '(Aktuelle Woche)' : ''}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-slate-400">/ {selectedYear}</span>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="Nächste Kalenderwoche"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleJumpToToday}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
          >
            Heute (KW 35)
          </button>
        </div>

        {/* Date Range & Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {currentMenu?.valid_from && currentMenu?.valid_to && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Gültigkeit: {currentMenu.valid_from} bis {currentMenu.valid_to}</span>
            </div>
          )}

          {currentMenu?.erstellt_von_name && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gepflegt von: <strong className="text-slate-800">{currentMenu.erstellt_von_name}</strong></span>
            </div>
          )}

          {/* View Mode Toggle (Tagesansicht vs. Wochenübersicht) */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('tabs')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'tabs'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tagesansicht
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Wochenübersicht (Mo–Fr)
            </button>
          </div>
        </div>

      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-card flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Speiseplan für KW {selectedWeek} wird geladen...</p>
        </div>
      ) : daysData.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-card text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Für Kalenderwoche {selectedWeek} liegt noch kein Speiseplan vor.</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Sobald das Kantinenteam den Menüplan freigibt, können Sie hier alle Gerichte, Preise und Allergene einsehen.
          </p>
          {canManageCanteen && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Speiseplan für KW {selectedWeek} anlegen</span>
            </button>
          )}
        </div>
      ) : viewMode === 'tabs' ? (
        /* TABS VIEW: Day Switcher + Detailed Day Cards */
        <div className="space-y-6">
          
          {/* Weekdays Selector (Montag bis Freitag) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {daysData.map((d, idx) => {
              const isSelected = activeDayIndex === idx;
              const isToday = idx === 1 && selectedWeek === 35; // Tuesday in KW 35
              return (
                <button
                  key={d.tag}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`p-4 rounded-3xl border transition-all text-left relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10 ring-2 ring-amber-400/40 transform -translate-y-0.5'
                      : 'bg-white text-slate-800 border-slate-100 shadow-card hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {d.tag}
                    </span>
                    {isToday && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Heute
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-mono font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {d.datum || `Tag ${idx + 1}`}
                  </span>
                  <div className="mt-3 pt-2 border-t border-slate-200/20 text-[11px] truncate font-medium">
                    {d.gericht_haupt?.titel || 'Kein Angebot'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Day Detail Card */}
          {activeDay && (
            <div className="space-y-6">
              
              {/* Day Header Banner */}
              <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-wider">
                    {activeDay.tag}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Menüauswahl für {activeDay.datum || activeDay.tag}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Ausgabe: 11:30 – 13:45 Uhr</span>
                </div>
              </div>

              {/* 3 Columns: Hauptgericht, Veggie/Vegan, Dessert/Suppe */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Hauptgericht */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="h-44 relative overflow-hidden bg-slate-100">
                    <img
                      src={getDishImage(activeDay.gericht_haupt?.titel, false)}
                      alt={activeDay.gericht_haupt?.titel || 'Hauptgericht'}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-extrabold flex items-center space-x-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tagesgericht 1</span>
                    </div>
                    {activeDay.gericht_haupt?.preis && (
                      <div className="absolute bottom-3 right-3 px-3.5 py-1 rounded-2xl bg-amber-500 text-white text-sm font-black shadow-md">
                        {activeDay.gericht_haupt.preis}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug font-heading">
                        {activeDay.gericht_haupt?.titel || 'Kein Hauptgericht eingetragen'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {activeDay.gericht_haupt?.beschreibung || 'Frisch aus regionalen Zutaten zubereitet.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      {activeDay.gericht_haupt?.kalorien ? (
                        <span className="flex items-center space-x-1 font-semibold text-slate-600">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          <span>{activeDay.gericht_haupt.kalorien}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Warm serviert</span>
                      )}
                      <span className="text-[11px] font-bold text-slate-400">Mitarbeiterpreis</span>
                    </div>
                  </div>
                </div>

                {/* 2. Vegetarisch / Veganes Gericht */}
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="h-44 relative overflow-hidden bg-emerald-50">
                    <img
                      src={getDishImage(activeDay.gericht_vegetarisch_vegan?.titel, true)}
                      alt={activeDay.gericht_vegetarisch_vegan?.titel || 'Veggie Gericht'}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-emerald-900/85 backdrop-blur-md text-white text-[11px] font-extrabold flex items-center space-x-1.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {activeDay.gericht_vegetarisch_vegan?.is_vegan ? 'Vegan 🌱' : 'Vegetarisch 🥗'}
                      </span>
                    </div>
                    {activeDay.gericht_vegetarisch_vegan?.preis && (
                      <div className="absolute bottom-3 right-3 px-3.5 py-1 rounded-2xl bg-emerald-600 text-white text-sm font-black shadow-md">
                        {activeDay.gericht_vegetarisch_vegan.preis}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug font-heading">
                        {activeDay.gericht_vegetarisch_vegan?.titel || 'Keine vegetarische Option'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {activeDay.gericht_vegetarisch_vegan?.beschreibung || 'Frische pflanzliche & vegetarische Zutaten.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      {activeDay.gericht_vegetarisch_vegan?.kalorien ? (
                        <span className="flex items-center space-x-1 font-semibold text-emerald-700">
                          <Flame className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{activeDay.gericht_vegetarisch_vegan.kalorien}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">Klimabewusst & Gesund</span>
                      )}
                      <span className="text-[11px] font-bold text-slate-400">Mitarbeiterpreis</span>
                    </div>
                  </div>
                </div>

                {/* 3. Dessert / Suppe / Allergene */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col justify-between space-y-6">
                  
                  {/* Dessert / Suppe */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-indigo-700">
                        <Coffee className="w-4 h-4 text-indigo-600" />
                        <span>Dessert & Tagessuppe</span>
                      </div>
                      {activeDay.dessert_beilage?.preis && (
                        <span className="px-2.5 py-0.5 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-200">
                          {activeDay.dessert_beilage.preis}
                        </span>
                      )}
                    </div>
                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                      <p className="text-xs font-bold text-slate-800">
                        {activeDay.dessert_beilage?.titel || 'Frisches Tagesdessert & Beilagensalat'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Optional an der Salat- & Dessertbar erhältlich.
                      </p>
                    </div>
                  </div>

                  {/* Allergen-Hinweise des Tages */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Allergene & Zusatzstoffe ({activeDay.tag})</span>
                    </label>
                    {activeDay.allergene_zusatzstoffe && activeDay.allergene_zusatzstoffe.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activeDay.allergene_zusatzstoffe.map((code) => (
                          <span
                            key={code}
                            className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold"
                            title={ALLERGEN_DICT[code] || code}
                          >
                            {code}: {ALLERGEN_DICT[code] || code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Keine deklarationspflichtigen Allergene hinterlegt.
                      </p>
                    )}
                  </div>

                  {/* Canteen Payment info */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Zahlung kontaktlos mit Mitarbeiterausweis oder EC-Karte.</span>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      ) : (
        /* GRID VIEW: Full 5-Day Weekly Matrix */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {daysData.map((day, i) => {
            const isToday = i === 1 && selectedWeek === 35;
            return (
              <div
                key={day.tag}
                className={`bg-white rounded-3xl border shadow-card overflow-hidden flex flex-col justify-between ${
                  isToday ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-100'
                }`}
              >
                {/* Header */}
                <div className={`p-4 ${isToday ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-800'} border-b border-slate-100`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs uppercase tracking-wider">{day.tag}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800">
                        Heute
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] font-mono mt-0.5 ${isToday ? 'text-amber-100' : 'text-slate-400'}`}>
                    {day.datum || `Tag ${i + 1}`}
                  </p>
                </div>

                {/* Day Content */}
                <div className="p-4 space-y-4 flex-1">
                  
                  {/* Hauptgericht */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Hauptgericht</span>
                      <span className="text-amber-600 font-extrabold">{day.gericht_haupt?.preis}</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 leading-snug">
                      {day.gericht_haupt?.titel || '–'}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {day.gericht_haupt?.beschreibung || ''}
                    </p>
                  </div>

                  {/* Veggie */}
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase">
                      <span>{day.gericht_vegetarisch_vegan?.is_vegan ? 'Vegan 🌱' : 'Veggie 🥗'}</span>
                      <span className="text-emerald-700 font-extrabold">{day.gericht_vegetarisch_vegan?.preis}</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 leading-snug">
                      {day.gericht_vegetarisch_vegan?.titel || '–'}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {day.gericht_vegetarisch_vegan?.beschreibung || ''}
                    </p>
                  </div>

                  {/* Dessert */}
                  {day.dessert_beilage?.titel && (
                    <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">Dessert</span>
                      <p className="font-semibold text-slate-700">{day.dessert_beilage.titel}</p>
                    </div>
                  )}

                </div>

                {/* Allergens Footer */}
                {day.allergene_zusatzstoffe && day.allergene_zusatzstoffe.length > 0 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                    Allergene: {day.allergene_zusatzstoffe.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Information Cards: Öffnungszeiten & Allergen-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Card 1: Öffnungszeiten */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center space-x-3 text-slate-900">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm font-heading">Öffnungszeiten Betriebsrestaurant</h3>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold">Frühstück & Kaffeebar:</span>
              <span className="font-mono font-bold text-slate-800">07:30 – 10:00 Uhr</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="font-semibold">Warmer Mittagstisch:</span>
              <span className="font-mono font-bold text-slate-800">11:30 – 13:45 Uhr</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold">Snacks & Getränke:</span>
              <span className="font-mono font-bold text-slate-800">Ganztägig (Automaten)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Kontakt & Feedback */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center space-x-3 text-slate-900">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm font-heading">Kantinenteam & Catering</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <p>Für Meeting-Bewirtungen, Gästeanmeldungen oder Sonderwünsche (Allergien):</p>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-semibold text-slate-700">
              <p>📞 Interner Durchruf: <span className="font-mono text-indigo-600 font-bold">140</span></p>
              <p>✉️ E-Mail: <span className="text-indigo-600">kantine@tinglev.de</span></p>
            </div>
          </div>
        </div>

        {/* Card 3: Allergen-Legende Kurzinfo */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center space-x-3 text-slate-900">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm font-heading">Allergen-Kennzeichnung</h3>
          </div>
          <div className="text-xs text-slate-500 space-y-1.5">
            <p>Alle Gerichte werden mit standardisierten Allergen-Kürzeln gekennzeichnet:</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {['A (Gluten)', 'C (Ei)', 'D (Fisch)', 'G (Milch)', 'H (Nüsse)', 'L (Sellerie)', 'M (Senf)'].map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold text-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Modal Management for Canteen Managers */}
      {isModalOpen && (
        <CanteenMenuModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialWeek={selectedWeek}
          initialYear={selectedYear}
          existingMenu={currentMenu?.id > 0 ? currentMenu : null}
          onSaved={(savedMenu) => {
            loadMenu(selectedWeek, selectedYear);
          }}
        />
      )}

    </div>
  );
}
