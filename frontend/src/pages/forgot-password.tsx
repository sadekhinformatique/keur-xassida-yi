import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { authAPI } from '@/utils/api';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <HiOutlineArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe oublié</h2>
          <p className="text-sm text-gray-500 mb-6">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>

          {sent ? (
            <div className="bg-green-50 text-green-700 px-4 py-6 rounded-lg text-center">
              <p className="font-medium">Email envoyé !</p>
              <p className="text-sm mt-1">
                Si un compte existe avec cette adresse, vous recevrez un email de réinitialisation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="exemple@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5"
              >
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
