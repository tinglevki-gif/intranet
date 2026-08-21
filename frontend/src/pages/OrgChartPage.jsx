import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { OrgChartNode } from '../components/orgchart/OrgChartNode';
import { 
  Network, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Users, 
  Check, 
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';

export function OrgChartPage() {
  const { t } = useLanguage();
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [allExpanded, setAllExpanded] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    async function loadOrgChart() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getOrgChart();
        setTreeData(data || []);
      } catch (err) {
        console.error('Error fetching org chart:', err);
        setError(err.message || 'Fehler beim Laden des Organigramms.');
      } finally {
        setLoading(false);
      }
    }
    loadOrgChart();
  }, []);

  const handleCopyPhone = (phone) => {
    navigator.clipboard?.writeText?.(phone);
    setToastMessage(`${t('phone_directory.copied')}: ${phone}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('org_chart.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('org_chart.subtitle')}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{t('org_chart.legend_executive')}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>{t('org_chart.legend_management')}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>{t('org_chart.legend_lead')}</span>
          </div>
        </div>
      </div>

      {/* Action Controls Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('org_chart.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Tree view buttons & Zoom controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setAllExpanded(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title={t('org_chart.expand_all')}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('org_chart.expand_all')}</span>
          </button>

          <button
            onClick={() => setAllExpanded(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title={t('org_chart.collapse_all')}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('org_chart.collapse_all')}</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Zoom In / Out / Reset */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors"
              title={t('org_chart.zoom_out')}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono font-bold text-slate-600 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors"
              title={t('org_chart.zoom_in')}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors"
              title={t('org_chart.zoom_reset')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Org Chart Visual Canvas */}
      <div 
        ref={containerRef}
        className="bg-slate-50/50 rounded-3xl p-6 sm:p-12 border border-slate-200/80 min-h-[600px] overflow-auto shadow-inner flex justify-center relative"
      >
        {loading ? (
          <div className="m-auto text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium text-slate-500">{t('org_chart.loading')}</p>
          </div>
        ) : error ? (
          <div className="m-auto text-center text-rose-500 text-sm">
            {error}
          </div>
        ) : treeData.length === 0 ? (
          <div className="m-auto text-center text-slate-400 text-sm">
            Keine Hierarchiedaten gefunden.
          </div>
        ) : (
          <div 
            className="transition-transform duration-200 origin-top flex flex-col items-center gap-12"
            style={{ transform: `scale(${zoom})` }}
          >
            {treeData.map((rootNode) => (
              <OrgChartNode
                key={rootNode.id}
                node={rootNode}
                searchQuery={search}
                allExpanded={allExpanded}
                onCopyPhone={handleCopyPhone}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
