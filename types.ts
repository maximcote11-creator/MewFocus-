
export enum Priority {
  URGENT = "URGENT",
  HAUTE = "HAUTE",
  MOYENNE = "MOYENNE",
  BASSE = "BASSE"
}

export enum TaskCategory {
  TACHE = "TACHE",
  SUIVI = "SUIVI",
  RECURRENTE = "RECURRENTE",
  PROJET = "PROJET"
}

export enum RecurrenceFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY"
}

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[]; // 0-6
  quarters?: number[]; // 1-4
  endDate?: number; // Timestamp
}

export interface TaskNotification {
  id: string;
  type: 'OFFSET' | 'CUSTOM';
  offsetMinutes?: number; // minutes before
  customTimestamp?: number; // specific date
  label: string;
}

export enum AccountType {
  PERSONAL = "PERSONAL",
  WORK = "WORK"
}

export interface Employee {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  employees: Employee[];
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: number; // Timestamp
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  completed: boolean;
  isCancelled?: boolean;
  isPostponed?: boolean;
  createdAt: number;
  dueDate?: number;
  accountId: string;
  employeeId?: string;
  icon?: string;
  subTasks?: SubTask[];
  recurrence?: RecurrenceConfig;
  notifications?: TaskNotification[];
}
