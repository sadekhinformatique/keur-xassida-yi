import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: string | Date, fmt = 'dd/MM/yyyy') => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
};

export const formatTime = (date: string | Date | null) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm:ss', { locale: fr });
};

export const formatDateTime = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
};

export const statusBadge = (status: string) => {
  const map: Record<string, { label: string; class: string }> = {
    PRESENT: { label: 'Présent', class: 'badge-success' },
    ABSENT: { label: 'Absent', class: 'badge-danger' },
    LATE: { label: 'Retard', class: 'badge-warning' },
    EARLY_LEAVE: { label: 'Départ anticipé', class: 'badge-warning' },
    HOLIDAY: { label: 'Congé', class: 'badge-info' },
    ACTIF: { label: 'Actif', class: 'badge-success' },
    INACTIF: { label: 'Inactif', class: 'badge-danger' },
    CONGE: { label: 'Congé', class: 'badge-info' },
    SUSPENDU: { label: 'Suspendu', class: 'badge-warning' },
  };
  return map[status] || { label: status, class: 'badge-info' };
};
