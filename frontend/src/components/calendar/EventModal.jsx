import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Tag, 
  Trash2, 
  Check, 
  AlertCircle,
  Building,
  AlignLeft
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export function EventModal({ 
  isOpen, 
  onClose, 
  event, 
  isCreating, 
  initialDate, 
  onSave, 
  onDelete 
}) {
  const { t, formatDate, formatTime } = useLanguage();
  const { user } = useAuth();

  // Form State for creating
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MEETING');
  const [startTime, setStartTime] = useState(
    initialDate ? `${initialDate}T09:00` : new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    initialDate ? `${initialDate}T10:30` : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  if (!isOpen) return null;

  const categories = [
    { value: 'MEETING', label: t('calendar.cat_MEETING'), color: 'bg-blue-500 text-white' },
    { value: 'TOWNHALL', label: t('calendar.cat_TOWNHALL'), color: 'bg-purple-500 text-white' },
    { value: 'TRAINING', label: t('calendar.cat_TRAINING'), color: 'bg-amber-500 text-white' },
    { value: 'HR_EVENT', label: t('calendar.cat_HR_EVENT'), color: 'bg-rose-500 text-white' },
    { value: 'HOLIDAY', label: t('calendar.cat_HOLIDAY'), color: 'bg-emerald-500 text-white' },
    { value: 'COMPANY', label: t('calendar.cat_COMPANY'), color: 'bg-indigo-500 text-white' },
  ];

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'TOWNHALL':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HOLIDAY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRAINING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HR_EVENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'COMPANY':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Bitte geben Sie einen Termintitel an.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end < start) {
      setFormError('Die Endzeit muss nach der Startzeit liegen.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        all_day: allDay,
        location: location.trim() || null,
        category: category,
        department: department === 'ALL' ? null : department,
      });
      onClose();
    } catch (err) {
      setFormError(err.message || 'Fehler beim Anlegen des Termins.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDelete = user?.role === 'ADMIN' || (event && event.created_by_id === user?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isCreating ? t('calendar.modal_create_title') : t('calendar.modal_details_title')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {isCreating ? (
            /* CREATE EVENT FORM */
            <form id="create-event-form" onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  {t('calendar.title_label')} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('calendar.title_placeholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  {t('calendar.category_label')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`p-2 rounded-xl text-left font-semibold border transition-all text-[11px] flex items-center justify-between ${
                        category === cat.value
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      {category === cat.value && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    {t('calendar.start_time_label')}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    {t('calendar.end_time_label')}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="all-day-checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <label htmlFor="all-day-checkbox" className="font-semibold text-slate-700 text-xs cursor-pointer">
                  {t('calendar.all_day_label')}
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  {t('calendar.location_label')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('calendar.location_placeholder')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  {t('calendar.desc_label')}
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('calendar.desc_placeholder')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs"
                ></textarea>
              </div>
            </form>
          ) : (
            /* VIEW EVENT DETAILS */
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(event?.category)}`}>
                    {t(`calendar.cat_${event?.category}`, event?.category)}
                  </span>
                  {event?.department && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {event.department}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {event?.title}
                </h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex items-center space-x-2.5 text-slate-700">
                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {new Date(event?.start_time || event?.start).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {!event?.all_day && (
                      <span className="text-slate-500 ml-2 font-mono">
                        {new Date(event?.start_time || event?.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {new Date(event?.end_time || event?.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {event?.all_day && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {t('calendar.all_day')}
                      </span>
                    )}
                  </div>
                </div>

                {event?.location && (
                  <div className="flex items-center space-x-2.5 text-slate-700">
                    <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-medium text-slate-800">{event.location}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2.5 text-slate-700">
                  <User className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="text-slate-600">
                    {t('calendar.organizer')}: <strong className="text-slate-800">{event?.author_name || 'Tiglev Elementfabrik'}</strong>
                  </span>
                </div>
              </div>

              {event?.is_external && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-950">
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: event.source_color || '#0078D4' }}></span>
                    <span>Synchronisiert aus <strong>Microsoft Outlook ({event.source_name || 'iCal'})</strong></span>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-bold bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                    Schreibgeschützt
                  </span>
                </div>
              )}

              {event?.description && (
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center space-x-1.5">
                    <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('calendar.description')}</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100 text-xs whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {isCreating ? (
            <div className="flex items-center justify-end space-x-2 w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                {t('calendar.cancel')}
              </button>
              <button
                type="submit"
                form="create-event-form"
                disabled={isSubmitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('calendar.save_event')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(event?.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('calendar.delete_event')}</span>
                </button>
              ) : <div></div>}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                {t('calendar.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
