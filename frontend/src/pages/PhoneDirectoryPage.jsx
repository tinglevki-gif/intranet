import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from '../components/common/UserAvatar';
import { 
  PhoneCall, 
  Search, 
  Mail, 
  Phone, 
  Smartphone, 
  MapPin, 
  LayoutGrid, 
  List, 
  Check, 
  Copy, 
  Users, 
  Building,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export function PhoneDirectoryPage() {
  const { t } = useLanguage();
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' or 'TABLE'
  const [toastMessage, setToastMessage] = useState(null);

  const departments = [
    'ALL',
    'Geschäftsführung',
    'Geschäftsentwicklung',
    'Rezeption',
    'Vertriebsabteilung',
    'Kontrolle',
    'Technik',
    'Buchhaltung',
    'Produktion \\ Planung',
    'Abwicklung',
    'IT \\ SuperAdmin'
  ];

  useEffect(() => {
    async function loadDirectory() {
      try {
        setLoading(true);
        const res = await api.getDirectory(search, selectedDept);
        setDirectory(res || []);
      } catch (err) {
        console.error('Phone directory error:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadDirectory, 150);
    return () => clearTimeout(timer);
  }, [search, selectedDept]);

  const handleCall = (name, phone) => {
    setToastMessage(`Wähle ${name} (${phone})...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText?.(text);
    setToastMessage(`${label} ${t('phone_directory.copied')}: ${text}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('phone_directory.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('phone_directory.subtitle')}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Counter */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-400">
            {directory.length} {t('directory.employees_count', 'Mitarbeiter')}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs font-semibold ${
                viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('phone_directory.view_cards')}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t('phone_directory.view_cards')}</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs font-semibold ${
                viewMode === 'TABLE' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title={t('phone_directory.view_table')}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">{t('phone_directory.view_table')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Department Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-card space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('phone_directory.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Department filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {dept === 'ALL' ? t('phone_directory.all_departments') : dept}
            </button>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-blue-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">{t('directory.loading')}</p>
        </div>
      ) : directory.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 text-slate-400 text-sm">
          {t('directory.empty')}
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW OF CONTACT CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {directory.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div>
                {/* Header with Department & Extension Pill */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[140px]">
                    {user.department}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                    {user.extension}
                  </span>
                </div>

                {/* Avatar & User Details */}
                <div className="flex items-center space-x-3.5 mb-4">
                  <UserAvatar
                    src={user.avatar_url}
                    name={user.full_name}
                    size="lg"
                    className="ring-2 ring-slate-100 shadow-xs shrink-0"
                    rounded="rounded-2xl"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {user.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {user.position}
                    </p>
                  </div>
                </div>

                {/* Contact Meta Details */}
                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('phone_directory.ext')}:</span>
                    <button
                      onClick={() => handleCopy(user.phone, t('phone_directory.ext'))}
                      className="font-mono font-bold text-slate-800 hover:text-blue-600 transition-colors"
                      title="Kopieren"
                    >
                      {user.phone || `+49 89 1234-${user.id}`}
                    </button>
                  </div>

                  {user.mobile && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('phone_directory.mobile')}:</span>
                      <button
                        onClick={() => handleCopy(user.mobile, t('phone_directory.mobile'))}
                        className="font-mono text-slate-700 hover:text-blue-600 transition-colors"
                      >
                        {user.mobile}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('phone_directory.location')}:</span>
                    <span className="text-slate-600 truncate max-w-[130px]">{user.location}</span>
                  </div>

                  {user.supervisor_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('phone_directory.supervisor')}:</span>
                      <span className="text-slate-600 truncate max-w-[130px] font-medium">{user.supervisor_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCall(user.full_name, user.phone || `+49 89 1234-${user.id}`)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('phone_directory.call')}</span>
                </button>

                <a
                  href={`mailto:${user.email}`}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shadow-2xs"
                  title={user.email}
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Mitarbeiter</th>
                  <th className="px-6 py-4">Durchwahl</th>
                  <th className="px-6 py-4">Mobil</th>
                  <th className="px-6 py-4">Abteilung</th>
                  <th className="px-6 py-4">Standort</th>
                  <th className="px-6 py-4 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directory.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          src={user.avatar_url}
                          name={user.full_name}
                          size="md"
                          className="ring-2 ring-slate-100"
                          rounded="rounded-full"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{user.full_name}</p>
                          <p className="text-slate-500 text-xs">{user.position}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {user.phone}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                          {user.extension}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-slate-600">{user.mobile || '—'}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium">{user.department}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.location}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleCall(user.full_name, user.phone)}
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title={t('phone_directory.call')}
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <a
                          href={`mailto:${user.email}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title={user.email}
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
