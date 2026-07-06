import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { attendanceAPI } from '@/utils/api';
import { formatDate, formatTime, statusBadge } from '@/utils/format';
import { HiOutlineSearch } from 'react-icons/hi';

export default function AttendancePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) loadRecords();
  }, [isAuthenticated]);

  const loadRecords = async () => {
    try {
      const res = await attendanceAPI.today();
      setRecords(res.data.results || res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      r.employee_name?.toLowerCase().includes(q) ||
      r.employee_matricule?.toLowerCase().includes(q);
    const matchesDate = !filterDate || r.date === filterDate;
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesDate && matchesStatus;
  });

  if (authLoading || loading) return (
    <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></Layout>
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pointages</h1>
          <p className="text-gray-500 mt-1">Suivi des pointages en temps réel</p>
        </div>
        <button onClick={loadRecords} className="btn-secondary">
          <HiOutlineSearch className="w-4 h-4" /> Actualiser
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input sm:w-48" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input sm:w-40">
            <option value="">Tous statuts</option>
            <option value="PRESENT">Présent</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Retard</option>
            <option value="EARLY_LEAVE">Départ anticipé</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Employé</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Département</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Entrée</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Sortie</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Statut</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Méthode</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">GPS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const badge = statusBadge(r.status);
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                          {r.photo ? (
                            <img src={r.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                              {r.employee_name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{r.employee_name}</p>
                          <p className="text-xs text-gray-500">{r.employee_matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{r.department_name}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(r.date)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatTime(r.check_in)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatTime(r.check_out)}</td>
                    <td className="py-3 px-4"><span className={badge.class}>{badge.label}</span></td>
                    <td className="py-3 px-4 text-gray-600">{r.check_in_method === 'QR_CODE' ? 'QR Code' : 'Manuel'}</td>
                    <td className="py-3 px-4">
                      {r.gps_latitude ? (
                        <span className="text-xs text-gray-500">
                          {parseFloat(r.gps_latitude).toFixed(4)}, {parseFloat(r.gps_longitude).toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Aucun pointage trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
