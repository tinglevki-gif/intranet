import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Check, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getAvatarUrl } from '../../services/api';

export function OrgChartNode({ 
  node, 
  searchQuery = '', 
  allExpanded = null,
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

  // Auto expand if search query matches node or any child
  const matchesSearch = (item, query) => {
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
  };

  const isMatchedSelf = searchQuery && (
    node.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (searchQuery && matchesSearch(node, searchQuery)) {
      setIsExpanded(true);
    }
  }, [searchQuery]);

  // Role / Level border & badge styling
  const getNodeStyling = () => {
    if (node.role === 'ADMIN') {
      return {
        cardBorder: 'border-rose-500/40 ring-4 ring-rose-500/10 bg-gradient-to-b from-rose-50/50 via-white to-white',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        accentColor: 'text-rose-600',
      };
    }
    if (node.role === 'HR_MANAGER') {
      return {
        cardBorder: 'border-purple-500/40 ring-4 ring-purple-500/10 bg-gradient-to-b from-purple-50/50 via-white to-white',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        accentColor: 'text-purple-600',
      };
    }
    if (node.role === 'IT_ADMIN') {
      return {
        cardBorder: 'border-cyan-500/40 ring-4 ring-cyan-500/10 bg-gradient-to-b from-cyan-50/50 via-white to-white',
        badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        accentColor: 'text-cyan-600',
      };
    }
    return {
      cardBorder: 'border-slate-200 hover:border-indigo-400 bg-white',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      accentColor: 'text-indigo-600',
    };
  };

  const style = getNodeStyling();
  const extension = node.phone ? node.phone.split('-')[1] || `#${100 + node.id}` : `#${100 + node.id}`;

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div 
        className={`w-72 sm:w-80 rounded-3xl p-5 border shadow-card transition-all duration-300 transform hover:-translate-y-1 relative z-10 ${style.cardBorder} ${
          isMatchedSelf ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105 shadow-xl' : ''
        }`}
      >
        {/* Top Header: Department & Extension */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${style.badgeBg} truncate max-w-[170px]`}>
            {node.department}
          </span>
          <button
            onClick={() => onCopyPhone(node.phone || `+49 89 1234-${extension}`)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-mono text-[11px] font-bold transition-colors"
            title="Durchwahl kopieren"
          >
            <Phone className="w-3 h-3" />
            <span>{node.phone ? `#${extension}` : `#${100 + node.id}`}</span>
          </button>
        </div>

        {/* Profile Details */}
        <div className="flex items-start space-x-3.5">
          <div className="relative">
            <img
              src={getAvatarUrl(node.avatar_url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={node.full_name}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
            />
            {node.role === 'ADMIN' && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-3 h-3" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 truncate leading-tight">
              {node.full_name}
            </h4>
            <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
              {node.position}
            </p>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{node.location}</span>
            </div>
          </div>
        </div>

        {/* Contact actions bar */}
        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <a
            href={`mailto:${node.email}`}
            className="flex items-center space-x-1.5 text-slate-600 hover:text-indigo-600 font-medium truncate max-w-[180px] transition-colors"
          >
            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate text-[11px]">{node.email}</span>
          </a>

          {node.mobile && (
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              {node.mobile}
            </span>
          )}
        </div>

        {/* Subordinates Expand/Collapse Button Pill */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex items-center space-x-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-full shadow-md text-[10px] font-bold transition-all z-20 group"
          >
            <Users className="w-3 h-3 text-indigo-500" />
            <span>{node.children.length} {t('org_chart.direct_reports')}</span>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
            )}
          </button>
        )}
      </div>

      {/* Children connector lines and recursive render */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center pt-7 relative w-full">
          {/* Vertical stem line down from parent card */}
          <div className="w-0.5 h-6 bg-slate-300 absolute top-0 left-1/2 -translate-x-1/2"></div>

          {/* Children nodes container with horizontal crossbar */}
          <div className="flex items-start justify-center gap-6 sm:gap-10 pt-4 relative">
            {/* Horizontal connector line spanning all children */}
            {node.children.length > 1 && (
              <div 
                className="h-0.5 bg-slate-300 absolute top-0"
                style={{
                  left: `${100 / (node.children.length * 2)}%`,
                  right: `${100 / (node.children.length * 2)}%`,
                }}
              ></div>
            )}

            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical drop line down into each child */}
                <div className="w-0.5 h-4 bg-slate-300 absolute -top-4 left-1/2 -translate-x-1/2"></div>
                <OrgChartNode 
                  node={child} 
                  searchQuery={searchQuery}
                  allExpanded={allExpanded}
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
