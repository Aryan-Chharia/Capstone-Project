import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI, teamAPI } from '../services/api';
import { Project, Team } from '../types';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.listProjects();
      if (response.success && response.projects) {
        setProjects(response.projects || []);
      }
    } catch (err: any) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getUserTeams();
      if (response.teams) {
        setTeams(response.teams || []);
      }
    } catch (err: any) {
      console.error('Failed to load teams:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.team) return;

    setCreating(true);
    try {
      const response = await projectAPI.createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        team: formData.team
      });
      
      if (response.success) {
        setFormData({ name: '', description: '', team: '' });
        setShowCreateForm(false);
        fetchProjects(); // Refresh projects list
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t._id === teamId);
    return team ? team.name : 'Unknown Team';
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
          <h2>Projects</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active">Projects</li>
            </ol>
          </nav>
        </div>
        <button
          className="btn btn-success"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Create New Project</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateProject}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Project Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="team" className="form-label">
                  Team
                </label>
                <select
                  className="form-control"
                  id="team"
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Description (Optional)
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Project'}
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

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No projects found.</p>
          <button
            className="btn btn-success"
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="row">
          {projects.map((project) => (
            <div key={project._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="mb-0">{project.name}</h6>
                </div>
                <div className="card-body">
                  <p className="card-text">
                    {project.description || 'No description provided'}
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      Team: {typeof project.team === 'object' ? project.team.name : getTeamName(project.team as string)}
                    </small>
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </small>
                  </p>
                </div>
                <div className="card-footer">
                  <div className="d-flex gap-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="btn btn-primary btn-sm flex-fill"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/projects/${project._id}/chat`}
                      className="btn btn-success btn-sm flex-fill"
                    >
                      Open Chat
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
