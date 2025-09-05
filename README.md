# 💬 Chat App - Real-Time Messaging with React Native & Node.js

A full-stack mobile chat application built with React Native (Expo), Node.js, Express, Socket.io, and MongoDB. Features JWT authentication, real-time messaging, typing indicators, and message delivery status.

## 🚀 Features

- **Authentication**: JWT-based user registration and login
- **Real-time Messaging**: Instant messaging using Socket.io
- **User Management**: View all registered users and start conversations
- **Message Persistence**: All messages stored in MongoDB
- **Typing Indicators**: See when other users are typing
- **Online Status**: Track user online/offline status
- **Message Status**: Delivery and read receipts
- **Cross-Platform**: Works on iOS, Android, and Web (via Expo)

## 📁 Project Structure

```
Chat-app/
├── mobile/                 # React Native frontend (Expo)
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # App screens (Login, Home, Chat)
│   │   └── utils/         # Socket connection and storage helpers
│   ├── App.js            # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Authentication middleware
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── socket/           # Socket.io handlers
│   ├── index.js         # Server entry point
│   └── package.json
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Expo CLI**: `npm install -g @expo/cli`

### 1. Clone Repository

```bash
git clone https://github.com/SIDDARTHA244/Chat-app.git
cd Chat-app
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/chat-app
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app

# JWT Secret (use a strong, random string)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server Configuration
PORT=5000
CLIENT_ORIGIN=*

# For development, find your local IP:
# Windows: ipconfig
# Mac/Linux: ifconfig
# Use your LAN IP (e.g., 192.168.1.101) if testing on real device
```

### 3. Frontend Setup

```bash
cd ../mobile
npm install
```

**Important**: Update the API URLs in the following files with your actual IP address:

- `mobile/src/api/index.js` - Line 9: Replace `192.168.1.101` with your computer's LAN IP
- `mobile/src/api/auth.js` - Line 7: Replace `192.168.1.101` with your computer's LAN IP
- `mobile/src/utils/socket.js` - Line 4: Replace IP address with your computer's LAN IP

## 🏃‍♂️ Running the Application

### Start Backend Server

```bash
cd server
npm run dev
# OR
npm start
```

The server will start at `http://YOUR_IP:5000`

### Start Mobile App

```bash
cd mobile
expo start
```

This will open the Expo DevTools. You can then:
- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Scan QR code with Expo Go app on your phone

## 📱 Usage Instructions

### 1. User Registration
- Open the app and tap "Register"
- Fill in your name, email, and password
- Tap "Register" to create account

### 2. Login
- Enter your email and password
- Tap "Login" to authenticate

### 3. Start Chatting
- View list of all registered users on home screen
- Tap on any user to start a conversation
- Send real-time messages
- See typing indicators when other user is typing
- Message status shows delivery and read receipts

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Users
- `GET /users` - Get all users (requires authentication)
- `GET /users/me` - Get current user profile

### Conversations
- `GET /conversations` - Get user's conversations
- `GET /conversations/:id/messages` - Get messages in conversation
- `POST /conversations/create` - Create or get conversation

### Messages
- `POST /messages` - Send message
- `POST /messages/read` - Mark messages as read

## 📡 Socket Events

### Client → Server
- `join` - Join user to their room
- `message:send` - Send new message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark message as read

### Server → Client
- `message:new` - Receive new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline

## 🧪 Sample Users for Testing

You can register these sample users for testing:

1. **Alice Johnson**
   - Email: alice@example.com
   - Password: password123

2. **Bob Smith**  
   - Email: bob@example.com
   - Password: password123

3. **Charlie Brown**
   - Email: charlie@example.com  
   - Password: password123

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused Error**
   - Ensure backend server is running
   - Check IP address in mobile API files
   - Verify firewall settings

2. **Login/Register Not Working**
   - Check MongoDB connection
   - Verify JWT_SECRET in .env file
   - Check server logs for errors

3. **Socket Connection Issues**
   - Ensure socket URL matches backend IP
   - Check that Socket.io server is running
   - Verify CORS configuration

4. **Expo/React Native Issues**
   - Clear Expo cache: `expo start -c`
   - Reinstall node_modules: `rm -rf node_modules && npm install`
   - Update Expo CLI: `npm install -g @expo/cli@latest`

### Finding Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your active network interface (usually `en0` or `wlan0`).

## 🛠️ Technology Stack

### Frontend (Mobile)
- **React Native** with Expo
- **React Navigation** for navigation
- **Socket.io Client** for real-time communication
- **AsyncStorage** for local data persistence
- **Axios** for HTTP requests

### Backend (Server)
- **Node.js** with Express.js
- **Socket.io** for WebSocket communication  
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- **SIDDARTHA244** - Initial development
- **SIDDARTHA577** - Collaboration and testing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help setting up the project, please open an issue on GitHub or contact the maintainers.

---

**Happy Chatting! 💬✨**
