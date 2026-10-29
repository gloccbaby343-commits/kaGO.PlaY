import React from 'react';
import { LayoutDashboard, Music2, Sparkles, ListMusic, BookOpen, Youtube } from 'lucide-react';
import { ActiveTab } from '../types/audio';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
    { id: 'youtube' as ActiveTab, label: 'Stream', icon: Youtube },
    { id: 'songs' as ActiveTab, label: 'Songs', icon: Music2 },
    { id: 'playlists' as ActiveTab, label: 'Playlists', icon: ListMusic },
    { id: 'ai_studio' as ActiveTab, label: 'AI Music', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/65 backdrop-blur-2xl border-t border-white/[0.12] shadow-[0_-10px_35px_rgba(0,0,0,0.5)] lg:hidden px-3 pt-2 pb-safe-bottom pb-[max(env(safe-area-inset-bottom,0px),1.25rem)] flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition cursor-pointer ${
              isActive
                ? 'text-[#ff3e3e] font-bold bg-white/[0.08] shadow-sm border border-white/[0.08]'
                : 'text-[#f2efeb]/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'opacity-70'}`} />
            <span className="font-mono text-[9px] mt-1 uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
