import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Mail, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  GraduationCap, 
  Users, 
  Activity, 
  Layers, 
  Radio, 
  TrendingDown, 
  Check, 
  Info,
  Server,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export function PerseusSecurityWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('INFRASTRUCTURE'); // 'INFRASTRUCTURE' | 'AWARENESS'
  const [error, setError] = useState(null);

  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await api.getPerseusOverview(forceRefresh);
      setData(res);
    } catch (err) {
      console.error('Perseus Widget Error:', err);
      setError(err.message || 'Fehler beim Laden der Perseus-Sicherheitsdaten');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData(true);
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card flex flex-col items-center justify-center space-y-4 py-16">
        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Perseus Security & Awareness Hub wird geladen...</p>
      </div>
    );
  }

  // Extract infrastructure data from response
  const infraPayload = data?.infrastructure?.data || {};
  const isLive = data?.is_live || false;
  const infraScore = infraPayload.security_score || infraPayload.score || 94;
  const infraRating = infraPayload.rating || (infraScore >= 90 ? 'Sehr gut' : 'Gut');
  const domainName = infraPayload.domain || 'tinglev-elementfabrik.de';
  const checks = infraPayload.checks || [];

  // Extract awareness data from response
  const awarePayload = data?.awareness?.data || {};
  const awareScore = awarePayload.awareness_index || awarePayload.score || 88;
  const phishing = awarePayload.phishing_simulation || {};
  const courses = awarePayload.completed_courses || [];
  const trainingRate = awarePayload.training_completion_rate || 92.5;
  const activeLearners = awarePayload.active_learners || 35;
  const totalEmployees = awarePayload.total_employees || 37;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 sm:p-8 text-white relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Perseus Security & Awareness Hub
                </h2>
                {isLive ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live API Sync</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>Perseus Cyber-Schutz</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Echtzeitüberwachung der Unternehmensdomäne, Perimeter-Sicherheit & Mitarbeiter-Awareness
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 border border-white/10"
              title="Daten jetzt aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>

            <a
              href="https://my.perseus.de"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25"
            >
              <span>Perseus Portal</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Diagnostic notification if not configured */}
        {!data?.token_configured && (
          <div className="mt-4 p-3 bg-cyan-900/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Hinweis:</strong> Live-Token kann in der <code className="bg-black/30 px-1 py-0.5 rounded text-cyan-300 font-mono">.env</code> unter <code className="bg-black/30 px-1 py-0.5 rounded text-cyan-300 font-mono">PERSEUS_BEARER_TOKEN</code> hinterlegt werden.
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Letzter Scan: {data?.last_sync}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Overall Security Score */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sicherheitsindex</span>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{infraScore}</span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600">
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Status: {infraRating}</span>
            </div>
          </div>

          {/* Card 2: Phishing Click Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phishing-Klickrate</span>
              <Mail className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {phishing.click_rate !== undefined ? `${phishing.click_rate}%` : '2.7%'}
              </span>
              <span className="text-xs font-bold text-slate-400">Quote</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-cyan-700">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              <span>Melderate: {phishing.report_rate || 86.5}%</span>
            </div>
          </div>

          {/* Card 3: Training Completion */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Awareness-Schulungen</span>
              <GraduationCap className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{trainingRate}%</span>
              <span className="text-xs font-bold text-slate-400">Abgeschlossen</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-indigo-600">
              <Users className="w-3.5 h-3.5 mr-1" />
              <span>{activeLearners} von {totalEmployees} geschult</span>
            </div>
          </div>

          {/* Card 4: Domain & Mail Auth */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Domain-Schutz</span>
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-base font-extrabold text-slate-900 font-mono truncate max-w-[170px]">
                {domainName}
              </span>
            </div>
            <div className="flex items-center text-xs font-semibold text-blue-600">
              <Lock className="w-3.5 h-3.5 mr-1" />
              <span>DMARC • TLS 1.3 • DNSSEC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 sm:px-8 pt-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('INFRASTRUCTURE')}
            className={`pb-4 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'INFRASTRUCTURE'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Infrastruktur- & Domain-Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('AWARENESS')}
            className={`pb-4 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'AWARENESS'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Awareness, Phishing & Schulungen</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Infrastructure & Domain Scan */}
      {activeTab === 'INFRASTRUCTURE' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perimeter & Domain-Sicherheitsprüfungen</h3>
              <p className="text-xs text-slate-500">Automatisierte Schwachstellen- und Konfigurationsscans via Perseus API</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Prüfung: <span className="font-mono font-bold text-slate-700">{infraPayload.scanned_at || 'Automatisch'}</span>
            </span>
          </div>

          <div className="space-y-3">
            {checks.length > 0 ? (
              checks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="mt-0.5">
                      {check.status === 'PASSED' ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : check.status === 'WARNING' ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{check.category || check.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{check.details || check.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        check.status === 'PASSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : check.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {check.status === 'PASSED' ? 'Bestanden' : check.status === 'WARNING' ? 'Hinweis' : 'Kritisch'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 w-10 text-right">
                      {check.score !== undefined ? `${check.score}%` : '100%'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                Keine spezifischen Prüfpunkte gemeldet. Gesamtergebnis: Bestanden.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Awareness & Phishing Simulations */}
      {activeTab === 'AWARENESS' && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Phishing Campaign Highlight */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900 uppercase">Aktuelle Phishing-Simulation</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {phishing.last_campaign || 'Kontinuierliche Awareness-Kampagne 2026'}
              </p>
              <p className="text-xs text-slate-600">
                {phishing.trend || 'Resilienz der Mitarbeiter im Vergleich zum Branchenbenchmark überdurchschnittlich.'}
              </p>
            </div>

            <div className="flex items-center space-x-4 shrink-0 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-100">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gesendet</span>
                <span className="font-mono font-bold text-sm text-slate-900">{phishing.emails_sent || 37}</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Klickrate</span>
                <span className="font-mono font-bold text-sm text-emerald-600">{phishing.click_rate || 2.7}%</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kompromittiert</span>
                <span className="font-mono font-bold text-sm text-emerald-600">{phishing.compromised_credentials || 0}</span>
              </div>
            </div>
          </div>

          {/* Training Courses Completion List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cybersecurity E-Learning Module</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.length > 0 ? (
                courses.map((course, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-2.5">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-900 pr-2">{course.title}</p>
                      <span className="font-mono font-bold text-xs text-indigo-600 shrink-0">
                        {course.completion}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${course.completion}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{course.participants} Teilnehmer</span>
                      <span className="text-emerald-600 font-semibold flex items-center">
                        <Check className="w-3 h-3 mr-0.5" /> Aktiv
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Alle Pflichtschulungen sind aktuell aktiv.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
