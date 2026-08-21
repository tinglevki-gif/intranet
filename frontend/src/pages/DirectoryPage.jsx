import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RoleBadge } from '../components/common/Badge';
import { Users, Search, Mail, Phone, MapPin, Building } from 'lucide-react';

export function DirectoryPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');

  const departments = [
    { key: 'ALL', label: t('directory.all_departments') },
    { key: 'Geschäftsleitung', label: 'Geschäftsleitung' },
    { key: 'Fertigung & Produktion', label: 'Fertigung & Produktion' },
    { key: 'Technik & Instandhaltung', label: 'Technik & Instandhaltung' },
    { key: 'Statik & Konstruktion', label: 'Statik & Konstruktion' },
    { key: 'Vertrieb & Kalkulation', label: 'Vertrieb & Kalkulation' },
    { key: 'Logistik & Fuhrpark', label: 'Logistik & Fuhrpark' },
    { key: 'Personal & HR', label: 'Personal & HR' },
    { key: 'IT & Systeme', label: 'IT & Systeme' }
  ];

  useEffect(() => {
    async function loadDirectory() {
      try {
        setLoading(true);
        const deptParam = department === 'ALL' ? '' : department;
        const res = await api.getUsers(search, deptParam);
        setUsers(res || []);
      } catch (err) {
        console.error('Error cargando directorio:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadDirectory();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, department]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('directory.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('directory.subtitle')}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('directory.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {departments.map((dept) => (
          <button
            key={dept.key}
            onClick={() => setDepartment(dept.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              department === dept.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {dept.label}
          </button>
        ))}
      </div>

      {/* Grid of Colleague Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          {t('common.loading')}
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-card">
          <p className="text-slate-400 text-sm font-medium">{t('directory.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-14 h-14 rounded-2xl object-cover ring-4 ring-slate-50 shadow-sm"
                  />
                  <RoleBadge role={user.role} />
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {user.full_name}
                  </h3>
                  <p className="text-xs font-medium text-indigo-600 mt-0.5">
                    {user.position}
                  </p>
                </div>

                <div className="mt-4 space-y-2 pt-4 border-t border-slate-50 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{user.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
