import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import MembersPage from './pages/MembersPage';
import IssuesPage from './pages/IssuesPage';

const App = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Checking authentication status..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const pageTitles = {
    dashboard: 'Dashboard Overview',
    books: 'Book Catalog & Inventory Management',
    members: 'Member Directory & Patron Management',
    issues: 'Book Issue & Return Transactions',
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActivePage} />;
      case 'books':
        return <BooksPage />;
      case 'members':
        return <MembersPage />;
      case 'issues':
        return <IssuesPage />;
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-container" data-testid="authenticated-app-container">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="main-content">
        <Header pageTitle={pageTitles[activePage] || 'Library System'} />
        <div className="page-body">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
};

export default App;
