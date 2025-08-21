# Contact Management System with WebRTC Video Calling

A comprehensive Flask-based web application that combines contact management with real-time video calling capabilities. Built with modern web technologies including WebRTC, Socket.IO, and Bootstrap for a professional, responsive user experience.

## 🌟 Features

### User Authentication
- **Secure Registration & Login**: User accounts with password hashing using Werkzeug
- **Session Management**: Flask-Login for secure session handling
- **User Isolation**: Each user sees only their own contacts and data

### Contact Management (CRUD)
- **Add Contacts**: Create new contacts with name, email, phone, and notes
- **View Contacts**: Professional card-based contact display
- **Edit Contacts**: Update contact information seamlessly
- **Delete Contacts**: Remove contacts with confirmation
- **Personal Data**: Users only access their own contact lists

### Real-Time Video Calling
- **Unique Room Codes**: Generate shareable codes for video calls
- **WebRTC Integration**: Peer-to-peer video and audio communication
- **Multi-Device Support**: Join calls from different devices using room codes
- **Media Controls**: Mute/unmute microphone and turn camera on/off
- **Room Persistence**: Rooms remain active until all participants leave
- **Rejoin Capability**: Users can leave and rejoin active rooms

### Real-Time Text Chat
- **Integrated Chat**: Text messaging during video calls
- **Socket.IO Powered**: Real-time message delivery
- **Chat History**: Messages persist during the call session
- **User Identification**: Messages show sender information

### Responsive Design
- **Bootstrap 5**: Modern, professional UI components
- **Mobile-Friendly**: Responsive design for all device sizes
- **Professional Styling**: Clean, intuitive user interface
- **Dynamic Navigation**: Context-aware navigation bar

## 🚀 Live Demo

**Deployed Application**: [https://j6h5i7cpj6wz.manus.space](https://j6h5i7cpj6wz.manus.space)

## 🛠️ Technology Stack

### Backend
- **Flask**: Python web framework
- **Flask-SocketIO**: Real-time bidirectional communication
- **Flask-SQLAlchemy**: Database ORM
- **Flask-Login**: User session management
- **Flask-CORS**: Cross-origin resource sharing
- **SQLite**: Lightweight database for data persistence
- **Werkzeug**: Password hashing and security utilities

### Frontend
- **HTML5**: Modern markup with semantic elements
- **CSS3**: Custom styling with Bootstrap integration
- **JavaScript (ES6+)**: Modern JavaScript features
- **Bootstrap 5**: Responsive UI framework
- **WebRTC**: Real-time communication APIs
- **Socket.IO Client**: Real-time client-side communication

### Real-Time Features
- **WebRTC**: Peer-to-peer video/audio communication
- **Socket.IO**: Real-time messaging and signaling
- **STUN Servers**: NAT traversal for WebRTC connections

## 📁 Project Structure

```
contact-management-system/
├── src/
│   ├── main.py                 # Flask application entry point
│   ├── models/
│   │   └── user.py            # User and Contact models
│   ├── routes/
│   │   ├── user.py            # Authentication routes
│   │   └── call.py            # Video calling routes
│   ├── static/
│   │   ├── index.html         # Single-page application
│   │   └── app.js             # Frontend JavaScript application
│   └── database/
│       └── app.db             # SQLite database (auto-created)
├── requirements.txt           # Python dependencies
├── venv/                     # Virtual environment
└── README.md                 # This documentation
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contact-management-system
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python src/main.py
   ```

5. **Access the application**
   - Open your browser to `http://localhost:5000`
   - The database will be created automatically on first run

### Production Deployment

The application is configured for production deployment with:
- Host binding to `0.0.0.0` for external access
- CORS enabled for cross-origin requests
- SQLite database for simplicity (can be upgraded to PostgreSQL)
- Environment-based configuration support

## 📱 Usage Guide

### Getting Started
1. **Register**: Create a new account with username, email, and password
2. **Login**: Access your personal dashboard
3. **Add Contacts**: Start building your contact list

### Managing Contacts
1. Navigate to the "Contacts" section
2. Click "Add Contact" to create new entries
3. Use "Edit" and "Delete" buttons on contact cards
4. All contacts are private to your account

### Video Calling
1. **Start a Call**:
   - Go to "Video Call" section
   - Click "Create Room" to generate a unique code
   - Share the code with the person you want to call

2. **Join a Call**:
   - Enter the room code in the "Join Existing Call" field
   - Click "Join" to enter the video call

3. **During the Call**:
   - Use microphone and camera controls
   - Send text messages via the integrated chat
   - Leave and rejoin as needed

### Multi-Device Support
- Use the same room code on different devices
- Access from laptops, tablets, or mobile devices
- Responsive design adapts to screen size

## 🔒 Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **Session Management**: Secure user sessions with Flask-Login
- **Data Isolation**: Users can only access their own data
- **CSRF Protection**: Built-in Flask security features
- **Input Validation**: Server-side validation for all user inputs

## 🌐 Browser Compatibility

- **Chrome**: Full WebRTC support (recommended)
- **Firefox**: Full WebRTC support
- **Safari**: WebRTC support (iOS 11+)
- **Edge**: Full WebRTC support

## 🚀 Performance Features

- **Single-Page Application**: Fast navigation without page reloads
- **Real-Time Updates**: Instant contact updates and messaging
- **Efficient Database Queries**: Optimized SQLAlchemy queries
- **Responsive Design**: Optimized for all device sizes

## 🔧 Configuration

### Environment Variables
- `FLASK_ENV`: Set to 'production' for production deployment
- `SECRET_KEY`: Flask secret key for session security
- `DATABASE_URL`: Database connection string (optional)

### WebRTC Configuration
- STUN servers configured for NAT traversal
- Automatic media device detection
- Fallback handling for unsupported browsers

## 📊 Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: User email address
- `password_hash`: Hashed password

### Contacts Table
- `id`: Primary key
- `name`: Contact name
- `email`: Contact email (optional)
- `phone`: Contact phone (optional)
- `notes`: Additional notes (optional)
- `user_id`: Foreign key to users table

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues, questions, or contributions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🎯 Future Enhancements

- **Group Video Calls**: Support for multiple participants
- **File Sharing**: Share files during calls
- **Call Recording**: Record video calls
- **Contact Import**: Import contacts from CSV/vCard
- **Advanced Search**: Search and filter contacts
- **Call History**: Track call logs and duration
- **Mobile App**: Native mobile applications
- **Screen Sharing**: Share screen during calls

---

**Built with ❤️ using Flask, WebRTC, and modern web technologies**

