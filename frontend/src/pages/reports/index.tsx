import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { reportsAPI, employeesAPI, deptAPI, serviceAPI } from '@/utils/api';
import { formatDate, formatTime, statusBadge } from '@/utils/format';
import { HiOutlineDownload, HiOutlineSearch, HiOutlineDocumentReport } from 'react-icons/hi';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { isAuthenticated, loading: authLoading, isRH } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', employee: '', department: '', service: '', status: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isRH) router.push('/');
  }, [isAuthenticated, authLoading, isRH, router]);

  useEffect(() => {
    if (isAuthenticated && isRH) {
      loadFilters();
      loadReport();
    }
  }, [isAuthenticated, isRH]);

  const loadFilters = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        employeesAPI.list(),
        deptAPI.list(),
      ]);
      setEmployees(empRes.data.results || empRes.data);
      setDepartments(deptRes.data.results || deptRes.data);
    } catch { /* ignore */ }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const [listRes, summaryRes] = await Promise.all([
        reportsAPI.list(params),
        reportsAPI.summary(params),
      ]);
      setRecords(listRes.data.results || listRes.data);
      setSummary(summaryRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeptChange = async (deptId: string) => {
    setFilters((prev) => ({ ...prev, department: deptId, service: '' }));
    if (deptId) {
      const res = await serviceAPI.list({ department: deptId });
      setServices(res.data.results || res.data);
    } else {
      setServices([]);
    }
  };

  const exportFile = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      let res;
      const label = { csv: 'CSV', excel: 'Excel', pdf: 'PDF' }[format];
      if (format === 'csv') res = await reportsAPI.exportCSV(params);
      else if (format === 'excel') res = await reportsAPI.exportExcel(params);
      else res = await reportsAPI.exportPDF(params);
      saveAs(new Blob([res.data]), `rapport_pointage.${format === 'excel' ? 'xlsx' : format}`);
      toast.success(`Rapport ${label} téléchargé`);
    } catch { toast.error('Erreur d\'export'); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-500 mt-1">Exportez et analysez les pointages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportFile('csv')} className="btn-secondary text-sm"><HiOutlineDownload className="w-4 h-4" /> CSV</button>
          <button onClick={() => exportFile('excel')} className="btn-secondary text-sm"><HiOutlineDownload className="w-4 h-4" /> Excel</button>
          <button onClick={() => exportFile('pdf')} className="btn-secondary text-sm"><HiOutlineDownload className="w-4 h-4" /> PDF</button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: summary.total, color: 'bg-gray-500' },
            { label: 'Présents', value: summary.present, color: 'bg-green-500' },
            { label: 'Absents', value: summary.absent, color: 'bg-red-500' },
            { label: 'Retards', value: summary.late, color: 'bg-yellow-500' },
            { label: 'Départs', value: summary.early_leave, color: 'bg-orange-500' },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Début</label>
            <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fin</label>
            <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Employé</label>
            <select value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="input text-sm">
              <option value="">Tous</option>
              {employees.map((e: any) => (<option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Département</label>
            <select value={filters.department} onChange={(e) => handleDeptChange(e.target.value)} className="input text-sm">
              <option value="">Tous</option>
              {departments.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
            <select value={filters.service} onChange={(e) => setFilters({ ...filters, service: e.target.value })} className="input text-sm">
              <option value="">Tous</option>
              {services.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input text-sm">
              <option value="">Tous</option>
              <option value="PRESENT">Présent</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Retard</option>
              <option value="EARLY_LEAVE">Départ anticipé</option>
            </select>
          </div>
        </div>
        <button onClick={loadReport} className="btn-primary mt-4">
          <HiOutlineSearch className="w-4 h-4" /> Filtrer
        </button>
      </div>

      {/* Results */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Employé</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Matricule</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Département</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Entrée</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Sortie</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Aucun résultat</td></tr>
              ) : (
                records.map((r: any) => {
                  const badge = statusBadge(r.status);
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{r.employee_name}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{r.employee_matricule}</td>
                      <td className="py-3 px-4 text-gray-600">{r.department_name}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(r.date)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatTime(r.check_in)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatTime(r.check_out)}</td>
                      <td className="py-3 px-4"><span className={badge.class}>{badge.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
