
import React, { useState, useRef } from 'react';
import { Task, Priority, Employee } from '../types';
import { PRIORITY_CONFIG } from '../constants';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onPostpone: (id: string) => void;
  onBreakdown: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  employees?: Employee[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onCancel, onPostpone, onBreakdown, onToggleSubtask, employees }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isExpanding, setIsExpanding] = useState(false);
  const touchStart = useRef<number | null>(null);
  
  const ACTION_THRESHOLD = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.touches[0].clientX - touchStart.current;
    if (Math.abs(diff) < 180) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > ACTION_THRESHOLD && !task.completed && !task.isCancelled) {
      onToggle(task.id);
    } else if (swipeOffset < -ACTION_THRESHOLD && !task.completed && !task.isCancelled) {
      onPostpone(task.id);
    }
    setSwipeOffset(0);
    touchStart.current = null;
  };

  const config = PRIORITY_CONFIG[task.priority];

  const formatFullDate = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative mb-4 group overflow-hidden rounded-[28px]">
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-[28px] pointer-events-none">
        <div className={`flex items-center gap-3 transition-all duration-200 ${swipeOffset > 20 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`} style={{ color: '#10b981' }}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-emerald-500 bg-emerald-50 ${swipeOffset > ACTION_THRESHOLD ? 'scale-110 bg-emerald-500 text-white' : ''}`}>
            <i className="fas fa-check text-xl"></i>
          </div>
          <span className="font-black text-sm uppercase tracking-tighter">Terminer</span>
        </div>
        <div className={`flex flex-row-reverse items-center gap-3 transition-all duration-200 ${swipeOffset < -20 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ color: '#f59e0b' }}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-orange-500 bg-orange-50 ${swipeOffset < -ACTION_THRESHOLD ? 'scale-110 bg-orange-500 text-white' : ''}`}>
            <i className="fas fa-clock text-xl"></i>
          </div>
          <span className="font-black text-sm uppercase tracking-tighter">Reporter</span>
        </div>
      </div>

      <div 
        className={`relative z-10 transition-all duration-300 ${isExpanding ? 'scale-[1.02]' : 'scale-100'} cursor-pointer touch-pan-y`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`glass-card p-5 rounded-[28px] border-l-[10px] shadow-lg flex flex-col gap-3 ${config.color} ${task.completed ? 'opacity-60 grayscale-[0.5]' : ''} border-slate-200`}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-4 flex-1 min-w-0" onClick={() => setIsExpanding(!isExpanding)}>
              <button 
                disabled={task.isCancelled} 
                onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} 
                className={`w-9 h-9 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-all ${
                  task.completed ? 'bg-emerald-600 border-emerald-700 text-white shadow-inner' : 'border-slate-300 bg-white hover:border-indigo-400'
                }`}
              >
                {task.completed && <i className="fas fa-check text-sm"></i>}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={`font-black text-base leading-tight mb-2 ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {task.title}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-white/80 shadow-sm border border-slate-100 text-slate-800">
                    {config.icon} {config.label}
                  </span>
                  {task.recurrence && (
                    <span className="text-[9px] font-black text-indigo-900 bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200">
                      🔄 {task.recurrence.frequency}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-[9px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                      <i className="fas fa-calendar-day text-[8px]"></i> {formatFullDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!task.isCancelled && !task.completed && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPostpone(task.id); }} 
                    title="Reporter"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${task.isPostponed ? 'bg-orange-600 text-white border-b-4 border-orange-800' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}
                  >
                    <i className="fas fa-clock"></i>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCancel(task.id); }} 
                    title="Annuler"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-300 shadow-sm"
                  >
                    <i className="fas fa-ban"></i>
                  </button>
                </>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
                title="Supprimer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200 shadow-sm"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          
          {isExpanding && (
            <div className="mt-3 pt-4 border-t-2 border-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-300">
               {task.description && (
                 <div className="bg-white/50 p-4 rounded-2xl mb-4 border border-slate-100 shadow-inner">
                    <p className="text-sm text-slate-900 font-semibold leading-relaxed whitespace-pre-wrap">{task.description}</p>
                 </div>
               )}
               
               {task.subTasks && task.subTasks.length > 0 && (
                 <div className="space-y-3 mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Étapes du plan</h4>
                    {task.subTasks.map(st => (
                      <div key={st.id} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-slate-100 shadow-sm group">
                        <button 
                          onClick={() => onToggleSubtask(task.id, st.id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${st.completed ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-300'}`}
                        >
                          {st.completed && <i className="fas fa-check text-[8px]"></i>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-tight ${st.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{st.title}</p>
                          {st.dueDate && <p className="text-[9px] font-black text-indigo-500 mt-1 uppercase tracking-tight">📅 {formatFullDate(st.dueDate)}</p>}
                        </div>
                      </div>
                    ))}
                 </div>
               )}
               
               {!task.completed && (
                 <button 
                   onClick={() => onBreakdown(task)} 
                   className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
                 >
                   <i className="fas fa-magic"></i> Magie Mew (Auto-découpe) ✨
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
