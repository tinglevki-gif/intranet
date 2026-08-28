import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneCall, 
  Network, 
  Calendar, 
  FolderOpen, 
  ArrowRight, 
  Sparkles,
  UtensilsCrossed,
  Navigation as NavIcon,
  TrendingUp,
  Cpu,
  ClipboardCheck,
  CalendarClock,
  GraduationCap,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function ModuleQuickCards() {
  const { t } = useLanguage();
  const { hasModulePermission } = useAuth();
  const navigate = useNavigate();

  const ALL_MODULE_CARDS = [
    {
      key: 'phone-directory',
      path: '/phone-directory',
      icon: PhoneCall,
      gradient: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      badge: t('module_cards.phone_badge', 'Durchwahlen aktiv'),
      title: t('module_cards.phone_title', 'Telefonverzeichnis & Durchwahlen'),
      desc: t('module_cards.phone_desc', 'Direktdurchwahlen, Standorte und E-Mail-Kontakte aller Mitarbeiter.'),
      action: t('module_cards.phone_action', 'Telefonbuch öffnen'),
      accentHover: 'group-hover:text-blue-600',
      actionColor: 'text-blue-600 group-hover:text-blue-700',
      stats: [
        { label: 'IT-Helpdesk (#300)', value: 'Frei', isHighlight: true },
        { label: 'HR-Team (#200)', value: '08:00 - 17:00' }
      ]
    },
    {
      key: 'org-chart',
      path: '/org-chart',
      icon: Network,
      gradient: 'from-indigo-600 to-cyan-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      badge: t('module_cards.org_badge', 'Strukturbaum'),
      title: t('module_cards.org_title', 'Interaktives Organigramm'),
      desc: t('module_cards.org_desc', 'Visueller Hierarchie- und Zuständigkeitsbaum aller Teams und Vorgesetzten.'),
      action: t('module_cards.org_action', 'Organigramm ansehen'),
      accentHover: 'group-hover:text-indigo-600',
      actionColor: 'text-indigo-600 group-hover:text-indigo-700',
      stats: [
        { label: 'Reporting Lines', value: '3 Stufen' },
        { label: 'Teams & Leads', value: '8 Mitarbeiter' }
      ]
    },
    {
      key: 'calendar',
      path: '/calendar',
      icon: Calendar,
      gradient: 'from-purple-600 to-violet-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
      badge: t('module_cards.calendar_badge', 'iCal Sync aktiv'),
      title: t('module_cards.calendar_title', 'Unternehmenskalender & iCal'),
      desc: t('module_cards.calendar_desc', 'Meetings, Firmen-Events, Feiertage und iCalendar-Synchronisation.'),
      action: t('module_cards.calendar_action', 'Kalender anzeigen'),
      accentHover: 'group-hover:text-purple-600',
      actionColor: 'text-purple-600 group-hover:text-purple-700',
      stats: [
        { label: 'All-Hands Q1', value: '28. Feb' },
        { label: 'Product Discovery', value: '02. Mär' }
      ]
    },
    {
      key: 'documents',
      path: '/documents',
      icon: FolderOpen,
      gradient: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      badge: t('module_cards.documents_badge', 'KI-Suche aktiv'),
      title: t('module_cards.documents_title', 'Dokumentenablage & KI-Suche'),
      desc: t('module_cards.documents_desc', 'Sichere Dateiablage, Richtlinien und intelligente KI-Suchassistenz.'),
      action: t('module_cards.documents_action', 'Dokumente & KI öffnen'),
      accentHover: 'group-hover:text-amber-600',
      actionColor: 'text-amber-600 group-hover:text-amber-700',
      stats: [
        { label: 'Urlaubsantrag_2026.pdf', value: 'PDF' },
        { label: 'Brand_Kit_Tiglev.zip', value: 'ZIP' }
      ]
    },
    {
      key: 'kantine',
      path: '/kantine',
      icon: UtensilsCrossed,
      gradient: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      badge: 'Speiseplan',
      title: 'Kantine & Speiseplan',
      desc: 'Tagesmenüs, Vorbestellungen und Allergiker-Hinweise für die Werkskantine.',
      action: 'Speiseplan öffnen',
      accentHover: 'group-hover:text-emerald-600',
      actionColor: 'text-emerald-600 group-hover:text-emerald-700',
      stats: [
        { label: 'Tagesgericht', value: 'Schnitzel & Spätzle' },
        { label: 'Vegetarisch', value: 'Gemüsecurry' }
      ]
    },
    {
      key: 'gps',
      path: '/gps',
      icon: NavIcon,
      gradient: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-100',
      badge: 'Live-Telematik',
      title: 'GPS & Flottenortung',
      desc: 'Echtzeit-Telematik, Fahrzeugstatus und Routenüberwachung des Fuhrparks.',
      action: 'Flotte ansehen',
      accentHover: 'group-hover:text-sky-600',
      actionColor: 'text-sky-600 group-hover:text-sky-700',
      stats: [
        { label: 'Aktive Fahrzeuge', value: '14 Unterwegs' },
        { label: 'Werkshof', value: '6 Bereit' }
      ]
    },
    {
      key: 'vertrieb',
      path: '/vertrieb',
      icon: TrendingUp,
      gradient: 'from-amber-600 to-yellow-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      badge: 'Pipeline',
      title: 'Vertrieb & Sales',
      desc: 'Sales-Pipeline, Großbauprojekte und Kundenangebote im Überblick.',
      action: 'Vertriebsportal',
      accentHover: 'group-hover:text-amber-600',
      actionColor: 'text-amber-600 group-hover:text-amber-700',
      stats: [
        { label: 'Offene Angebote', value: '12 Projekte' },
        { label: 'Auftragsvolumen', value: '€2.4M' }
      ]
    },
    {
      key: 'technik',
      path: '/technik',
      icon: Cpu,
      gradient: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-100',
      badge: 'Telemetrie',
      title: 'Technik & Maschinen',
      desc: 'Maschinenauslastung, Sensorik, Wartungspläne und Reparaturtickets.',
      action: 'Technik-Dashboard',
      accentHover: 'group-hover:text-rose-600',
      actionColor: 'text-rose-600 group-hover:text-rose-700',
      stats: [
        { label: 'Maschinenstatus', value: '100% OK' },
        { label: 'Nächste Wartung', value: 'In 5 Tagen' }
      ]
    },
    {
      key: 'abwicklung',
      path: '/abwicklung',
      icon: ClipboardCheck,
      gradient: 'from-teal-600 to-emerald-600',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-100',
      badge: 'Logistik',
      title: 'Auftragsabwicklung',
      desc: 'Auftragstracking von Statik-Freigabe bis Baustellenlogistik.',
      action: 'Aufträge verwalten',
      accentHover: 'group-hover:text-teal-600',
      actionColor: 'text-teal-600 group-hover:text-teal-700',
      stats: [
        { label: 'In Produktion', value: '7 Aufträge' },
        { label: 'Lieferbereit', value: '3 Chargen' }
      ]
    },
    {
      key: 'schulungen',
      path: '/schulungen',
      icon: GraduationCap,
      gradient: 'from-indigo-500 to-blue-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      badge: 'KI Bot',
      title: 'Schulungen & KI Assistent',
      desc: 'Handbücher, Arbeitssicherheitsunterweisungen und interaktiver KI-Chatbot.',
      action: 'Lernportal öffnen',
      accentHover: 'group-hover:text-indigo-600',
      actionColor: 'text-indigo-600 group-hover:text-indigo-700',
      stats: [
        { label: 'Schulungsmodule', value: '6 Verfügbar' },
        { label: 'KI-Assistent', value: 'Online 24/7' }
      ]
    },
    {
      key: 'tickets',
      path: '/tickets',
      icon: Headphones,
      gradient: 'from-blue-600 to-sky-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
      badge: 'Helpdesk',
      title: 'IT-Helpdesk & Tickets',
      desc: 'Störungsmeldungen, Hardware-Anfragen und IT-Support.',
      action: 'Tickets öffnen',
      accentHover: 'group-hover:text-blue-600',
      actionColor: 'text-blue-600 group-hover:text-blue-700',
      stats: [
        { label: 'Durchschn. Antwortzeit', value: '< 15 Min' },
        { label: 'Support-Status', value: 'Bereit' }
      ]
    }
  ];

  // Strictly filter only cards the user has explicit permissions for
  const visibleCards = ALL_MODULE_CARDS.filter((card) => hasModulePermission(card.key));

  if (visibleCards.length === 0) {
    return null;
  }

  // Display top allowed cards (max 4 on dashboard row for clean aesthetics)
  const displayCards = visibleCards.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>{t('module_cards.section_title', 'Kernmodule im Schnellzugriff')}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {t('module_cards.section_subtitle', 'Direkter Zugriff auf Ihre wichtigsten täglichen Werkzeuge')}
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${displayCards.length >= 4 ? 'lg:grid-cols-4' : displayCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {displayCards.map((card) => {
          const IconComp = card.icon;

          return (
            <div 
              key={card.key}
              onClick={() => navigate(card.path)}
              className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${card.badgeBg}`}>
                    {card.badge}
                  </span>
                </div>

                <h3 className={`text-base font-extrabold text-slate-900 ${card.accentHover} transition-colors`}>
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {card.desc}
                </p>

                {card.stats && card.stats.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {card.stats.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                        <span className="font-medium text-slate-700 truncate">{st.label}</span>
                        <span className={`text-[10px] ${st.isHighlight ? 'font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded' : 'font-semibold text-slate-600'}`}>
                          {st.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold ${card.actionColor}`}>
                <span>{card.action}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
