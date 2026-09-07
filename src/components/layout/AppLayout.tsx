import { useState, lazy, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { AnimatedBackground } from './AnimatedBackground';
import { CommandPalette } from '@/components/CommandPalette';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <AnimatedBackground />

      {/* Sidebar - fixed on desktop */}
      <div className="hidden lg:block">
        <Sidebar open={true} onClose={() => {}} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && <Sidebar open={true} onClose={() => setSidebarOpen(false)} />}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
        <BottomNav />
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
