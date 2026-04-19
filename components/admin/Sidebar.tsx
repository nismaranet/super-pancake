'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  Car,
  Users,
  Server,
  Settings,
  LogOut,
  Zap,
  ShieldCheck,
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Members', href: '/admin/members', icon: Users },
    ],
  },
  {
    label: 'Racing',
    items: [
      { name: 'Events', href: '/admin/events', icon: CalendarDays },
      { name: 'Tracks', href: '/admin/tracks', icon: Map },
      { name: 'Vehicles', href: '/admin/cars', icon: Car },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Server', href: '/admin/servers', icon: Server },
      { name: 'Auto Sync', href: '/admin/servers/auto-sync', icon: Server },
      { name: 'Practice Server', href: '/admin/practice', icon: Server },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[var(--card)] border-r border-[var(--glass-border)] flex flex-col transition-colors">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 racing-gradient rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <h2 className="font-black italic tracking-tighter text-lg uppercase leading-none">
            ADMIN<span className="text-[var(--accent)]">HUB</span>
          </h2>
        </div>
      </div>

      <nav className="flex-1 px-4 custom-scrollbar overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-8">
            <h3 className="px-4 text-[9px] font-bold text-[var(--muted)] uppercase tracking-[0.3em] mb-3">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                      active
                        ? 'bg-[var(--accent-glow)] text-[var(--accent)]'
                        : 'text-[var(--muted)] hover:bg-[var(--glass-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-[10px] font-black uppercase italic tracking-widest">
                        {item.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4">
        <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl flex items-center gap-3">
          <ShieldCheck size={20} className="text-[var(--accent)]" />
          <div className="leading-none">
            <p className="text-[10px] font-black uppercase italic">Secured</p>
            <p className="text-[8px] text-[var(--muted)] uppercase tracking-tighter">
              Admin Session
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
