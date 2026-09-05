import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

function HorizontalTreeNode({
  node,
  density = 'detailed',
  searchQuery = '',
  allExpanded = null,
  onSelectEmployee,
  onCopyPhone
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
    <div className="flex items-center relative">
      {/* Node Card + Expand Toggle Button */}
      <div className="flex items-center space-x-2 relative z-10">
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

      {/* Children branches sprouting to the right */}
      {hasChildren && isExpanded && (
        <div className="flex items-center pl-8 relative">
          {/* Horizontal trunk line from parent */}
          <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 absolute left-0 top-1/2 -translate-y-1/2"></div>

          {/* Children vertical stack */}
          <div className="flex flex-col justify-center gap-6 relative py-4">
            {/* Vertical crossbar */}
            {node.children.length > 1 && (
              <div 
                className="w-0.5 bg-slate-300 dark:bg-slate-700 absolute left-0"
                style={{
                  top: `${100 / (node.children.length * 2)}%`,
                  bottom: `${100 / (node.children.length * 2)}%`,
                }}
              />
            )}

            {node.children.map((child) => (
              <div key={child.id} className="relative flex items-center pl-4">
                {/* Horizontal branch line into child */}
                <div className="w-4 h-0.5 bg-slate-300 dark:bg-slate-700 absolute left-0 top-1/2 -translate-y-1/2"></div>
                <HorizontalTreeNode
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

export function OrgChartHorizontal({
  roots = [],
  density = 'detailed',
  searchQuery = '',
  allExpanded = null,
  onSelectEmployee,
  onCopyPhone
}) {
  if (!roots || roots.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-12 p-8 min-w-max">
      {roots.map((root) => (
        <HorizontalTreeNode
          key={root.id}
          node={root}
          density={density}
          searchQuery={searchQuery}
          allExpanded={allExpanded}
          onSelectEmployee={onSelectEmployee}
          onCopyPhone={onCopyPhone}
        />
      ))}
    </div>
  );
}
