import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { employeesAPI, deptAPI, serviceAPI } from '@/utils/api';
import { statusBadge } from '@/utils/format';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function EditEmployeePage() {
  const { isAuthenticated, loading: authLoading, isRH } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [departments, setDepartments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isRH) router.push('/');
  }, [isAuthenticated, authLoading, isRH, router]);

  useEffect(() => {
    if (isAuthenticated && isRH && id) {
      loadData();
    }
  }, [isAuthenticated, isRH, id]);

  const loadData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        employeesAPI.detail(Number(id)),
        deptAPI.list(),
      ]);
      const emp = empRes.data;
      setForm({
        nom: emp.nom, prenom: emp.prenom, sexe: emp.sexe, matricule: emp.matricule,
        department: emp.department || '', service: emp.service || '', fonction: emp.fonction,
        telephone: emp.telephone, email: emp.email || '', date_embauche: emp.date_embauche,
        statut: emp.statut,
      });
      setPhotoPreview(emp.photo);
      setDepartments(deptRes.data.results || deptRes.data);
      if (emp.department) {
        const svcRes = await serviceAPI.list({ department: emp.department });
        setServices(svcRes.data.results || svcRes.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleChange = async (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
    if (name === 'department') {
      if (value) {
        const svcRes = await serviceAPI.list({ department: value });
        setServices(svcRes.data.results || svcRes.data);
      } else {
        setServices([]);
      }
    }
  };

  const handlePhoto = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setForm((prev: any) => ({ ...prev, photo: file }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v as string);
      });
      if (form.photo && typeof form.photo !== 'string') fd.append('photo', form.photo);
      await employeesAPI.update(Number(id), fd);
      toast.success('Employé mis à jour');
      router.push('/employees');
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <HiOutlineArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier employé</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden border-2 border-dashed border-gray-300">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Photo</div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full cursor-pointer text-xs">+</label>
            </div>
            <div>
              <p className="font-medium text-gray-900">Photo</p>
              <p className="text-sm text-gray-500">JPG, PNG. Max 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
              <select name="sexe" value={form.sexe} onChange={handleChange} className="input">
                <option value="M">Masculin</option><option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
              <input name="matricule" value={form.matricule} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
              <select name="department" value={form.department} onChange={handleChange} className="input">
                <option value="">Sélectionner</option>
                {departments.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select name="service" value={form.service} onChange={handleChange} className="input">
                <option value="">Sélectionner</option>
                {services.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fonction *</label>
              <input name="fonction" value={form.fonction} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
              <input name="telephone" value={form.telephone} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
              <input name="date_embauche" type="date" value={form.date_embauche} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select name="statut" value={form.statut} onChange={handleChange} className="input">
                <option value="ACTIF">Actif</option><option value="INACTIF">Inactif</option>
                <option value="CONGE">Congé</option><option value="SUSPENDU">Suspendu</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
