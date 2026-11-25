import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

const DashboardPage = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getStats();
      if (res.success) {
        setStats(res.stats);
        setRecentActivities(res.recentActivities || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Fetching real-time statistics from PostgreSQL..." />;
  }

  return (
    <div data-testid="dashboard-page">
      <Alert type="danger" message={error} onClose={() => setError('')} />

      {/* Primary Statistics Grid */}
      <div className="stats-grid" data-testid="stats-grid">
        {/* Total Books */}
        <div className="stat-card" data-testid="card-total-books">
          <div className="stat-icon icon-blue">📚</div>
          <div className="stat-details">
            <span className="stat-label">Total Books</span>
            <span className="stat-value" data-testid="stat-total-books">
              {stats?.totalBooks ?? 0}
            </span>
            <span className="stat-subtext">
              {stats?.totalCopies ?? 0} total physical copies
            </span>
          </div>
        </div>

        {/* Total Members */}
        <div className="stat-card" data-testid="card-total-members">
          <div className="stat-icon icon-purple">👥</div>
          <div className="stat-details">
            <span className="stat-label">Total Members</span>
            <span className="stat-value" data-testid="stat-total-members">
              {stats?.totalMembers ?? 0}
            </span>
            <span className="stat-subtext">Registered patrons</span>
          </div>
        </div>

        {/* Available Books */}
        <div className="stat-card" data-testid="card-available-books">
          <div className="stat-icon icon-green">✅</div>
          <div className="stat-details">
            <span className="stat-label">Available Books</span>
            <span className="stat-value" data-testid="stat-available-books">
              {stats?.availableBooks ?? 0}
            </span>
            <span className="stat-subtext">Ready for immediate loan</span>
          </div>
        </div>

        {/* Issued Books */}
        <div className="stat-card" data-testid="card-issued-books">
          <div className="stat-icon icon-amber">🔄</div>
          <div className="stat-details">
            <span className="stat-label">Issued Books</span>
            <span className="stat-value" data-testid="stat-issued-books">
              {stats?.issuedBooks ?? 0}
            </span>
            <span className="stat-subtext">
              {stats?.overdueBooks ?? 0} currently overdue
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="card" data-testid="recent-activities-card">
        <div className="card-header">
          <h3 className="card-title">Recent Loan Activities</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('issues')}
            data-testid="view-all-issues-btn"
          >
            View All Issues &rarr;
          </button>
        </div>

        <div className="table-responsive">
          {recentActivities.length === 0 ? (
            <div className="empty-state" data-testid="empty-recent-activities">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No recent activities recorded</div>
              <p>Issue transactions will appear here automatically.</p>
            </div>
          ) : (
            <table className="data-table" data-testid="recent-activity-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Member Name</th>
                  <th>Book Title</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((act) => (
                  <tr key={act.id} data-testid={`activity-row-${act.id}`}>
                    <td>#{act.id}</td>
                    <td style={{ fontWeight: 500 }}>{act.member_name}</td>
                    <td>{act.book_name}</td>
                    <td>{act.issue_date}</td>
                    <td>{act.due_date}</td>
                    <td>
                      <span className={`badge badge-${act.status}`}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
