import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-paper text-forest">
      <main className="flex-grow w-full px-6 pt-20 mx-auto md:px-12 max-w-7xl">
        <Outlet />
      </main>
      <footer className="border-t border-grid/20 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-grid/60">
        &copy; incidentIQ. All rights reserved.
      </footer>
    </div>
  );
}
