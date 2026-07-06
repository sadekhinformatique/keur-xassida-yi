import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { schedulesAPI, employeesAPI } from '@/utils/api';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function SchedulesPage() {
  const { isAuthenticated, loading: authLoading, isRH } = useAuth();
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', entry_time: '08:00', exit_time: '17:00',
    break_start: '12:00', break_end: '13:00',
    tolerance_minutes: 15, is_default: false,
    days_of_week: [0, 1, 2, 3, 4],
  });

  const daysLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isRH) router.push('/');
  }, [isAuthenticated, authLoading, isRH, router]);

  useEffect(() => {
    if (isAuthenticated && isRH) loadSchedules();
  }, [isAuthenticated, isRH]);

  const loadSchedules = async () => {
    try {
      const res = await schedulesAPI.list();
      setSchedules(res.data.results || res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDayToggle = (day: number) => {
    setForm((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d: number) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await schedulesAPI.update(editing.id, form);
        toast.success('Horaire mis à jour');
      } else {
        await schedulesAPI.create(form);
        toast.success('Horaire créé');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', entry_time: '08:00', exit_time: '17:00', break_start: '12:00', break_end: '13:00', tolerance_minutes: 15, is_default: false, days_of_week: [0, 1, 2, 3, 4] });
      loadSchedules();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet horaire ?')) return;
    try {
      await schedulesAPI.delete(id);
      toast.success('Horaire supprimé');
      loadSchedules();
    } catch { /* ignore */ }
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name, entry_time: s.entry_time?.slice(0, 5), exit_time: s.exit_time?.slice(0, 5),
      break_start: s.break_start?.slice(0, 5) || '', break_end: s.break_end?.slice(0, 5) || '',
      tolerance_minutes: s.tolerance_minutes, is_default: s.is_default, days_of_week: s.days_of_week,
    });
    setShowForm(true);
  };

  if (authLoading || loading) return (
    <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></Layout>
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horaires</h1>
          <p className="text-gray-500 mt-1">Gestion des horaires de travail</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <HiOutlinePlus className="w-5 h-5" /> Nouvel horaire
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifier' : 'Nouvel'} horaire</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrée *</label>
                  <input type="time" value={form.entry_time} onChange={(e) => setForm({ ...form, entry_time: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sortie *</label>
                  <input type="time" value={form.exit_time} onChange={(e) => setForm({ ...form, exit_time: e.target.value })} className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début pause</label>
                  <input type="time" value={form.break_start} onChange={(e) => setForm({ ...form, break_start: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin pause</label>
                  <input type="time" value={form.break_end} onChange={(e) => setForm({ ...form, break_end: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tolérance (minutes)</label>
                <input type="number" value={form.tolerance_minutes} onChange={(e) => setForm({ ...form, tolerance_minutes: parseInt(e.target.value) })} className="input" min={0} max={120} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jours de travail</label>
                <div className="flex gap-2">
                  {daysLabels.map((label, i) => (
                    <button key={i} type="button" onClick={() => handleDayToggle(i)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${form.days_of_week.includes(i) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary">{editing ? 'Mettre à jour' : 'Créer'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {schedules.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 rounded-xl"><HiOutlineClock className="w-6 h-6 text-primary-600" /></div>
              <div>
                <h3 className="font-medium text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-500">
                  {s.entry_time?.slice(0, 5)} - {s.exit_time?.slice(0, 5)}
                  {s.tolerance_minutes > 0 && ` · Tolérance: ${s.tolerance_minutes}min`}
                </p>
                <div className="flex gap-1 mt-1">
                  {daysLabels.map((label, i) => (
                    <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${s.days_of_week?.includes(i) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleEdit(s)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Modifier</button>
              <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:text-red-700 font-medium"><HiOutlineTrash className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {schedules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <HiOutlineClock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun horaire créé</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
