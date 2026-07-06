import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { settingsAPI } from '@/utils/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '', address: '', primary_color: '#2563eb',
    secondary_color: '#1e40af', accent_color: '#0ea5e9',
    notification_email: '', notification_sms: false,
    auto_generate_qr: true, qr_duration_seconds: 30,
    enable_gps: false, enable_face_recognition: false,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isAdmin) router.push('/');
  }, [isAuthenticated, authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) loadSettings();
  }, [isAuthenticated, isAdmin]);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setForm((prev) => ({ ...prev, ...res.data }));
      if (res.data.logo) setLogoPreview(res.data.logo);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleLogo = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      setForm((prev: any) => ({ ...prev, logo: file }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'logo') fd.append(k, String(v));
      });
      if ((form as any).logo && typeof (form as any).logo !== 'string') {
        fd.append('logo', (form as any).logo);
      }
      await settingsAPI.update(fd);
      toast.success('Paramètres enregistrés');
    } catch { toast.error('Erreur d\'enregistrement'); }
    setSaving(false);
  };

  if (authLoading || loading) return (
    <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 mt-1">Configuration de l'entreprise</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Entreprise</h2>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-xs">Logo</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="absolute -bottom-1 -right-1 bg-primary-600 text-white p-1.5 rounded-full cursor-pointer text-xs">+</label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Logo entreprise</p>
                <p className="text-xs text-gray-500">PNG, JPG. Max 2MB</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
              <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" rows={2} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Personnalisation</h2>

            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'primary_color', label: 'Couleur principale' },
                { key: 'secondary_color', label: 'Secondaire' },
                { key: 'accent_color', label: 'Accent' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                    <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input text-xs font-mono flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">QR Code</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Génération automatique</p>
                <p className="text-xs text-gray-500">Renouveler le QR automatiquement</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.auto_generate_qr} onChange={(e) => setForm({ ...form, auto_generate_qr: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée QR (secondes)</label>
              <input type="number" value={form.qr_duration_seconds} onChange={(e) => setForm({ ...form, qr_duration_seconds: parseInt(e.target.value) })} className="input" min={5} max={300} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Fonctionnalités</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">GPS</p>
                <p className="text-xs text-gray-500">Activer la géolocalisation</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.enable_gps} onChange={(e) => setForm({ ...form, enable_gps: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Notifications SMS</p>
                <p className="text-xs text-gray-500">Envoyer des notifications par SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.notification_sms} onChange={(e) => setForm({ ...form, notification_sms: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de notification</label>
              <input type="email" value={form.notification_email} onChange={(e) => setForm({ ...form, notification_email: e.target.value })} className="input" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
