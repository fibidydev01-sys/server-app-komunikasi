# Chat App Pro - Backend

Real-time chat application backend built with NestJS, Prisma, PostgreSQL, and Socket.IO.

## 🚀 Features

- ✅ JWT Authentication with HTTP-only cookies
- ✅ Real-time messaging with WebSocket
- ✅ Private 1-on-1 chats
- ✅ Online/offline status tracking
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ File upload support (Cloudinary)
- ✅ Global exception handling
- ✅ Request validation with class-validator

## 📦 Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **File Upload**: Cloudinary

## 🛠️ Installation

### 1. Clone & Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Setup Database

```bash
# Create .env file
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/chatapp?schema=public"

# Run Prisma migrations
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Configure Environment Variables

Edit `.env` file:

```env
NODE_ENV=development
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/chatapp?schema=public"

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Optional: Cloudinary for image upload
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:5173
```

### 4. Run Development Server

```bash
npm run start:dev
```

Server will run on `http://localhost:8000`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Get current user

### Users

- `GET /api/user/all` - Get all users (exclude current user)

### Chats

- `POST /api/chats` - Create new chat
- `GET /api/chats` - Get all user chats
- `GET /api/chats/:id` - Get chat by ID
- `DELETE /api/chats/:id` - Delete chat

### Messages

- `POST /api/messages` - Send message
- `GET /api/messages/chat/:chatId` - Get chat messages
- `DELETE /api/messages/:id` - Delete message
- `PATCH /api/messages/:id/read` - Mark message as read

## 🔌 WebSocket Events

### Client → Server

- `message:send` - Send a message
- `typing:start` - User starts typing
- `typing:stop` - User stops typing
- `message:read` - Mark message as read

### Server → Client

- `message:receive` - Receive new message
- `user:online` - User comes online
- `user:offline` - User goes offline
- `typing:start` - Someone starts typing
- `typing:stop` - Someone stops typing
- `message:read` - Message marked as read

## 🔐 Authentication Flow

1. User registers/logs in
2. Server generates JWT token
3. Token stored in HTTP-only cookie
4. Cookie sent automatically with each request
5. WebSocket uses token for authentication

## 📂 Project Structure

```
src/
├── common/           # Shared utilities
│   ├── constants/    # Constants
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   └── guards/       # Auth guards
├── config/           # Configuration files
├── modules/
│   ├── auth/         # Authentication module
│   ├── chat/         # Chat module + WebSocket
│   ├── message/      # Message module
│   └── user/         # User module
├── prisma/           # Prisma service
├── app.module.ts     # Root module
└── main.ts           # Entry point
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Production Build

```bash
# Build
npm run build

# Run production
npm run start:prod
```

## 📝 Environment Variables

| Variable          | Description    | Default                 |
| ----------------- | -------------- | ----------------------- |
| `NODE_ENV`        | Environment    | `development`           |
| `PORT`            | Server port    | `8000`                  |
| `DATABASE_URL`    | PostgreSQL URL | Required                |
| `JWT_SECRET`      | JWT secret key | Required                |
| `JWT_EXPIRES_IN`  | JWT expiration | `7d`                    |
| `FRONTEND_ORIGIN` | CORS origin    | `http://localhost:5173` |
| `CLIENT_URL`      | WebSocket CORS | `http://localhost:3000` |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License
