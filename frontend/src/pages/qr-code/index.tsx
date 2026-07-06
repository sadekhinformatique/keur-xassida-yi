import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { qrAPI, settingsAPI } from '@/utils/api';
import { HiOutlineRefresh, HiOutlinePrinter, HiOutlineArrowsExpand } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function QRCodePage() {
  const { isAuthenticated, loading: authLoading, isRH } = useAuth();
  const router = useRouter();
  const [qrData, setQrData] = useState<any>(null);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const autoGenRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    if (!authLoading && !isRH) router.push('/');
  }, [isAuthenticated, authLoading, isRH, router]);

  useEffect(() => {
    if (isAuthenticated && isRH) {
      loadSettings();
      generateQR();
    }
    return () => clearTimeout(autoGenRef.current);
  }, [isAuthenticated, isRH]);

  useEffect(() => {
    if (qrData) drawQR();
  }, [qrData]);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data);
      if (res.data.qr_duration_seconds) setDuration(res.data.qr_duration_seconds);
    } catch { /* ignore */ }
  };

  const generateQR = async () => {
    setLoading(true);
    try {
      const res = await qrAPI.generate(duration);
      setQrData(res.data);
      toast.success('QR Code généré');

      if (settings?.auto_generate_qr) {
        clearTimeout(autoGenRef.current);
        autoGenRef.current = setTimeout(generateQR, duration * 1000);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const drawQR = async () => {
    if (!qrCanvasRef.current || !qrData) return;
    try {
      const QRCode = (await import('qrcode')).default;
      const jsonStr = JSON.stringify(qrData.qr_data);
      QRCode.toCanvas(qrCanvasRef.current, jsonStr, {
        width: fullscreen ? 400 : 280,
        margin: 2,
        color: { dark: '#1e40af', light: '#ffffff' },
      });
    } catch { /* ignore */ }
  };

  const printQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>QR Code - ${settings?.company_name || 'RH'}</title>
        <style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:white;flex-direction:column}
        img{max-width:90vw} h2{font-family:sans-serif;color:#333}</style></head><body>
        <h2>${settings?.company_name || 'Scannez pour pointer'}</h2>
        <img src="${canvas.toDataURL()}" />
        <p style="font-family:sans-serif;color:#666;margin-top:20px">Valable ${duration} secondes</p>
        <script>window.print()</script></body></html>
      `);
      win.document.close();
    }
  };

  if (authLoading) return (
    <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div></Layout>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center ${fullscreen ? 'min-h-screen bg-white p-8' : ''}`}>
      {!fullscreen && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
          <p className="text-gray-500 mt-1">Générer un QR Code pour les pointages</p>
        </div>
      )}

      <div className="card max-w-md mx-auto text-center">
        <div className={`relative inline-block ${fullscreen ? 'scale-150 origin-top' : ''}`}>
          <canvas ref={qrCanvasRef} className="mx-auto" />

          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          )}
        </div>

        {!fullscreen && (
          <>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Valable jusqu'à</p>
              <p className="font-semibold text-gray-900">
                {qrData?.valid_until ? new Date(qrData.valid_until).toLocaleTimeString('fr-FR') : '-'}
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée de validité (secondes)</label>
              <div className="flex gap-2">
                {[15, 30, 60, 120].map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${duration === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={generateQR} disabled={loading} className="btn-primary flex-1 justify-center">
                <HiOutlineRefresh className="w-4 h-4" />
                Générer
              </button>
              <button onClick={printQR} className="btn-secondary">
                <HiOutlinePrinter className="w-4 h-4" />
              </button>
              <button onClick={() => setFullscreen(true)} className="btn-secondary">
                <HiOutlineArrowsExpand className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Sécurité</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>✓ Token unique généré à chaque fois</li>
                <li>✓ QR signé cryptographiquement</li>
                <li>✓ Expiration automatique</li>
                <li>✓ Aucune donnée personnelle dans le QR</li>
              </ul>
            </div>
          </>
        )}

        {fullscreen && (
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center flex-col">
            <canvas ref={qrCanvasRef} className="max-w-[80vmin]" />
            <p className="mt-4 text-gray-500 text-sm">Valable jusqu'à {qrData?.valid_until ? new Date(qrData.valid_until).toLocaleTimeString('fr-FR') : '-'}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={printQR} className="btn-primary"><HiOutlinePrinter className="w-4 h-4" /> Imprimer</button>
              <button onClick={() => setFullscreen(false)} className="btn-secondary">Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return fullscreen ? <>{content}</> : <Layout>{content}</Layout>;
}
