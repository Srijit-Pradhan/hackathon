import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-paper text-forest">
      <main className="flex-grow pt-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      <footer className="border-t border-grid/20 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-grid/60">
        Hackathon Project • Smart Incident Response
      </footer>
    </div>
  );
}
