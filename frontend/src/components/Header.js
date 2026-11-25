import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header = ({ pageTitle }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header" data-testid="app-header">
      <div className="header-title">
        <h2 data-testid="page-title">{pageTitle}</h2>
      </div>

      <div className="header-actions">
        {user && (
          <div className="user-profile" data-testid="user-profile-widget">
            <div className="user-avatar" title={user.name}>
              {getInitials(user.name)}
            </div>
            <div className="user-info">
              <span className="user-name" data-testid="header-user-name">
                {user.name}
              </span>
              <span className="user-role-badge" data-testid="header-user-role">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          data-testid="logout-button"
          type="button"
          title="Sign out of administration"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
