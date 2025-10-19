# Frontend - Project Management Application

This is the React.js frontend for the project management application with team collaboration and AI chat functionality.

## Features

- **Authentication**: User registration, email verification, and login
- **Organization Management**: Multi-tenant organization support
- **Team Management**: Create and manage teams within organizations
- **Project Management**: Create projects within teams
- **AI Chat**: Chat with AI assistant for each project (supports text and images)
- **Role-based Access**: Different permission levels (user, team_admin, superadmin)

## Technology Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **Bootstrap 5** for styling
- **Axios** for API calls
- **Context API** for state management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file (optional):
   ```bash
   cp .env.example .env
   ```
   
   Configure any environment variables if needed:
   ```
   REACT_APP_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## Application Structure

```
src/
├── components/          # Reusable components
├── context/            # React context providers
├── pages/              # Main application pages
├── services/           # API service functions
├── types/              # TypeScript type definitions
└── App.tsx            # Main app component with routing
```

## Main Pages

1. **Authentication Pages**
   - `/login` - User login
   - `/register` - User registration
   - `/verify-email` - Email verification
   - `/org-register` - Organization registration
   - `/org-login` - Organization admin login

2. **Application Pages**
   - `/dashboard` - Main dashboard with overview
   - `/teams` - Team management
   - `/projects` - Project management
   - `/projects/:id/chat` - AI chat interface

## API Integration

The frontend communicates with the backend through RESTful APIs:

- Authentication endpoints for login/register
- CRUD operations for teams and projects
- Real-time chat with AI assistant
- File upload support for images in chat

## Configuration

### Backend Connection

The app is configured to proxy API requests to `http://localhost:3000` during development. This is set in `package.json`:

```json
"proxy": "http://localhost:3000"
```

### Authentication

JWT tokens are stored in localStorage and automatically included in API requests. The auth context manages authentication state across the application.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Notes

- The application assumes the backend is running on port 3000
- Bootstrap is used for quick styling - focus is on functionality over design
- All forms include basic validation and error handling
- The chat interface supports both text messages and image uploads
- Role-based access control restricts certain features based on user permissions