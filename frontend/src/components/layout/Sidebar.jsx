import {
  Bell,
  CalendarDays,
  ClipboardList,
  Gauge,
  HelpCircle,
  Home,
  LogOut,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navigation = {
  administrator: [
    {
      section: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: Gauge },
      ],
    },
    {
      section: 'RESIDENT MANAGEMENT',
      items: [{ label: 'Residents', path: '/admin/residents', icon: Users }],
    },
    {
      section: 'MEDICATION MANAGEMENT',
      items: [
        { label: 'Medications', path: '/admin/medications', icon: Pill },
        { label: 'Medication Schedule', path: '/admin/schedule', icon: CalendarDays },
      ],
    },
    {
      section: 'CARE MANAGEMENT',
      items: [
        { label: 'Care Takers', path: '/admin/caretakers', icon: UserRound },
        { label: 'Administration Records', path: '/admin/audit-logs', icon: ClipboardList },
      ],
    },
    {
      section: 'INVENTORY',
      items: [{ label: 'Medicine Inventory', path: '/admin/inventory', icon: Package }],
    },
    {
      section: 'ANALYTICS',
      items: [{ label: 'Reports', path: '/admin/reports', icon: ClipboardList }],
    },
    {
      section: 'SYSTEM',
      items: [
        { label: 'Notifications', path: '/admin/notifications', icon: Bell },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ],
  caretaker: [
    {
      section: 'TODAY',
      items: [
        { label: 'Dashboard', path: '/caretaker/dashboard', icon: Gauge },
        { label: "Today's Schedule", path: '/caretaker/schedule', icon: CalendarDays },
      ],
    },
    {
      section: 'RESIDENT CARE',
      items: [
        { label: 'Residents', path: '/caretaker/residents', icon: Users },
        { label: 'Resident Medicines', path: '/caretaker/medications', icon: Pill },
      ],
    },
    {
      section: 'HISTORY',
      items: [{ label: 'Medication History', path: '/caretaker/history', icon: ClipboardList }],
    },
    {
      section: 'OTHER',
      items: [
        { label: 'Notifications', path: '/caretaker/notifications', icon: Bell },
        { label: 'My Profile', path: '/caretaker/profile', icon: UserRound },
      ],
    },
  ],
  resident: [
    {
      section: 'MY CARE',
      items: [
        { label: 'Home', path: '/resident/dashboard', icon: Home },
        { label: 'My Medicines', path: '/resident/medicines', icon: Pill },
        { label: "Today's Schedule", path: '/resident/schedule', icon: CalendarDays },
        { label: 'Medication History', path: '/resident/history', icon: ClipboardList },
      ],
    },
    {
      section: 'MY ACCOUNT',
      items: [
        { label: 'My Profile', path: '/resident/profile', icon: UserRound },
        { label: 'Notifications', path: '/resident/notifications', icon: Bell },
        { label: 'Help', path: '/resident/help', icon: HelpCircle },
      ],
    },
  ],
};

const roleMeta = {
  administrator: {
    label: 'Administrator',
    description: 'Managing facility operations',
    icon: ShieldCheck,
  },
  caretaker: {
    label: 'Care Taker',
    description: "Managing today's resident care",
    icon: ShieldCheck,
  },
  resident: {
    label: 'Resident',
    description: 'Viewing your medication schedule',
    icon: ShieldCheck,
  },
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'administrator';
  const roleInfo = roleMeta[role] || roleMeta.administrator;
  const groups = navigation[role] || navigation.administrator;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[260px] border-r border-[#E4E9E7] bg-white lg:block">
      <div className="flex h-[84px] items-center gap-3 border-b border-[#EEF2F1] px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F3F2] text-[#4F8A8B] shadow-sm">
          <Pill size={21} />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#263238]">MediCare Home</h1>
          <p className="text-[11px] text-[#667085]">Safer medication. Better care.</p>
        </div>
      </div>

      <nav className="px-4 py-6">
        {groups.map((group) => (
          <div key={group.section} className="mb-5 last:mb-0">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A939B]">{group.section}</p>
            <div className="space-y-1">
              {group.items.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-[#EAF5EE] text-[#3A5B59]' : 'text-[#475467] hover:bg-[#F4F7F7]'
                    }`
                  }
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="absolute bottom-6 left-4 right-4 rounded-2xl border border-[#E6EBEA] bg-[#F7FAFA] p-4">
        <div className="flex items-center gap-2 text-[#263238]">
          <roleInfo.icon size={16} className="text-[#4F8A8B]" />
          <span className="text-sm font-semibold">Active role</span>
        </div>
        <p className="mt-2 text-lg font-semibold text-[#263238]">{roleInfo.label}</p>
        <p className="mt-1 text-xs text-[#667085]">{roleInfo.description}</p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E4E9E7] bg-white px-3 py-2 text-sm font-medium text-[#475467] hover:bg-[#F5F8F8]"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
