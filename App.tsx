
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, TaskCategory, SubTask, Account, AccountType, Employee } from './types';
import TaskCard from './components/TaskCard';
import VoiceAssistant from './components/VoiceAssistant';
import AddTaskModal from './components/AddTaskModal';
import { breakdownTaskAI } from './services/gemini';
import { CATEGORY_ICONS } from './constants';

type Tab = 'FOCUS' | 'HISTORIQUE' | 'SETTINGS';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_perso', name: 'Personnel', type: AccountType.PERSONAL, employees: [] },
  { id: 'acc_work1', name: 'Travail 1', type: AccountType.WORK, employees: [] },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [currentAccountId, setCurrentAccountId] = useState<string>(DEFAULT_ACCOUNTS[0].id);
  const [currentTab, setCurrentTab] = useState<Tab>('FOCUS');
  
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userName, setUserName] = useState('Utilisateur');
  
  const [newAccountName, setNewAccountName] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState('');

  const filterScrollRef = useRef<HTMLDivElement>(null);

  const currentAccount = accounts.find(a => a.id === currentAccountId) || accounts[0];

  useEffect(() => {
    const savedTasks = localStorage.getItem('mewfocus_tasks');
    const savedAccounts = localStorage.getItem('mewfocus_accounts');
    const savedUser = localStorage.getItem('mewfocus_user');
    const savedAccId = localStorage.getItem('mewfocus_current_acc_id');

    if (savedTasks) try { setTasks(JSON.parse(savedTasks)); } catch (e) {}
    if (savedAccounts) try { setAccounts(JSON.parse(savedAccounts)); } catch (e) {}
    if (savedUser) setUserName(savedUser);
    if (savedAccId) setCurrentAccountId(savedAccId);
  }, []);

  useEffect(() => {
    localStorage.setItem('mewfocus_tasks', JSON.stringify(tasks));
    localStorage.setItem('mewfocus_accounts', JSON.stringify(accounts));
    localStorage.setItem('mewfocus_current_acc_id', currentAccountId);
  }, [tasks, accounts, currentAccountId]);

  useEffect(() => {
    setActiveFilter('ALL');
  }, [currentAccountId]);

  const scrollFilters = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      const scrollAmount = 240;
      filterScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const resetFilters = () => {
    setActiveFilter('ALL');
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleAddTask = (data: any) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 11),
      ...data,
      completed: false,
      createdAt: Date.now(),
      accountId: currentAccountId,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateAccountName = (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingAccountId(null);
      return;
    }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
    setEditingAccountId(null);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        return { ...t, completed: !t.completed, isCancelled: false, isPostponed: false };
      }
      return t;
    }));
  };

  const cancelTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCancelled: !t.isCancelled, completed: false, isPostponed: false } : t));
  };

  const postponeTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isPostponed: !t.isPostponed, completed: false, isCancelled: false } : t));
  };

  const deleteTask = (id: string) => { 
    if (window.confirm("❗ Supprimer définitivement cette mission ?")) {
      setTasks(prev => prev.filter(t => t.id !== id)); 
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subTasks: t.subTasks?.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) } : t));
  };

  const handleBreakdown = async (task: Task) => {
    setIsAIProcessing(true);
    try {
      const steps = await breakdownTaskAI(task.title, task.description);
      const newSubTasks: SubTask[] = steps.map(step => ({ id: Math.random().toString(36).substring(2, 9), title: step, completed: false }));
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subTasks: newSubTasks } : t));
    } finally { setIsAIProcessing(false); }
  };

  const currentAccTasks = tasks.filter(t => t.accountId === currentAccountId);

  // LOGIQUE DE PROGRÈS AMÉLIORÉE :
  // On ne compte que les missions pertinentes (Actives ou Terminées). 
  // Les reportées ou annulées ne doivent pas pénaliser le score de focus.
  const relevantTasks = currentAccTasks.filter(t => !t.isCancelled && !t.isPostponed);
  const completedTasks = relevantTasks.filter(t => t.completed).length;
  const totalRelevant = relevantTasks.length;
  
  const completionRate = totalRelevant > 0 ? Math.round((completedTasks / totalRelevant) * 100) : 0;

  const renderFocus = () => {
    const baseTasks = currentAccTasks.filter(t => !t.completed && !t.isCancelled && !t.isPostponed);

    const categoryFilters = Object.values(TaskCategory).map(cat => ({
      id: `CAT_${cat}`,
      label: cat,
      icon: CATEGORY_ICONS[cat]
    }));

    const renderDividedView = () => {
      const members = [
        { id: null, name: 'Moi' },
        ...currentAccount.employees
      ];

      return (
        <div className="space-y-12 pb-10">
          {members.map(member => {
            const memberTasks = baseTasks.filter(t => member.id === null ? !t.employeeId : t.employeeId === member.id);
            if (memberTasks.length === 0 && activeFilter === 'TEAM') return null;

            return (
              <div key={member.id || 'me'} className="animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-4 mb-4 px-1">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${member.id === null ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-900 text-white border-slate-800'}`}>
                      {member.id === null ? '👤' : '👥'}
                   </div>
                   <div className="flex-1">
                      <h4 className="text-base font-black text-slate-900 leading-tight">{member.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{memberTasks.length} mission(s) active(s)</p>
                   </div>
                   <div className="h-[2px] flex-1 bg-slate-100 rounded-full"></div>
                </div>
                
                <div className="space-y-3">
                   {memberTasks.length === 0 ? (
                     <div className="p-6 rounded-[24px] border-2 border-dashed border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 italic">Libre comme l'air ! ✨</p>
                     </div>
                   ) : (
                     memberTasks.map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onToggle={toggleTask} 
                          onDelete={deleteTask} 
                          onCancel={cancelTask} 
                          onPostpone={postponeTask} 
                          onBreakdown={handleBreakdown} 
                          onToggleSubtask={toggleSubtask} 
                          employees={currentAccount.employees} 
                        />
                     ))
                   )}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const activeTasks = baseTasks.filter(t => {
      if (activeFilter === 'ALL' || activeFilter === 'TEAM') return true;
      if (activeFilter.startsWith('CAT_')) return t.category === activeFilter.replace('CAT_', '');
      if (activeFilter === 'EMP_ME') return !t.employeeId;
      if (activeFilter.startsWith('EMP_')) return t.employeeId === activeFilter.replace('EMP_', '');
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex items-center gap-2 mb-8 bg-slate-100/50 p-2 rounded-[28px] border border-slate-200 shadow-sm">
           <button 
              onClick={resetFilters}
              className={`w-12 h-12 flex-shrink-0 rounded-[20px] flex items-center justify-center transition-all duration-300 border-2 shadow-sm active:scale-90 ${activeFilter !== 'ALL' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-300 border-slate-200'}`}
              title="Réinitialiser les filtres"
           >
              <i className="fas fa-arrow-left text-sm"></i>
           </button>

           <div className="w-[1px] h-8 bg-slate-200 flex-shrink-0"></div>

           <div ref={filterScrollRef} className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar relative px-1">
            <div className="flex items-center gap-2 flex-shrink-0 py-1">
               <button 
                  onClick={() => setActiveFilter('ALL')} 
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                  🌟 Tout
                </button>
                
                {currentAccount.type === AccountType.WORK && (
                  <button 
                    onClick={() => setActiveFilter('TEAM')} 
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === 'TEAM' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}
                  >
                    👥 Vue Équipe
                  </button>
                )}
            </div>
            
            <div className="w-[1px] h-6 bg-slate-200 flex-shrink-0"></div>

            <div className="flex items-center gap-2 flex-shrink-0 py-1">
              {categoryFilters.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setActiveFilter(f.id)} 
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeFilter === f.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-[1px] h-8 bg-slate-200 flex-shrink-0"></div>

          <button 
              onClick={() => scrollFilters('right')}
              className="w-12 h-12 flex-shrink-0 rounded-[20px] bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm hover:text-indigo-600 hover:border-indigo-100 active:scale-90 transition-all"
           >
              <i className="fas fa-arrow-right text-sm"></i>
           </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {activeFilter === 'ALL' ? 'Missions Actives' : activeFilter === 'TEAM' ? 'Équipe' : 'Filtrage'}
            </h3>
            <div className="flex-1 h-[1px] bg-slate-100"></div>
          </div>

          {activeFilter === 'TEAM' ? renderDividedView() : (
            activeTasks.length === 0 ? (
              <div className="text-center py-20 px-4 glass-card rounded-[32px] border-dashed border-2 border-slate-200">
                 <div className="text-4xl mb-4">✨</div>
                 <p className="text-slate-900 font-black text-base">Rien à signaler ici !</p>
                 <p className="text-slate-500 text-sm font-bold mt-1 leading-relaxed">Changez de filtre ou lancez une mission avec +.</p>
              </div>
            ) : (
              activeTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask} 
                  onCancel={cancelTask} 
                  onPostpone={postponeTask} 
                  onBreakdown={handleBreakdown} 
                  onToggleSubtask={toggleSubtask} 
                  employees={currentAccount.employees} 
                />
              ))
            )
          )}
        </div>
      </div>
    );
  };

  const renderHistorique = () => {
    const completed = currentAccTasks.filter(t => t.completed);
    const cancelled = currentAccTasks.filter(t => t.isCancelled);
    const postponed = currentAccTasks.filter(t => t.isPostponed && !t.completed && !t.isCancelled);
    const pending = currentAccTasks.filter(t => !t.completed && !t.isCancelled && !t.isPostponed);
    
    const history = [...completed, ...cancelled, ...postponed].sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-300 pb-20">
        <h2 className="text-2xl font-black text-slate-900">Bilan & Stats 📊</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-[28px] border-t-4 border-emerald-600 shadow-sm">
             <div className="text-2xl font-black text-emerald-700">{completed.length}</div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Réalisées ✨</div>
          </div>
          <div className="glass-card p-5 rounded-[28px] border-t-4 border-slate-500 shadow-sm">
             <div className="text-2xl font-black text-slate-900">{cancelled.length}</div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Annulées 🧊</div>
          </div>
          <div className="glass-card p-5 rounded-[28px] border-t-4 border-orange-600 shadow-sm">
             <div className="text-2xl font-black text-orange-700">{postponed.length}</div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reportées ⏳</div>
          </div>
          <div className="glass-card p-5 rounded-[28px] border-t-4 border-indigo-600 shadow-sm">
             <div className="text-2xl font-black text-indigo-700">{pending.length}</div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En cours 🕒</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest px-1">Journal d'activité</h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12 italic font-medium glass-card rounded-3xl border-dashed border-2">Journal vide.</p>
          ) : (
            history.map(t => (
              <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm ${t.completed ? 'bg-emerald-100 text-emerald-700' : t.isPostponed ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                    <i className={`fas ${t.completed ? 'fa-check-circle' : t.isPostponed ? 'fa-clock' : 'fa-times-circle'}`}></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold truncate ${t.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</span>
                    <span className="text-[10px] text-slate-500 font-black uppercase">{t.isPostponed ? 'REPORTÉE' : t.completed ? 'TERMINÉE' : 'ANNULÉE'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.isPostponed && (
                    <button onClick={() => postponeTask(t.id)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg text-[10px] font-black">REACTIVER</button>
                  )}
                  <button onClick={() => deleteTask(t.id)} className="text-slate-300 hover:text-red-500 transition-colors p-3">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const addAccount = (name: string, type: AccountType) => {
    if (!name.trim()) return;
    const newAcc: Account = { id: 'acc_' + Math.random().toString(36).substring(2, 9), name, type, employees: [] };
    setAccounts([...accounts, newAcc]);
    setNewAccountName('');
  };

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 pt-8">
      <div className="sticky top-0 z-[100] bg-slate-50/95 backdrop-blur-xl -mx-4 px-4 py-3 mb-6 border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {accounts.map(acc => (
            <button key={acc.id} onClick={() => setCurrentAccountId(acc.id)} className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-[11px] font-black border-2 transition-all ${currentAccountId === acc.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              <i className={`fas ${acc.type === AccountType.WORK ? 'fa-briefcase' : 'fa-user'} mr-2`}></i>{acc.name}
            </button>
          ))}
      </div>

      <header className="mb-8 relative animate-in fade-in duration-500">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">MewFocus 🐾</h1>
            <p className="text-indigo-700 font-black text-xs uppercase opacity-80 italic tracking-tight">{currentAccount.name}</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 active:scale-90 transition-all border-b-4 border-indigo-800"
          >
            <i className="fas fa-plus text-2xl"></i>
          </button>
        </div>

        {currentTab === 'FOCUS' && (
          <div className="glass-card p-6 rounded-[32px] border border-indigo-100 flex flex-col gap-4 shadow-md mb-6 relative overflow-hidden">
            {completionRate === 100 && (
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none"></div>
            )}
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Progrès Focus</span>
              <span className={`text-2xl font-black transition-colors ${completionRate === 100 ? 'text-emerald-600' : 'text-indigo-700'}`}>
                {completionRate}% {completionRate === 100 && '🏆'}
              </span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${completionRate === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600'}`} 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      <main className="min-h-[60vh]">
        {currentTab === 'FOCUS' && renderFocus()}
        {currentTab === 'HISTORIQUE' && renderHistorique()}
        {currentTab === 'SETTINGS' && (
          <div className="space-y-10 pb-20">
            <h2 className="text-2xl font-black text-slate-900">Préférences ⚙️</h2>
            <section className="space-y-4">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-widest">Nom</label>
              <input 
                type="text" 
                value={userName} 
                onChange={e => { setUserName(e.target.value); localStorage.setItem('mewfocus_user', e.target.value); }}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-900 shadow-sm text-base"
              />
            </section>
            
            <section className="space-y-4">
               <label className="block text-xs font-black text-slate-900 uppercase tracking-widest">Espaces de travail</label>
               <div className="space-y-3 mb-4">
                 {accounts.map(acc => (
                   <div key={acc.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${acc.id === currentAccountId ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.02]' : 'border-slate-200 bg-white shadow-sm'}`}>
                     <div className="flex-1 min-w-0">
                       {editingAccountId === acc.id ? (
                         <input 
                           autoFocus
                           type="text"
                           value={editAccName}
                           onChange={(e) => setEditAccName(e.target.value)}
                           onBlur={() => updateAccountName(acc.id, editAccName)}
                           onKeyDown={(e) => e.key === 'Enter' && updateAccountName(acc.id, editAccName)}
                           className="w-full bg-white border-b-4 border-indigo-600 outline-none font-black py-2 px-3 rounded-t-lg text-slate-900 text-base"
                         />
                       ) : (
                         <div className="flex flex-col cursor-pointer" onClick={() => { setEditingAccountId(acc.id); setEditAccName(acc.name); }}>
                           <span className="font-black text-slate-900 truncate text-base">{acc.name}</span>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{acc.type}</span>
                         </div>
                       )}
                     </div>
                     <div className="flex items-center gap-1 ml-3">
                       <button onClick={() => { setEditingAccountId(acc.id); setEditAccName(acc.name); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><i className="fas fa-edit"></i></button>
                       <button onClick={() => { if(window.confirm("Supprimer cet espace ?")) setAccounts(accounts.filter(a => a.id !== acc.id)); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><i className="fas fa-trash"></i></button>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newAccountName} 
                   onChange={e => setNewAccountName(e.target.value)} 
                   className="flex-1 px-5 py-3 rounded-xl border-2 border-slate-200 bg-white text-base font-bold text-slate-900 focus:border-indigo-600 outline-none" 
                   placeholder="Nom..." 
                 />
                 <button onClick={() => addAccount(newAccountName, AccountType.PERSONAL)} className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-[10px] font-black">+ PERSO</button>
                 <button onClick={() => addAccount(newAccountName, AccountType.WORK)} className="bg-slate-900 text-white px-4 py-3 rounded-xl text-[10px] font-black">+ PRO</button>
               </div>
            </section>

            <button onClick={() => { if(window.confirm("Réinitialiser ? Toutes les données seront perdues.")) { localStorage.clear(); window.location.reload(); } }} className="w-full py-5 text-red-600 font-black border-4 border-red-50 rounded-3xl text-sm uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">Reset Complet</button>
          </div>
        )}
      </main>

      <VoiceAssistant onNewTask={(title, priority) => handleAddTask({ title, priority, category: TaskCategory.TACHE, description: "" })} />
      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddTask} currentAccount={currentAccount} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-200 px-6 py-5 flex justify-around items-center z-[150] shadow-[0_-15px_45px_rgba(0,0,0,0.08)]">
        {[
          { id: 'FOCUS', icon: 'fa-rocket', label: 'Focus' },
          { id: 'HISTORIQUE', icon: 'fa-chart-pie', label: 'Bilan' },
          { id: 'SETTINGS', icon: 'fa-user-gear', label: 'Profil' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as Tab)}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${currentTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all ${currentTab === tab.id ? 'bg-indigo-50 shadow-inner border border-indigo-100' : ''}`}>
              <i className={`fas ${tab.icon} text-xl`}></i>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>

      {isAIProcessing && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
          <div className="w-24 h-24 border-[10px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-8 shadow-2xl shadow-indigo-100"></div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Mew prépare le plan... 🧩</h2>
          <p className="text-slate-500 font-bold text-sm max-w-xs leading-relaxed italic">Je découpe ta mission en micro-étapes !</p>
        </div>
      )}
    </div>
  );
};

export default App;
