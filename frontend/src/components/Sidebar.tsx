import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineClock,
  HiOutlineQrcode, HiOutlineClipboardCheck, HiOutlineDocumentReport,
  HiOutlineCog, HiOutlineLogout, HiOutlineX,
} from 'react-icons/hi';

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: HiOutlineHome, roles: ['ADMIN', 'RH', 'MANAGER'] },
  { href: '/employees', label: 'Employés', icon: HiOutlineUserGroup, roles: ['ADMIN', 'RH'] },
  { href: '/schedules', label: 'Horaires', icon: HiOutlineClock, roles: ['ADMIN', 'RH'] },
  { href: '/qr-code', label: 'QR Code', icon: HiOutlineQrcode, roles: ['ADMIN', 'RH'] },
  { href: '/attendance', label: 'Pointages', icon: HiOutlineClipboardCheck, roles: ['ADMIN', 'RH', 'MANAGER'] },
  { href: '/reports', label: 'Rapports', icon: HiOutlineDocumentReport, roles: ['ADMIN', 'RH'] },
  { href: '/settings', label: 'Paramètres', icon: HiOutlineCog, roles: ['ADMIN'] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 
      transform transition-transform duration-200 ease-in-out
      lg:translate-x-0 lg:static lg:z-auto
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RH</span>
          </div>
          <span className="font-bold text-lg text-gray-800">RH Manager</span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded">
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      <nav className="p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href ||
            (item.href !== '/' && router.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
        >
          <HiOutlineLogout className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
