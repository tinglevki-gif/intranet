import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Building 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { UserAvatar } from '../common/UserAvatar';

// Helper to check if search query matches node or any descendant
function matchesSearch(item, query) {
  if (!query) return false;
  const q = query.toLowerCase();
  const selfMatches =
    item.full_name?.toLowerCase().includes(q) ||
    item.position?.toLowerCase().includes(q) ||
    item.department?.toLowerCase().includes(q) ||
    item.email?.toLowerCase().includes(q) ||
    item.phone?.toLowerCase().includes(q);
  if (selfMatches) return true;
  if (item.children) {
    return item.children.some(child => matchesSearch(child, query));
  }
  return false;
}

// Single Card Component (Compact or Detailed)
export function OrgCard({ 
  node, 
  density = 'detailed', 
  searchQuery = '', 
  onSelectEmployee, 
  onCopyPhone,
  className = ''
}) {
  const { t } = useLanguage();
  const isMatched = searchQuery && (
    node.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleStyle = () => {
    if (node.role === 'ADMIN') {
      return {
        cardBorder: 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/10 bg-gradient-to-b from-rose-50/60 via-white to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900',
        badge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-700',
        accent: 'text-rose-600 dark:text-rose-400'
      };
    }
    if (node.role === 'MANAGEMENT' || node.role === 'HR_MANAGER') {
      return {
        cardBorder: 'border-purple-400 dark:border-purple-700 ring-2 ring-purple-500/10 bg-gradient-to-b from-purple-50/60 via-white to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900',
        badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700',
        accent: 'text-purple-600 dark:text-purple-400'
      };
    }
    if (node.role === 'IT_ADMIN') {
      return {
        cardBorder: 'border-cyan-400 dark:border-cyan-700 ring-2 ring-cyan-500/10 bg-gradient-to-b from-cyan-50/60 via-white to-white dark:from-cyan-950/30 dark:via-slate-900 dark:to-slate-900',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-200 dark:border-cyan-700',
        accent: 'text-cyan-600 dark:text-cyan-400'
      };
    }
    return {
      cardBorder: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500',
      badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      accent: 'text-indigo-600 dark:text-indigo-400'
    };
  };

  const style = getRoleStyle();
  const extension = node.phone ? node.phone.split('-')[1] || `#${100 + node.id}` : `#${100 + node.id}`;

  if (density === 'compact') {
    return (
      <div
        onClick={() => onSelectEmployee?.(node)}
        className={`w-64 rounded-2xl p-3 border shadow-xs hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-0.5 ${style.cardBorder} ${
          isMatched ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105 shadow-xl z-20' : ''
        } ${className}`}
      >
        <div className="flex items-center space-x-2.5">
          <UserAvatar
            src={node.avatar_url}
            name={node.full_name}
            size="sm"
            rounded="rounded-xl"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {node.full_name}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {node.position}
            </p>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${style.badge} shrink-0`}>
            {node.department?.slice(0, 8)}
          </span>
        </div>
      </div>
    );
  }

  // Detailed Card
  return (
    <div
      onClick={() => onSelectEmployee?.(node)}
      className={`w-72 sm:w-76 rounded-3xl p-4 sm:p-5 border shadow-card hover:shadow-xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 relative z-10 ${style.cardBorder} ${
        isMatched ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105 shadow-2xl z-20' : ''
      } ${className}`}
    >
      {/* Top Header: Department badge & Extension */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${style.badge} truncate max-w-[150px]`}>
          {node.department}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyPhone?.(node.phone || `+49 89 1234-${extension}`);
          }}
          className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold transition-colors"
          title="Durchwahl kopieren"
        >
          <Phone className="w-3 h-3" />
          <span>{node.phone ? `#${extension}` : `#${100 + node.id}`}</span>
        </button>
      </div>

      {/* Profile Details */}
      <div className="flex items-start space-x-3.5">
        <div className="relative">
          <UserAvatar
            src={node.avatar_url}
            name={node.full_name}
            size="md"
            className="ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs shrink-0"
            rounded="rounded-2xl"
          />
          {node.role === 'ADMIN' && (
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {node.full_name}
          </h4>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {node.position}
          </p>
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{node.location || 'Hauptsitz Tinglev'}</span>
          </div>
        </div>
      </div>

      {/* Contact Link */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[180px]">
          <Mail className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{node.email}</span>
        </span>

        {node.children && node.children.length > 0 && (
          <span className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
            <Users className="w-2.5 h-2.5" />
            <span>{node.children.length}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// Vertical Column Sub-Tree (Step-Tree / L-Connectors for subordinates)
function ColumnSubTree({
  node,
  density = 'detailed',
  searchQuery = '',
  allExpanded = null,
  onSelectEmployee,
  onCopyPhone,
  depth = 0
}) {
  const hasChildren = node.children && node.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (allExpanded !== null) {
      setIsExpanded(allExpanded);
    }
  }, [allExpanded]);

  useEffect(() => {
    if (searchQuery && matchesSearch(node, searchQuery)) {
      setIsExpanded(true);
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col items-start relative w-full">
      {/* Node Row with optional toggle */}
      <div className="flex items-center space-x-2 relative w-full">
        <OrgCard
          node={node}
          density={density}
          searchQuery={searchQuery}
          onSelectEmployee={onSelectEmployee}
          onCopyPhone={onCopyPhone}
        />

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors shrink-0"
            title={isExpanded ? 'Einklappen' : 'Ausklappen'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Children vertical stack with step connector lines */}
      {hasChildren && isExpanded && (
        <div className="relative pl-6 sm:pl-8 mt-3 space-y-3 w-full">
          {/* Vertical spine line */}
          <div className="absolute top-0 bottom-4 left-3 w-0.5 bg-slate-300 dark:bg-slate-700"></div>

          {node.children.map((child) => (
            <div key={child.id} className="relative flex items-center">
              {/* Horizontal step hook connector line */}
              <div className="absolute -left-3 top-6 w-3 h-0.5 bg-slate-300 dark:bg-slate-700"></div>

              <ColumnSubTree
                node={child}
                density={density}
                searchQuery={searchQuery}
                allExpanded={allExpanded}
                onSelectEmployee={onSelectEmployee}
                onCopyPhone={onCopyPhone}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Full Hybrid / Columnar Layout Component
export function OrgChartColumnar({
  roots = [],
  density = 'detailed',
  searchQuery = '',
  allExpanded = null,
  onSelectEmployee,
  onCopyPhone
}) {
  const { t } = useLanguage();

  if (!roots || roots.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-12 p-8 min-w-max">
      {roots.map((root) => {
        const hasBranches = root.children && root.children.length > 0;

        return (
          <div key={root.id} className="flex flex-col items-center relative">
            {/* Top Root Card (Geschäftsführung) */}
            <div className="relative z-20">
              <OrgCard
                node={root}
                density={density}
                searchQuery={searchQuery}
                onSelectEmployee={onSelectEmployee}
                onCopyPhone={onCopyPhone}
                className="ring-4 ring-rose-500/20 shadow-xl"
              />
            </div>

            {/* Sub-department horizontal branch row */}
            {hasBranches && (
              <div className="flex flex-col items-center pt-8 relative w-full">
                {/* Vertical stem line down from Root */}
                <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 absolute top-0 left-1/2 -translate-x-1/2"></div>

                {/* Horizontal crossbar connecting top-level department heads */}
                <div className="flex items-start justify-center gap-8 sm:gap-12 pt-4 relative">
                  {root.children.length > 1 && (
                    <div 
                      className="h-0.5 bg-slate-300 dark:bg-slate-700 absolute top-0"
                      style={{
                        left: `${100 / (root.children.length * 2)}%`,
                        right: `${100 / (root.children.length * 2)}%`,
                      }}
                    />
                  )}

                  {root.children.map((deptDirector) => (
                    <div key={deptDirector.id} className="relative flex flex-col items-center">
                      {/* Vertical drop line down into each column head */}
                      <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700 absolute -top-4 left-1/2 -translate-x-1/2"></div>

                      {/* The entire department cascades in this vertical column */}
                      <div className="flex flex-col items-start bg-slate-100/40 dark:bg-slate-900/40 p-3 sm:p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 min-w-[280px]">
                        <ColumnSubTree
                          node={deptDirector}
                          density={density}
                          searchQuery={searchQuery}
                          allExpanded={allExpanded}
                          onSelectEmployee={onSelectEmployee}
                          onCopyPhone={onCopyPhone}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
