import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamAPI, userAPI } from '../services/api';
import { Team, User } from '../types';

const Teams: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.listTeams();
      if (response.success && response.teams) {
        setTeams(response.teams || []);
      }
    } catch (err: any) {
      setError('Failed to load teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.listUsers();
      if (response.success && response.users) {
        setUsers(response.users || []);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreating(true);
    try {
      const response = await teamAPI.createTeam({ name: newTeamName.trim() });
      if (response.success) {
        setNewTeamName('');
        setShowCreateForm(false);
        fetchTeams(); // Refresh teams list
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const getUserName = (userId: string): string => {
    const foundUser = users.find(u => u._id === userId);
    return foundUser ? foundUser.name : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Teams</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active">Teams</li>
            </ol>
          </nav>
        </div>
        {(user?.role === 'team_admin' || user?.role === 'superadmin') && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Team'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Create New Team</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateTeam}>
              <div className="mb-3">
                <label htmlFor="teamName" className="form-label">
                  Team Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No teams found.</p>
          {(user?.role === 'team_admin' || user?.role === 'superadmin') && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Team
            </button>
          )}
        </div>
      ) : (
        <div className="row">
          {teams.map((team) => (
            <div key={team._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{team.name}</h6>
                  <span className="badge bg-secondary">
                    {team.members.length} members
                  </span>
                </div>
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Members:</h6>
                  <ul className="list-unstyled">
                    {team.members.slice(0, 3).map((member, index) => (
                      <li key={index} className="mb-1">
                        <small>
                          {typeof member.user === 'object' ? member.user.name : getUserName(member.user as string)}
                          {member.role === 'team_admin' && (
                            <span className="badge bg-warning ms-1">Admin</span>
                          )}
                        </small>
                      </li>
                    ))}
                    {team.members.length > 3 && (
                      <li>
                        <small className="text-muted">
                          +{team.members.length - 3} more
                        </small>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="card-footer">
                  <Link
                    to={`/teams/${team._id}`}
                    className="btn btn-primary btn-sm w-100"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;
