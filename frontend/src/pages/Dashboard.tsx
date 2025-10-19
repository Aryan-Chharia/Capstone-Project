import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamAPI, projectAPI } from '../services/api';
import { Team, Project } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsResponse, projectsResponse] = await Promise.all([
        teamAPI.getUserTeams(),
        projectAPI.listProjects()
      ]);

      if (teamsResponse.teams) {
        setTeams(teamsResponse.teams || []);
      }

      if (projectsResponse.success && projectsResponse.projects) {
        setProjects(projectsResponse.projects || []);
      }
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    <div className="container-fluid">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div className="container-fluid">
          <span className="navbar-brand">Project Dashboard</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Welcome, {user?.name}
            </span>
            <button className="btn btn-outline-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {(user?.role === 'team_admin' || user?.role === 'superadmin') && (
                  <Link to="/teams/create" className="btn btn-primary btn-sm">
                    Create Team
                  </Link>
                )}
                <Link to="/projects/create" className="btn btn-success btn-sm">
                  Create Project
                </Link>
                <Link to="/teams" className="btn btn-info btn-sm">
                  View All Teams
                </Link>
                <Link to="/projects" className="btn btn-secondary btn-sm">
                  View All Projects
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          {/* Teams Section */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>My Teams ({teams.length})</h5>
              <Link to="/teams" className="btn btn-outline-primary btn-sm">
                View All
              </Link>
            </div>
            <div className="card-body">
              {teams.length === 0 ? (
                <p className="text-muted">You are not a member of any teams yet.</p>
              ) : (
                <div className="row">
                  {teams.slice(0, 6).map((team) => (
                    <div key={team._id} className="col-md-4 mb-3">
                      <div className="card border-primary">
                        <div className="card-body">
                          <h6 className="card-title">{team.name}</h6>
                          <p className="card-text text-muted">
                            {team.members.length} member(s)
                          </p>
                          <Link
                            to={`/teams/${team._id}`}
                            className="btn btn-primary btn-sm"
                          >
                            View Team
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Section */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>Recent Projects ({projects.length})</h5>
              <Link to="/projects" className="btn btn-outline-primary btn-sm">
                View All
              </Link>
            </div>
            <div className="card-body">
              {projects.length === 0 ? (
                <p className="text-muted">No projects found.</p>
              ) : (
                <div className="row">
                  {projects.slice(0, 6).map((project) => (
                    <div key={project._id} className="col-md-4 mb-3">
                      <div className="card border-success">
                        <div className="card-body">
                          <h6 className="card-title">{project.name}</h6>
                          <p className="card-text">
                            {project.description || 'No description'}
                          </p>
                          <p className="card-text">
                            <small className="text-muted">
                              Team: {typeof project.team === 'object' ? project.team.name : 'N/A'}
                            </small>
                          </p>
                          <div className="d-flex gap-2">
                            <Link
                              to={`/projects/${project._id}`}
                              className="btn btn-success btn-sm"
                            >
                              View Project
                            </Link>
                            <Link
                              to={`/projects/${project._id}/chat`}
                              className="btn btn-outline-primary btn-sm"
                            >
                              Chat
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
