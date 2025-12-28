
import React from 'react';
import { Priority, TaskCategory } from './types';

export const PRIORITY_CONFIG = {
  [Priority.URGENT]: { color: 'bg-red-50 text-red-700 border-red-500', label: 'Urgent', icon: '🔥' },
  [Priority.HAUTE]: { color: 'bg-orange-50 text-orange-700 border-orange-500', label: 'Haute', icon: '⚡' },
  [Priority.MOYENNE]: { color: 'bg-blue-50 text-blue-700 border-blue-500', label: 'Moyenne', icon: '🔵' },
  [Priority.BASSE]: { color: 'bg-slate-50 text-slate-700 border-slate-300', label: 'Basse', icon: '⚪' },
};

export const CATEGORY_ICONS = {
  [TaskCategory.TACHE]: '📝',
  [TaskCategory.SUIVI]: '📊',
  [TaskCategory.RECURRENTE]: '🔄',
  [TaskCategory.PROJET]: '🚀',
};
