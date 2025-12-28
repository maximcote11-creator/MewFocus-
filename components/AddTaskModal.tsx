
import React, { useState, useEffect } from 'react';
import { Priority, TaskCategory, Account, TaskNotification, RecurrenceFrequency, RecurrenceConfig, SubTask } from '../types';
import { PRIORITY_CONFIG } from '../constants';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: any) => void;
  currentAccount: Account;
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, currentAccount }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MOYENNE);
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.TACHE);
  const [dueDate, setDueDate] = useState('');
  
  // Recurrence
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>(RecurrenceFrequency.DAILY);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedQuarters, setSelectedQuarters] = useState<number[]>([]);
  
  // Project Subtasks
  const [subTasks, setSubTasks] = useState<{title: string, dueDate: string}[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskDate, setNewSubTaskDate] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [showCustomNotif, setShowCustomNotif] = useState(false);
  const [customNotifDate, setCustomNotifDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority(Priority.MOYENNE);
      setDueDate('');
      setCategory(TaskCategory.TACHE);
      setNotifications([]);
      setSubTasks([]);
      setSelectedDays([]);
      setSelectedQuarters([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDay = (idx: number) => {
    setSelectedDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const toggleQuarter = (q: number) => {
    setSelectedQuarters(prev => prev.includes(q) ? prev.filter(item => item !== q) : [...prev, q]);
  };

  const addSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    setSubTasks([...subTasks, { title: newSubTaskTitle, dueDate: newSubTaskDate }]);
    setNewSubTaskTitle('');
    setNewSubTaskDate('');
  };

  const removeSubTask = (idx: number) => setSubTasks(subTasks.filter((_, i) => i !== idx));

  // Fonction pour forcer l'ouverture du calendrier
  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      (e.currentTarget as any).showPicker();
    } catch (err) {
      console.log("Picker not supported on this browser, using default click.");
    }
  };

  const addNotification = (type: '1D' | '1H' | 'CUSTOM') => {
    const id = Math.random().toString(36).substr(2, 9);
    if (type === '1D') {
      setNotifications([...notifications, { id, type: 'OFFSET', offsetMinutes: 1440, label: '1 jour avant' }]);
    } else if (type === '1H') {
      setNotifications([...notifications, { id, type: 'OFFSET', offsetMinutes: 60, label: '1 heure avant' }]);
    } else if (type === 'CUSTOM' && customNotifDate) {
      const formattedDate = new Date(customNotifDate).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      setNotifications([...notifications, { id, type: 'CUSTOM', customTimestamp: new Date(customNotifDate).getTime(), label: formattedDate }]);
      setShowCustomNotif(false);
      setCustomNotifDate('');
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const recurrence: RecurrenceConfig | undefined = category === TaskCategory.RECURRENTE 
      ? { 
          frequency: recurrenceFreq,
          daysOfWeek: recurrenceFreq === RecurrenceFrequency.WEEKLY ? selectedDays : undefined,
          quarters: recurrenceFreq === RecurrenceFrequency.QUARTERLY ? selectedQuarters : undefined
        } 
      : undefined;

    const finalSubTasks: SubTask[] = subTasks.map(st => ({
      id: Math.random().toString(36).substring(2, 9),
      title: st.title,
      completed: false,
      dueDate: st.dueDate ? new Date(st.dueDate).getTime() : undefined
    }));

    onAdd({
      title,
      description,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      notifications,
      recurrence,
      subTasks: category === TaskCategory.PROJET ? finalSubTasks : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar border-t sm:border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">Mission Mew ✨</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 transition-colors hover:bg-slate-200"><i className="fas fa-times"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase mb-2 tracking-widest px-1">Titre</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-600 outline-none font-bold text-slate-900 transition-all text-base shadow-sm" 
                placeholder="C'est quoi l'objectif ?" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-900 uppercase mb-2 tracking-widest px-1">Description / Notes</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={2}
                className="w-full px-5 py-3 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-600 outline-none font-semibold text-slate-900 transition-all text-sm shadow-sm" 
                placeholder="Détaille tes besoins ici..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-900 uppercase mb-3 tracking-widest px-1">Urgence</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(Priority).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-3 px-4 rounded-xl text-[11px] font-black transition-all border-2 flex items-center justify-center gap-2 ${
                    priority === p 
                      ? `${PRIORITY_CONFIG[p].color.split(' ')[1].replace('text-', 'bg-').replace('700', '600')} text-white border-transparent shadow-lg scale-105`
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {PRIORITY_CONFIG[p].icon} {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <label className="block text-[11px] font-black text-slate-900 uppercase mb-2 tracking-widest px-1">🗓️ Échéance finale</label>
                <input 
                  type="datetime-local" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  onClick={handleDateClick}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm appearance-none" 
                />
             </div>
             <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase mb-2 tracking-widest px-1">Type</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)} 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 shadow-sm"
                >
                  {Object.values(TaskCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>

          {category === TaskCategory.RECURRENTE && (
            <div className="p-5 bg-indigo-50 rounded-[28px] border-2 border-indigo-100 animate-in slide-in-from-top-2 space-y-4">
              <label className="block text-[11px] font-black text-indigo-900 uppercase mb-1 tracking-widest text-center">🔄 Fréquence</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(RecurrenceFrequency).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRecurrenceFreq(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                      recurrenceFreq === f ? 'bg-indigo-600 text-white border-transparent' : 'bg-white border-indigo-100 text-indigo-700'
                    }`}
                  >
                    {f === 'DAILY' ? 'JOUR' : f === 'WEEKLY' ? 'HEBDO' : f === 'MONTHLY' ? 'MOIS' : f === 'QUARTERLY' ? 'TRIM' : 'AN'}
                  </button>
                ))}
              </div>

              {recurrenceFreq === RecurrenceFrequency.WEEKLY && (
                <div className="flex justify-between items-center gap-1 animate-in zoom-in-95">
                  {DAYS.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black transition-all border-2 ${
                        selectedDays.includes(i) ? 'bg-indigo-600 text-white border-transparent scale-110 shadow-md' : 'bg-white border-indigo-100 text-indigo-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}

              {recurrenceFreq === RecurrenceFrequency.QUARTERLY && (
                <div className="grid grid-cols-4 gap-2 animate-in zoom-in-95">
                  {QUARTERS.map((q, i) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => toggleQuarter(i + 1)}
                      className={`py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                        selectedQuarters.includes(i + 1) ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'bg-white border-indigo-100 text-indigo-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {category === TaskCategory.PROJET && (
            <div className="p-5 bg-emerald-50 rounded-[28px] border-2 border-emerald-100 space-y-4">
              <label className="block text-[11px] font-black text-emerald-900 uppercase tracking-widest px-1">Plan de vol (Sous-missions)</label>
              
              <div className="space-y-2">
                {subTasks.map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-left">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">{st.title}</span>
                      {st.dueDate && <span className="text-[10px] font-black text-emerald-600">📅 {new Date(st.dueDate).toLocaleDateString()}</span>}
                    </div>
                    <button type="button" onClick={() => removeSubTask(i)} className="text-red-400 p-2"><i className="fas fa-trash"></i></button>
                  </div>
                ))}
              </div>

              <div className="bg-white/50 p-3 rounded-2xl border border-emerald-200 space-y-3">
                 <input 
                   type="text" 
                   value={newSubTaskTitle} 
                   onChange={e => setNewSubTaskTitle(e.target.value)}
                   className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold outline-none focus:border-emerald-500" 
                   placeholder="Titre étape..." 
                 />
                 <div className="flex gap-2">
                   <input 
                     type="date" 
                     value={newSubTaskDate} 
                     onChange={e => setNewSubTaskDate(e.target.value)}
                     onClick={handleDateClick}
                     className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[10px] font-bold outline-none focus:border-emerald-500" 
                   />
                   <button type="button" onClick={addSubTask} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">AJOUTER</button>
                 </div>
              </div>
            </div>
          )}

          <div className="p-5 bg-purple-50 rounded-[28px] border-2 border-purple-100 space-y-4">
             <div className="flex justify-between items-center px-1">
                <label className="block text-[11px] font-black text-purple-900 uppercase tracking-widest">Rappels 🔔</label>
             </div>
             
             {notifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                   {notifications.map(n => (
                     <span key={n.id} className="bg-white px-3 py-1.5 rounded-full text-[10px] font-black text-purple-900 border-2 border-purple-200 flex items-center gap-2 shadow-sm">
                        {n.label} 
                        <button type="button" onClick={() => removeNotification(n.id)} className="text-red-500"><i className="fas fa-times"></i></button>
                     </span>
                   ))}
                </div>
             )}

             <div className="flex gap-2">
                <button type="button" onClick={() => addNotification('1D')} className="flex-1 py-3 bg-white rounded-xl text-[10px] font-black text-purple-900 border-2 border-purple-200 shadow-sm">1 JOUR</button>
                <button type="button" onClick={() => addNotification('1H')} className="flex-1 py-3 bg-white rounded-xl text-[10px] font-black text-purple-900 border-2 border-purple-200 shadow-sm">1 HEURE</button>
                <button type="button" onClick={() => setShowCustomNotif(!showCustomNotif)} className={`flex-1 py-3 rounded-xl text-[10px] font-black shadow-sm ${showCustomNotif ? 'bg-purple-700 text-white' : 'bg-white text-purple-900 border-2 border-purple-200'}`}>AUTRE</button>
             </div>

             {showCustomNotif && (
               <div className="flex gap-2 animate-in slide-in-from-top-2">
                  <input type="datetime-local" value={customNotifDate} onChange={e => setCustomNotifDate(e.target.value)} onClick={handleDateClick} className="flex-1 px-3 py-2 rounded-lg border-2 border-purple-300 bg-white text-xs font-bold" />
                  <button type="button" onClick={() => addNotification('CUSTOM')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black">OK</button>
               </div>
             )}
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all uppercase tracking-widest border-b-4 border-indigo-800">
            Lancer le focus ! ✨
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
