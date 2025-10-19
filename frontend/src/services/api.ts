import axios from 'axios';
import {
  ApiResponse,
  LoginResponse,
  OrganizationLoginResponse,
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  OrganizationRegisterRequest,
  User,
  Organization,
  Team,
  Project,
  Chat,
  CreateTeamRequest,
  AddMemberRequest,
  CreateProjectRequest,
  ChatRequest,
  ChatResponse
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: async (data: RegisterRequest): Promise<ApiResponse> => {
    const response = await api.post('/api/users/register', data);
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequest): Promise<ApiResponse> => {
    const response = await api.post('/api/users/verify-email', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/users/login', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/api/users/logout');
    return response.data;
  },
};

// Organization APIs
export const organizationAPI = {
  register: async (data: OrganizationRegisterRequest): Promise<ApiResponse<Organization>> => {
    const response = await api.post('/api/organizations/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<OrganizationLoginResponse> => {
    const response = await api.post('/api/organizations/login', data);
    return response.data;
  },

  getOrganization: async (id: string): Promise<ApiResponse<Organization>> => {
    const response = await api.get(`/api/organizations/${id}`);
    return response.data;
  },

  listOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    const response = await api.get('/api/organizations');
    return response.data;
  },

  getMembers: async (orgId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/api/organizations/${orgId}/members`);
    return response.data;
  },

  makeAdmin: async (orgId: string, userId: string): Promise<ApiResponse> => {
    const response = await api.put(`/api/organizations/${orgId}/members/${userId}/admin`);
    return response.data;
  },

  updateOrganization: async (id: string, data: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    const response = await api.put(`/api/organizations/update/${id}`, data);
    return response.data;
  },

  deleteOrganization: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/organizations/delete/${id}`);
    return response.data;
  },
};

// User APIs
export const userAPI = {
  listUsers: async (): Promise<{ success: boolean; users: User[] }> => {
    const response = await api.get('/api/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },
};

// Team APIs
export const teamAPI = {
  createTeam: async (data: CreateTeamRequest): Promise<ApiResponse<Team>> => {
    const response = await api.post('/api/teams/create', data);
    return response.data;
  },

  listTeams: async (): Promise<{ success: boolean; teams: Team[] }> => {
    const response = await api.get('/api/teams/all');
    return response.data;
  },

  getUserTeams: async (): Promise<{ success?: boolean; teams: Team[] }> => {
    const response = await api.get('/api/teams');
    return response.data;
  },

  getTeam: async (id: string): Promise<ApiResponse<Team>> => {
    const response = await api.get(`/api/teams/${id}`);
    return response.data;
  },

  addMember: async (teamId: string, data: AddMemberRequest): Promise<ApiResponse<Team>> => {
    const response = await api.put(`/api/teams/${teamId}/add-member`, data);
    return response.data;
  },

  removeMember: async (teamId: string, userId: string): Promise<ApiResponse<Team>> => {
    const response = await api.put(`/api/teams/${teamId}/remove-member`, { userId });
    return response.data;
  },

  deleteTeam: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/teams/${id}`);
    return response.data;
  },
};

// Project APIs
export const projectAPI = {
  createProject: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    const response = await api.post('/api/projects', data);
    return response.data;
  },

  listProjects: async (): Promise<{ success: boolean; projects: Project[] }> => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  getProject: async (id: string): Promise<{ project: Project }> => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
    const response = await api.patch(`/api/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  },
};

// Chat APIs
export const chatAPI = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('projectId', data.projectId);
    if (data.content) formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);

    const response = await api.post('/api/chat/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getChatHistory: async (projectId: string): Promise<{ chat: Chat }> => {
    const response = await api.get(`/api/chat/${projectId}`);
    return response.data;
  },
};

export default api;
