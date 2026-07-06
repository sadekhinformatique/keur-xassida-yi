import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { employeesAPI, deptAPI, serviceAPI } from '@/utils/api';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AddEmployeePage() {
  const { isAuthenticated, loading: authLoading, isRH } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', sexe: 'M', matricule: '',
    department: '', service: '', fonction: '',
    telephone: '', email: '', date_embauche: '', statut: 'ACTIF',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isRH) router.push('/');
  }, [isAuthenticated, authLoading, isRH, router]);

  useEffect(() => {
    if (isAuthenticated && isRH) {
      loadDepartments();
    }
  }, [isAuthenticated, isRH]);

  const loadDepartments = async () => {
    try {
      const res = await deptAPI.list();
      setDepartments(res.data.results || res.data);
    } catch { /* ignore */ }
  };

  const loadServices = async (deptId: string) => {
    if (!deptId) { setServices([]); return; }
    try {
      const res = await serviceAPI.list({ department: deptId });
      setServices(res.data.results || res.data);
    } catch { /* ignore */ }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'department') loadServices(value);
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
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v as string);
      });
      if ((form as any).photo) fd.append('photo', (form as any).photo);
      await employeesAPI.create(fd);
      toast.success('Employé ajouté avec succès');
      router.push('/employees');
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ajouter un employé</h1>

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
              <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full cursor-pointer text-xs">
                +
              </label>
            </div>
            <div>
              <p className="font-medium text-gray-900">Photo de profil</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
              <select name="sexe" value={form.sexe} onChange={handleChange} className="input">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
              <input name="matricule" value={form.matricule} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
              <select name="department" value={form.department} onChange={handleChange} className="input" required>
                <option value="">Sélectionner</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select name="service" value={form.service} onChange={handleChange} className="input">
                <option value="">Sélectionner</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
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
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
                <option value="CONGE">Congé</option>
                <option value="SUSPENDU">Suspendu</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
