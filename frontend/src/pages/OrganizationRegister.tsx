import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { organizationAPI } from '../services/api';

const OrganizationRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await organizationAPI.register({
        name: formData.name,
        domain: formData.domain,
        email: formData.email,
        password: formData.password
      });
      
      if (response.success) {
        setSuccess('Organization registered successfully! You can now log in.');
        setTimeout(() => {
          navigate('/org-login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-center">Register Organization</h3>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="domain" className="form-label">
                    Domain
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    placeholder="example.com"
                    required
                  />
                  <div className="form-text">
                    Users with emails ending in this domain can join your organization
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register Organization'}
                </button>
              </form>
              
              <div className="text-center mt-3">
                <p>
                  Already have an organization?{' '}
                  <Link to="/org-login">Login here</Link>
                </p>
                <p>
                  Individual user?{' '}
                  <Link to="/register">User Registration</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationRegister;
