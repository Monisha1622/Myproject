import React from 'react';

const Sidebar = ({ activePage, onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', testId: 'nav-dashboard' },
    { id: 'books', label: 'Book Management', icon: '📚', testId: 'nav-books' },
    { id: 'members', label: 'Member Management', icon: '👥', testId: 'nav-members' },
    { id: 'issues', label: 'Book Issue & Return', icon: '🔄', testId: 'nav-issues' },
  ];

  return (
    <aside className="sidebar" data-testid="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">📖</div>
        <div>
          <div className="brand-title">Library OS</div>
          <div className="brand-subtitle">QA Learning Project</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            data-testid={item.testId}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
