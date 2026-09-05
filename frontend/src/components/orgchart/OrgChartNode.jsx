import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Users 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { OrgCard } from './OrgChartColumnar';

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

export function OrgChartNode({ 
  node, 
  density = 'detailed',
  searchQuery = '', 
  allExpanded = null,
  onSelectEmployee,
  onCopyPhone
}) {
  const { t } = useLanguage();
  const hasChildren = node.children && node.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);

  // Synchronize with global expand/collapse toggle
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
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div className="relative">
        <OrgCard
          node={node}
          density={density}
          searchQuery={searchQuery}
          onSelectEmployee={onSelectEmployee}
          onCopyPhone={onCopyPhone}
        />

        {/* Expand / Collapse Pill */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center space-x-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-[10px] font-bold transition-all z-20 group"
          >
            <Users className="w-3 h-3 text-indigo-500" />
            <span>{node.children.length} {t('org_chart.direct_reports')}</span>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            )}
          </button>
        )}
      </div>

      {/* Children connector lines and recursive render */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center pt-8 relative w-full">
          {/* Vertical stem line down from parent card */}
          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 absolute top-0 left-1/2 -translate-x-1/2"></div>

          {/* Children nodes container with horizontal crossbar */}
          <div className="flex items-start justify-center gap-6 sm:gap-10 pt-4 relative">
            {/* Horizontal connector line spanning all children */}
            {node.children.length > 1 && (
              <div 
                className="h-0.5 bg-slate-300 dark:bg-slate-700 absolute top-0"
                style={{
                  left: `${100 / (node.children.length * 2)}%`,
                  right: `${100 / (node.children.length * 2)}%`,
                }}
              ></div>
            )}

            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical drop line down into each child */}
                <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700 absolute -top-4 left-1/2 -translate-x-1/2"></div>
                <OrgChartNode 
                  node={child} 
                  density={density}
                  searchQuery={searchQuery}
                  allExpanded={allExpanded}
                  onSelectEmployee={onSelectEmployee}
                  onCopyPhone={onCopyPhone}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
