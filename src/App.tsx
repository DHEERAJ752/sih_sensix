import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { GroupsPage } from './pages/GroupsPage';
import { NavigationPage } from './pages/NavigationPage';
import { TripsPage } from './pages/TripsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TopHeader } from './components/layout/TopHeader';
import { Navbar, PageId } from './components/layout/Navbar';
import { TripHUD } from './components/trips/TripHUD';

export const AppContent: React.FC = () => {
  const { user } = useApp();
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={(p) => setActivePage(p)} />;
      case 'live-map':
        return <LiveMapPage />;
      case 'simulation':
        return <SimulationLabPage />;
      case 'groups':
        return <GroupsPage />;
      case 'navigation':
        return <NavigationPage />;
      case 'trips':
        return <TripsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(p) => setActivePage(p)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Header */}
      <TopHeader />

      {/* Main Body with Sidebar & Viewport */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <Navbar activePage={activePage} onPageChange={setActivePage} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Floating Global HUD during active trips */}
      <TripHUD />
    </div>
  );
};

export default AppContent;
