import React from 'react';
import { Outlet } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

export const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      <DemoBanner />
      <Navbar />
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};
