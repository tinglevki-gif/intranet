import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { OrgChartCanvas } from '../components/orgchart/OrgChartCanvas';
import { OrgChartColumnar } from '../components/orgchart/OrgChartColumnar';
import { OrgChartNode } from '../components/orgchart/OrgChartNode';
import { OrgChartBlocks } from '../components/orgchart/OrgChartBlocks';
import { OrgChartHorizontal } from '../components/orgchart/OrgChartHorizontal';
import { EmployeeDetailModal } from '../components/orgchart/EmployeeDetailModal';
import { 
  Network, 
  Search, 
  Columns3, 
  LayoutGrid, 
  GitFork, 
  MoveHorizontal, 
  Maximize2, 
  Minimize2, 
  Users, 
  Check, 
  Building, 
  Filter, 
  Printer, 
  X,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export function OrgChartPage() {
  const { t } = useLanguage();
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controls & state
  const [viewMode, setViewMode] = useState('hybrid'); // 'hybrid' | 'tree' | 'blocks' | 'horizontal'
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [density, setDensity] = useState('detailed'); // 'detailed' | 'compact'
  const [search, setSearch] = useState('');
  const [allExpanded, setAllExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Selected employee for detail modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch org chart hierarchy data
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

  // Extract list of all unique departments for filter dropdown
  const departmentList = useMemo(() => {
    const set = new Set();
    function traverse(node) {
      if (node.department) set.add(node.department);
      if (node.children) node.children.forEach(traverse);
    }
    treeData.forEach(traverse);
    return Array.from(set).sort();
  }, [treeData]);

  // Statistics calculation
  const stats = useMemo(() => {
    let count = 0;
    let leaders = 0;
    function traverse(node) {
      count++;
      if (node.children && node.children.length > 0) leaders++;
      if (node.children) node.children.forEach(traverse);
    }
    treeData.forEach(traverse);
    return {
      total: count,
      leaders: leaders,
      departments: departmentList.length
    };
  }, [treeData, departmentList]);

  // Filter tree data by department if a specific department is selected
  const filteredTreeData = useMemo(() => {
    if (selectedDepartment === 'ALL') {
      return treeData;
    }

    // Helper: returns cloned node if it or any child matches department
    function filterNode(node) {
      const selfMatches = node.department === selectedDepartment;
      let matchedChildren = [];
      if (node.children) {
        matchedChildren = node.children
          .map(filterNode)
          .filter(Boolean);
      }
      if (selfMatches || matchedChildren.length > 0) {
        return {
          ...node,
          children: matchedChildren
        };
      }
      return null;
    }

    return treeData
      .map(filterNode)
      .filter(Boolean);
  }, [treeData, selectedDepartment]);

  const handleCopyPhone = (phone) => {
    navigator.clipboard?.writeText?.(phone);
    setToastMessage(`${t('phone_directory.copied') || 'Kopiert'}: ${phone}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 pb-16 ${isFullscreen ? 'p-0 space-y-0' : ''}`}>
      {/* Top Header Card (hidden during fullscreen) */}
      {!isFullscreen && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-tinglev-blue to-cyan-500 text-white flex items-center justify-center shadow-md">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {t('org_chart.title')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-tinglev-blue/10 text-tinglev-blue border border-tinglev-blue/20">
                  V6.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t('org_chart.subtitle')}
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Users className="w-4 h-4 text-tinglev-blue" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{stats.total}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1">{t('org_chart.stats_total_members')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Building className="w-4 h-4 text-purple-500" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{stats.departments}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1">{t('org_chart.stats_departments')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Toolbar & View Selector */}
      <div className={`bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 print:hidden ${
        isFullscreen ? 'hidden' : ''
      }`}>
        {/* Left: View Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setViewMode('hybrid')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              viewMode === 'hybrid'
                ? 'bg-white dark:bg-slate-700 text-tinglev-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            title={t('org_chart.view_hybrid_desc')}
          >
            <Columns3 className="w-4 h-4" />
            <span>{t('org_chart.view_hybrid')}</span>
          </button>

          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              viewMode === 'tree'
                ? 'bg-white dark:bg-slate-700 text-tinglev-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            title={t('org_chart.view_tree_desc')}
          >
            <GitFork className="w-4 h-4" />
            <span>{t('org_chart.view_tree')}</span>
          </button>

          <button
            onClick={() => setViewMode('blocks')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              viewMode === 'blocks'
                ? 'bg-white dark:bg-slate-700 text-tinglev-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            title={t('org_chart.view_blocks_desc')}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{t('org_chart.view_blocks')}</span>
          </button>

          <button
            onClick={() => setViewMode('horizontal')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              viewMode === 'horizontal'
                ? 'bg-white dark:bg-slate-700 text-tinglev-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            title={t('org_chart.view_horizontal_desc')}
          >
            <MoveHorizontal className="w-4 h-4" />
            <span>{t('org_chart.view_horizontal')}</span>
          </button>
        </div>

        {/* Right: Filters, Search, Density & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter Selector */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-tinglev-blue/20 cursor-pointer appearance-none"
            >
              <option value="ALL">{t('org_chart.all_departments')}</option>
              {departmentList.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('org_chart.search_placeholder')}
              className="w-full pl-9 pr-7 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-tinglev-blue/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Density Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setDensity('detailed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                density === 'detailed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('org_chart.density_detailed')}
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                density === 'compact'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('org_chart.density_compact')}
            </button>
          </div>

          {/* Expand/Collapse All */}
          <button
            onClick={() => setAllExpanded(!allExpanded)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title={allExpanded ? t('org_chart.collapse_all') : t('org_chart.expand_all')}
          >
            {allExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {allExpanded ? t('org_chart.collapse_all') : t('org_chart.expand_all')}
            </span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Drucken / PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center space-x-2 shadow-xl animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Infinite Canvas */}
      {loading ? (
        <div className="bg-slate-50/60 dark:bg-slate-950/80 rounded-3xl p-16 border border-slate-200/80 dark:border-slate-800 min-h-[600px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-tinglev-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('org_chart.loading')}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-3xl p-12 border border-rose-200 dark:border-rose-800 text-center text-rose-600 text-sm font-semibold">
          {error}
        </div>
      ) : filteredTreeData.length === 0 ? (
        <div className="bg-slate-50/60 dark:bg-slate-950/80 rounded-3xl p-16 border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-sm">
          {t('org_chart.empty')}
        </div>
      ) : (
        <OrgChartCanvas
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          contentKey={`${viewMode}-${selectedDepartment}-${density}`}
        >
          {/* Layout Mode Switcher Render */}
          {viewMode === 'hybrid' && (
            <OrgChartColumnar
              roots={filteredTreeData}
              density={density}
              searchQuery={search}
              allExpanded={allExpanded}
              onSelectEmployee={setSelectedEmployee}
              onCopyPhone={handleCopyPhone}
            />
          )}

          {viewMode === 'tree' && (
            <div className="flex flex-col items-center gap-12 p-8 min-w-max">
              {filteredTreeData.map((root) => (
                <OrgChartNode
                  key={root.id}
                  node={root}
                  density={density}
                  searchQuery={search}
                  allExpanded={allExpanded}
                  onSelectEmployee={setSelectedEmployee}
                  onCopyPhone={handleCopyPhone}
                />
              ))}
            </div>
          )}

          {viewMode === 'blocks' && (
            <OrgChartBlocks
              roots={filteredTreeData}
              density={density}
              searchQuery={search}
              onSelectEmployee={setSelectedEmployee}
              onCopyPhone={handleCopyPhone}
            />
          )}

          {viewMode === 'horizontal' && (
            <OrgChartHorizontal
              roots={filteredTreeData}
              density={density}
              searchQuery={search}
              allExpanded={allExpanded}
              onSelectEmployee={setSelectedEmployee}
              onCopyPhone={handleCopyPhone}
            />
          )}
        </OrgChartCanvas>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          node={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSelectEmployee={(sub) => setSelectedEmployee(sub)}
          onCopyPhone={handleCopyPhone}
        />
      )}
    </div>
  );
}
