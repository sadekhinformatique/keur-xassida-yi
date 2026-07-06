import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { attendanceAPI } from '@/utils/api';
import { formatTime, statusBadge } from '@/utils/format';
import {
  HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineClock, HiOutlineArrowRight,
} from 'react-icons/hi';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#eab308', '#f97316'];

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
      const interval = setInterval(loadDashboard, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    try {
      const res = await attendanceAPI.dashboard();
      setData(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const pieData = [
    { name: 'Présents', value: data?.present || 0 },
    { name: 'Absents', value: data?.absent || 0 },
    { name: 'Retards', value: data?.late || 0 },
    { name: 'Départs', value: data?.early_leaves || 0 },
  ];

  const stats = [
    { label: 'Total employés', value: data?.total_employees || 0, icon: HiOutlineUserGroup, color: 'bg-blue-500' },
    { label: 'Présents', value: data?.present || 0, icon: HiOutlineCheckCircle, color: 'bg-green-500' },
    { label: 'Absents', value: data?.absent || 0, icon: HiOutlineXCircle, color: 'bg-red-500' },
    { label: 'Retards', value: data?.late || 0, icon: HiOutlineClock, color: 'bg-yellow-500' },
    { label: 'Départs anticipés', value: data?.early_leaves || 0, icon: HiOutlineArrowRight, color: 'bg-orange-500' },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Aperçu en temps réel des pointages du jour</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-xl`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition du jour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-gray-600">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Pointages hebdomadaires</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.weekly_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day_name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Pointages */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Pointages en direct</h3>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            En direct
          </span>
        </div>

        {data?.live_pointages?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Employé</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Département</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Entrée</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.live_pointages.map((p: any) => {
                  const badge = statusBadge(p.status);
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                            {p.photo ? (
                              <img src={p.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-medium">
                                {p.employee_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.employee_name}</p>
                            <p className="text-xs text-gray-500">{p.employee_matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{p.department_name}</td>
                      <td className="py-3 px-2 text-gray-600">{formatTime(p.check_in)}</td>
                      <td className="py-3 px-2">
                        <span className={badge.class}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <HiOutlineClock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun pointage en cours</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
