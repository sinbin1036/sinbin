'use client';

import { useRouter } from 'next/navigation';
import { Dashboard } from './Dashboard';

export default function DashboardWrapper() {
  const router = useRouter();

  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  const handleShowAuth = (mode?: 'login' | 'signup') => {
    router.push('/');
  };

  return (
    <Dashboard
      isAuthenticated={true}
      onLogout={handleLogout}
      onShowAuth={handleShowAuth}
    />
  );
}
