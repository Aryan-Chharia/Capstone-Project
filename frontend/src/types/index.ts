// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  role: 'user' | 'team_admin' | 'superadmin';
  permissions: string[];
  organization: string;
  teams: string[];
  createdAt: string;
  updatedAt: string;
}

// Organization types
export interface Organization {
  _id: string;
  name: string;
  domain: string;
  email: string;
  members?: User[];
  createdAt: string;
  updatedAt: string;
}

// Team types
export interface TeamMember {
  user: User | string;
  role: 'member' | 'team_admin';
  accessLevel: 'read' | 'write' | 'admin';
}

export interface Team {
  _id: string;
  name: string;
  organization: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

// Project types
export interface Project {
  _id: string;
  name: string;
  team: Team | string;
  description: string;
  chat?: string;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  _id: string;
  chat: string;
  sender: 'user' | 'chatbot';
  content?: string;
  imageUrl?: string;
  messageType: 'text' | 'image' | 'both';
  confidenceScore?: number;
  references: string[];
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface Chat {
  _id: string;
  project: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OrganizationLoginResponse {
  success: boolean;
  token: string;
  data: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organization: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  verificationCode: string;
}

export interface OrganizationRegisterRequest {
  name: string;
  domain: string;
  email: string;
  password: string;
}

export interface CreateTeamRequest {
  name: string;
}

export interface AddMemberRequest {
  userId: string;
  role?: 'member' | 'team_admin';
  accessLevel?: 'read' | 'write' | 'admin';
}

export interface CreateProjectRequest {
  name: string;
  team: string;
  description?: string;
}

export interface ChatRequest {
  projectId: string;
  content?: string;
  image?: File;
}

export interface ChatResponse {
  botReply?: string;
  confidenceScore?: number;
  success?: boolean;
  message?: string;
}
