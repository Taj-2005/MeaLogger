# Meal Logger Backend API

Production-ready Express.js backend server for the Meal Logger mobile application.

## Features

- 🔐 JWT-based authentication with access & refresh tokens
- 🍽️ Meal logging with Cloudinary image storage
- 📱 RESTful API endpoints
- 🔒 Security: Helmet, CORS, rate limiting, input validation
- 📊 MongoDB with Mongoose ODM
- 📝 Structured logging with Winston
- 🧪 Test suite (optional - can skip for MVP)
- 🚀 CI/CD ready (optional - can skip for simple deployments)

**Note**: CORS is configured but **doesn't affect APK builds** - mobile apps make direct HTTP requests without CORS restrictions. See `CORS_EXPLANATION.md` for details.

## Tech Stack

- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Image Storage**: Cloudinary
- **Validation**: express-validator
- **Testing**: Jest + Supertest
- **Logging**: Winston + Morgan

## Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or remote)
- Cloudinary account (for image storage)

## Installation

1. **Clone the repository and navigate to server directory:**

```bash
cd server
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env` file from `.env.example`:**

```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`:**

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/meal-logger
JWT_SECRET=your_secure_random_string_min_32_chars
JWT_EXP=15m
JWT_REFRESH_EXP=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

5. **Start MongoDB** (if running locally):

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
```

6. **Seed the database** (optional, for development):

```bash
npm run seed:dev
```

This creates a test user:
- Email: `test@example.com`
- Password: `password123`
- 5 sample meals

## Running the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

The server will start on `http://115.244.141.202:4000` (or your configured PORT).

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user (requires auth)

### Meals

- `POST /api/v1/meals` - Create meal (requires auth)
- `GET /api/v1/meals` - List meals with pagination (requires auth)
- `GET /api/v1/meals/:id` - Get single meal (requires auth)
- `PUT /api/v1/meals/:id` - Update meal (requires auth)
- `DELETE /api/v1/meals/:id` - Delete meal (requires auth)
- `POST /api/v1/meals/bulk` - Bulk create meals for offline sync (requires auth)

### Profile

- `GET /api/v1/profile` - Get user profile (requires auth)
- `PUT /api/v1/profile` - Update profile (requires auth)

### Settings

- `GET /api/v1/settings` - Get user settings (requires auth)
- `PUT /api/v1/settings` - Update settings (requires auth)

### Reminders

- `POST /api/v1/reminders` - Create reminder (requires auth)
- `GET /api/v1/reminders` - List reminders (requires auth)
- `GET /api/v1/reminders/:id` - Get single reminder (requires auth)
- `PUT /api/v1/reminders/:id` - Update reminder (requires auth)
- `DELETE /api/v1/reminders/:id` - Delete reminder (requires auth)

### Health

- `GET /api/v1/health` - Server health check

## API Documentation

### Authentication Flow

1. **Register/Login** → Receive `accessToken` and `refreshToken`
2. **Include token** in requests: `Authorization: Bearer <accessToken>`
3. **Refresh token** when access token expires (before 401 errors)
4. **Logout** to invalidate refresh token

### Example Request

```bash
# Register
curl -X POST http://115.244.141.202:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://115.244.141.202:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Create Meal (with image URL)
curl -X POST http://115.244.141.202:4000/api/v1/meals \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Breakfast",
    "type": "breakfast",
    "date": "2024-01-15T08:00:00Z",
    "calories": 500,
    "imageUrl": "https://example.com/image.jpg"
  }'

# Create Meal (with image file upload)
curl -X POST http://115.244.141.202:4000/api/v1/meals \
  -H "Authorization: Bearer <accessToken>" \
  -F "title=Breakfast" \
  -F "type=breakfast" \
  -F "date=2024-01-15T08:00:00Z" \
  -F "calories=500" \
  -F "image=@/path/to/image.jpg"
```

## Testing (Optional)

Tests are included but **not required** for basic usage. Skip if you're building an MVP.

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

View coverage:

```bash
npm test -- --coverage
```

**Note**: For APK builds, you don't need to run tests. The server just needs to be running.

## Code Quality

### Linting:

```bash
npm run lint
```

### Auto-fix linting issues:

```bash
npm run lint:fix
```

### Formatting:

```bash
npm run format
```

## Project Structure

```
server/
├── src/
│   ├── index.js              # App entry point
│   ├── app.js                # Express app setup
│   ├── config/               # Configuration
│   ├── controllers/          # Route controllers
│   ├── models/               # Mongoose models
│   ├── routes/                # Route definitions
│   ├── middlewares/           # Custom middlewares
│   ├── services/              # Business logic services
│   ├── utils/                 # Utility functions
│   ├── tests/                 # Test files
│   └── scripts/               # Utility scripts
├── logs/                      # Log files (created at runtime)
├── .env.example              # Environment variables template
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── jest.config.js            # Jest configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/meal-logger` |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `JWT_EXP` | Access token expiration | `15m` |
| `JWT_REFRESH_EXP` | Refresh token expiration | `30d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Required |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Required |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Required |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://localhost:8081` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Security Features

- **Helmet**: Sets security HTTP headers
- **CORS**: Configurable origin whitelist
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **Input Validation**: All inputs validated with express-validator
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Error Handling**: Centralized error handling with no stack traces in production

## Database Models

### User
- `name`, `email` (unique), `passwordHash`
- `avatarUrl`, `settings` (reference)
- `refreshTokens` (array)
- `createdAt`, `updatedAt`

### Meal
- `user` (reference), `title`, `type` (enum)
- `date`, `calories`, `imageUrl`
- `cloudinaryPublicId`, `createdAt`, `updatedAt`

### Settings
- `user` (reference, unique)
- `darkMode`, `reminders` (array), `notificationPermission`
- `createdAt`, `updatedAt`

### Reminder
- `user` (reference), `title`, `mealType` (enum)
- `hour`, `minute`, `enabled`
- `createdAt`, `updatedAt`

## Offline Sync Support

The API supports offline sync with:

- **Bulk Create**: `POST /api/v1/meals/bulk` accepts array of meals
- **Timestamps**: All models include `createdAt` and `updatedAt` for conflict resolution
- **Optimistic Locking**: Use `updatedAt` timestamps to detect conflicts

## Deployment

**Recommended: Deploy to Vercel (Free & Easy)**

See **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** for complete guide.

**Quick Steps:**
1. Push code to GitHub
2. Sign up at [vercel.com](https://vercel.com)
3. Import GitHub repo
4. Add environment variables
5. Deploy!

Your API will be live at `https://your-app.vercel.app`

See `DEPLOY_VERCEL.md` for detailed instructions.

## CI/CD (Optional)

GitHub Actions workflow is included but **not required** for simple deployments.

The workflow runs on push/PR:
- Linting
- Tests
- (Optional) Docker build

**To skip CI/CD**: Just don't push to GitHub, or delete `.github/workflows/server-ci.yml`

**For APK builds**: You only need the server running. CI/CD is optional automation.

## Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB is running: `mongosh` or `mongo`
- Check `MONGO_URI` in `.env`
- For Atlas: Ensure IP whitelist includes your IP

### Cloudinary Upload Fails

- Verify credentials in `.env`
- Check Cloudinary dashboard for usage limits
- Ensure image file size < 10MB

### JWT Token Errors

- Verify `JWT_SECRET` is set and consistent
- Check token expiration times
- Ensure `Authorization` header format: `Bearer <token>`

## License

ISC

## Support

For issues and questions, please open an issue in the repository.

