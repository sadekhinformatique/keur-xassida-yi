import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { employeesAPI, deptAPI, serviceAPI } from '@/utils/api';
import { statusBadge } from '@/utils/format';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const { isAuthenticated, loading: authLoading, isRH } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isRH) router.push('/');
  }, [isAuthenticated, authLoading, isRH, router]);

  useEffect(() => {
    if (isAuthenticated && isRH) {
      loadData();
    }
  }, [isAuthenticated, isRH]);

  const loadData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        employeesAPI.list(),
        deptAPI.list(),
      ]);
      setEmployees(empRes.data.results || empRes.data);
      setDepartments(deptRes.data.results || deptRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    try {
      await employeesAPI.delete(id);
      toast.success('Employé supprimé');
      loadData();
    } catch { /* ignore */ }
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      e.nom?.toLowerCase().includes(q) ||
      e.prenom?.toLowerCase().includes(q) ||
      e.matricule?.toLowerCase().includes(q);
    const matchesDept = !filterDept || e.department === parseInt(filterDept);
    const matchesStatus = !filterStatus || e.statut === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employés</h1>
          <p className="text-gray-500 mt-1">{employees.length} employés</p>
        </div>
        <Link href="/employees/add" className="btn-primary">
          <HiOutlinePlus className="w-5 h-5" />
          Ajouter
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="input sm:w-48">
            <option value="">Tous départements</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input sm:w-40">
            <option value="">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="CONGE">Congé</option>
            <option value="SUSPENDU">Suspendu</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Employé</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Matricule</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Département</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Fonction</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Téléphone</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Statut</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const badge = statusBadge(emp.statut);
                return (
                  <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                          {emp.photo ? (
                            <img src={emp.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 font-medium">
                              {emp.nom?.charAt(0)}{emp.prenom?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={`/employees/${emp.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                            {emp.nom} {emp.prenom}
                          </Link>
                          <p className="text-xs text-gray-500">{emp.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{emp.matricule}</td>
                    <td className="py-3 px-4 text-gray-600">{emp.department_name}</td>
                    <td className="py-3 px-4 text-gray-600">{emp.fonction}</td>
                    <td className="py-3 px-4 text-gray-600">{emp.telephone}</td>
                    <td className="py-3 px-4"><span className={badge.class}>{badge.label}</span></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.nom} ${emp.prenom}`)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun employé trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
