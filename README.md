# 🍽️ Ediens - Food Sharing Platform

**Ediens** is a web-first food sharing platform connecting individuals and businesses to reduce food waste in Latvia. Built with modern web technologies, it enables peer-to-peer food sharing and business partnerships to create a more sustainable food ecosystem.

## 🌟 Features

### MVP Features (Phase 1)
- **User Authentication** - Email/password + OAuth (Google/Facebook)
- **Food Posting** - Share leftover food with photos, descriptions, and expiry dates
- **Interactive Map** - Discover nearby food offers with real-time location
- **Reservation System** - Simple claim and messaging system
- **Category System** - Fresh, cooked, bakery, packaged, and more

### Future Features (Phase 2+)
- **Trust & Rating System** - User reliability scores and food quality ratings
- **Business Integration** - Shop dashboards for inventory management
- **Gamification** - Eco points, leaderboards, and achievements
- **Delivery Options** - Bike couriers and crowd delivery
- **NGO Integration** - Automatic surplus redirection to shelters

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling and validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Sequelize** - ORM for database operations
- **Socket.IO** - Real-time communication
- **JWT** - Authentication and authorization
- **Passport.js** - OAuth strategies

### Infrastructure
- **Docker** - Containerization
- **Cloudinary** - Image and file storage
- **Mapbox** - Maps and geolocation
- **Redis** - Caching and sessions

## 📋 Prerequisites

- **Node.js** 18+ and npm 9+
- **PostgreSQL** 13+
- **Redis** 6+ (optional for development)
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ediens-food-sharing.git
cd ediens-food-sharing
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 3. Environment Configuration
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb ediens_db

# Run database migrations
cd backend
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3001
```

## 🏗️ Project Structure

```
ediens-food-sharing/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS and styling
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration files
│   │   └── database/       # Database connection
│   └── package.json        # Backend dependencies
├── docs/                   # Documentation
├── todo.md                 # Development roadmap
└── package.json            # Root project configuration
```

## 🔧 Development Commands

### Root Commands
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build frontend for production
npm run start            # Start production backend
npm run test             # Run all tests
npm run lint             # Lint all code
```

### Frontend Commands
```bash
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run frontend tests
npm run lint             # Lint frontend code
```

### Backend Commands
```bash
cd backend
npm run dev              # Start development server
npm start                # Start production server
npm test                 # Run backend tests
npm run lint             # Lint backend code
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and profiles
- **food_posts** - Food items available for sharing
- **claims** - User reservations and claims
- **messages** - Chat system between users

### Key Features
- **Geospatial Indexing** - Location-based queries
- **Soft Deletes** - Data preservation
- **Audit Trails** - Change tracking
- **JSONB Fields** - Flexible data storage

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend && npm run build

# Start backend
cd backend && npm start
```

### Environment Variables
Ensure all production environment variables are set:
- Database credentials
- JWT secrets
- OAuth API keys
- File storage credentials
- Map service tokens

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile

### Food Posts Endpoints
- `GET /api/posts` - List food posts with filters
- `POST /api/posts` - Create new food post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Claims Endpoints
- `POST /api/claims` - Create food claim
- `GET /api/claims` - List user claims
- `PUT /api/claims/:id` - Update claim status

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test                  # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Backend Testing
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## 📊 Performance & Monitoring

### Frontend Performance
- **Code Splitting** - Route-based and component-based
- **Lazy Loading** - Images and components
- **Service Worker** - Offline support and caching
- **Bundle Analysis** - Webpack bundle analyzer

### Backend Performance
- **Database Indexing** - Optimized queries
- **Caching** - Redis for session and data caching
- **Rate Limiting** - API protection
- **Compression** - Response compression

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **OAuth Integration** - Google and Facebook login
- **Input Validation** - Request sanitization
- **Rate Limiting** - API abuse prevention
- **CORS Configuration** - Cross-origin security
- **Helmet.js** - Security headers

## 🌍 Localization

- **Latvian (lv)** - Primary language
- **English (en)** - Secondary language
- **RTL Support** - Future consideration
- **Number Formatting** - Local currency and units

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow **ESLint** configuration
- Write **unit tests** for new features
- Update **documentation** for API changes
- Use **conventional commits** for commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TooGoodToGo** - Inspiration for business model
- **Olio** - Peer-to-peer sharing concepts
- **Food Rescue US** - NGO integration ideas
- **Latvian Sustainability Community** - Local insights and support

## 📞 Support

- **Email**: support@ediens.lv
- **Documentation**: [docs.ediens.lv](https://docs.ediens.lv)
- **Issues**: [GitHub Issues](https://github.com/your-username/ediens-food-sharing/issues)

---

**Built with ❤️ for a more sustainable Latvia**

*Last updated: January 2024*