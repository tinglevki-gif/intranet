import React from 'react';
import { 
  Building, 
  Users, 
  Phone, 
  Mail, 
  ShieldCheck, 
  UserCheck, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { UserAvatar } from '../common/UserAvatar';
import { OrgCard } from './OrgChartColumnar';

// Helper to flatten a branch into a list of members with hierarchy level
function flattenSubordinates(node, level = 1) {
  let list = [];
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      list.push({ ...child, treeLevel: level });
      list = list.concat(flattenSubordinates(child, level + 1));
    });
  }
  return list;
}

export function OrgChartBlocks({
  roots = [],
  density = 'detailed',
  searchQuery = '',
  onSelectEmployee,
  onCopyPhone
}) {
  const { t } = useLanguage();

  if (!roots || roots.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-10 p-8 min-w-max">
      {roots.map((root) => {
        const branches = root.children || [];

        return (
          <div key={root.id} className="flex flex-col items-center relative">
            {/* Top Root Node (Executive / Geschäftsführung) */}
            <div className="relative z-20">
              <OrgCard
                node={root}
                density="detailed"
                searchQuery={searchQuery}
                onSelectEmployee={onSelectEmployee}
                onCopyPhone={onCopyPhone}
                className="ring-4 ring-rose-500/20 shadow-xl"
              />
            </div>

            {/* Department Blocks Grid */}
            {branches.length > 0 && (
              <div className="flex flex-col items-center pt-8 relative w-full">
                {/* Vertical line down from Root */}
                <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 absolute top-0 left-1/2 -translate-x-1/2"></div>

                {/* Horizontal branch crossbar */}
                <div className="flex items-start justify-center gap-6 sm:gap-8 pt-4 relative">
                  {branches.length > 1 && (
                    <div 
                      className="h-0.5 bg-slate-300 dark:bg-slate-700 absolute top-0"
                      style={{
                        left: `${100 / (branches.length * 2)}%`,
                        right: `${100 / (branches.length * 2)}%`,
                      }}
                    />
                  )}

                  {branches.map((branchHead) => {
                    const allStaff = flattenSubordinates(branchHead, 1);
                    const totalDeptCount = 1 + allStaff.length;

                    return (
                      <div key={branchHead.id} className="relative flex flex-col items-center">
                        {/* Drop line from crossbar */}
                        <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700 absolute -top-4 left-1/2 -translate-x-1/2"></div>

                        {/* Structured Department Box (Image 2 style) */}
                        <div className="w-72 sm:w-80 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden flex flex-col">
                          {/* Box Header: Department & Leader */}
                          <div 
                            onClick={() => onSelectEmployee?.(branchHead)}
                            className="p-4 bg-gradient-to-r from-tinglev-blue/10 via-indigo-50/50 to-white dark:from-tinglev-blue/20 dark:via-slate-800/80 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-indigo-50/80 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-tinglev-blue text-white shadow-xs truncate max-w-[170px]">
                                {branchHead.department}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                                <Users className="w-2.5 h-2.5 text-indigo-500" />
                                <span>{totalDeptCount} Personen</span>
                              </span>
                            </div>

                            <div className="flex items-center space-x-3">
                              <UserAvatar
                                src={branchHead.avatar_url}
                                name={branchHead.full_name}
                                size="md"
                                rounded="rounded-2xl"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                  Bereichsleitung
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                                  {branchHead.full_name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {branchHead.position}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Box Body: Grouped List of Subordinate Roles & Offices */}
                          <div className="p-3 space-y-1.5 max-h-96 overflow-y-auto">
                            {allStaff.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                Keine weiteren Unterabteilungen
                              </div>
                            ) : (
                              allStaff.map((staff, idx) => {
                                const ext = staff.phone ? staff.phone.split('-')[1] || `#${100 + staff.id}` : `#${100 + staff.id}`;
                                const isMatched = searchQuery && (
                                  staff.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  staff.position?.toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                return (
                                  <div
                                    key={staff.id}
                                    onClick={() => onSelectEmployee?.(staff)}
                                    className={`p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-indigo-50/70 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors flex items-center justify-between ${
                                      isMatched ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                                    }`}
                                    style={{
                                      marginLeft: `${Math.min((staff.treeLevel - 1) * 8, 24)}px`
                                    }}
                                  >
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      <UserAvatar
                                        src={staff.avatar_url}
                                        name={staff.full_name}
                                        size="xs"
                                        rounded="rounded-lg"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                          {staff.full_name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          {staff.position}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="flex items-center space-x-1 shrink-0 ml-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCopyPhone?.(staff.phone || `+49 89 1234-${ext}`);
                                        }}
                                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Durchwahl kopieren"
                                      >
                                        <Phone className="w-3 h-3" />
                                      </button>
                                      <span className="text-[10px] font-mono text-slate-400">
                                        {staff.phone ? `#${ext}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
