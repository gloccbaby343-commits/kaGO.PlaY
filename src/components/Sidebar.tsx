import React from 'react';
import {
  LayoutDashboard,
  Music2,
  Disc3,
  Users2,
  ListMusic,
  Heart,
  Sparkles,
  BookOpen,
  Youtube,
} from 'lucide-react';
import { ActiveTab } from '../types/audio';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  trackCount: number;
  playlistCount: number;
  favoriteCount: number;
  onOpenScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  trackCount,
  playlistCount,
  favoriteCount,
  onOpenScanner,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'youtube' as ActiveTab, label: 'YouTube Stream', icon: Youtube },
    { id: 'songs' as ActiveTab, label: 'All Songs', icon: Music2, count: trackCount },
    { id: 'albums' as ActiveTab, label: 'Albums', icon: Disc3 },
    { id: 'artists' as ActiveTab, label: 'Artists', icon: Users2 },
    { id: 'playlists' as ActiveTab, label: 'Playlists', icon: ListMusic, count: playlistCount },
    { id: 'favorites' as ActiveTab, label: 'Favorites', icon: Heart, count: favoriteCount },
    { id: 'ai_studio' as ActiveTab, label: 'AI Music & Search', icon: Sparkles },
  ];

  return (
    <aside className="w-[280px] bg-black/45 backdrop-blur-2xl border-r border-white/[0.08] shadow-[4px_0_30px_rgba(0,0,0,0.3)] hidden lg:flex flex-col h-screen shrink-0 p-6 justify-between select-none relative z-20">
      <div className="top">
        {/* Brand Header */}
        <div className="brand mb-8 flex items-center gap-3">
          <img
            src="/assets/aistudio/kaGO_PLay_Logo_6adaa8a1.png"
            alt="kaGO.PIaY App Logo"
            className="w-11 h-11 rounded-2xl object-cover border border-white/10 shadow-[0_0_20px_rgba(255,62,62,0.35)] shrink-0"
          />
          <div>
            <div className="label mb-0.5 text-[10px] tracking-widest text-[#ff3e3e] font-mono">[ SYSTEM.V1 ]</div>
            <h1 className="font-syne font-extrabold text-xl tracking-tight text-[#f2efeb] leading-tight">
              kaGO.PIaY
            </h1>
            <div className="label opacity-50 text-[11px]">Offline Audio Engine</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          <p className="label mb-3 text-[10px] font-mono tracking-wider opacity-60">LIBRARY</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between w-full py-2.5 px-3 rounded-xl text-left text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'opacity-100 bg-white/[0.10] border border-white/[0.12] text-[#f2efeb] font-semibold shadow-sm'
                    : 'opacity-70 hover:opacity-100 text-[#f2efeb] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff3e3e]' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="font-mono text-[10px] opacity-60 bg-white/[0.06] px-2 py-0.5 rounded-full">{item.count}</span>
                )}
              </button>
            );
          })}

          <div className="pt-6">
            <p className="label mb-3 text-[10px] font-mono tracking-wider opacity-60">ENGINEERING</p>
            <button
              onClick={() => onSelectTab('architecture')}
              className={`flex items-center gap-2.5 w-full py-2.5 px-3 rounded-xl text-left text-xs font-medium transition cursor-pointer ${
                activeTab === 'architecture'
                  ? 'opacity-100 bg-white/[0.10] border border-white/[0.12] text-[#f2efeb] font-semibold shadow-sm'
                  : 'opacity-70 hover:opacity-100 text-[#f2efeb] hover:bg-white/[0.05]'
              }`}
            >
              <BookOpen className="w-4 h-4 opacity-70" />
              <span>Mobile Architecture</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Sidebar Footer Box */}
      <div className="sidebar-footer bg-white/[0.04] backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] mt-6 shadow-sm">
        <div className="label mb-1 text-[10px] font-mono text-[#ff3e3e]">STATUS: 100% OFFLINE</div>
        <p className="text-[11px] opacity-60 mb-3.5 leading-relaxed">
          IndexedDB & Local Persistent Cache Active.
        </p>
        <button
          onClick={onOpenScanner}
          className="bg-[#ff3e3e] hover:bg-[#e03030] text-[#0c0c0e] border-none py-2 px-3 w-full font-syne font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition rounded-xl shadow-md shadow-[#ff3e3e]/20"
        >
          IMPORT LOCAL FILES
        </button>
      </div>
    </aside>
  );
};
