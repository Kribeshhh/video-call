import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_login import LoginManager
from flask_socketio import SocketIO, emit, join_room, leave_room
from src.models.user import db, User
from src.routes.user import user_bp
from src.routes.call import call_bp, active_rooms

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'user.login'
login_manager.login_message = 'Please log in to access this page.'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(call_bp, url_prefix='/api')

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://")  # Render fix
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    db_path = os.path.join(os.path.dirname(__file__), 'database')
    os.makedirs(db_path, exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(db_path, 'app.db')}"
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_call_room')
def handle_join_call_room(data):
    """Handle user joining a call room"""
    room_code = data.get('room_code')
    username = data.get('username')
    
    if room_code and room_code in active_rooms:
        join_room(room_code)
        emit('user_joined', {
            'username': username,
            'message': f'{username} joined the call'
        }, room=room_code)
        print(f'User {username} joined room {room_code}')

@socketio.on('leave_call_room')
def handle_leave_call_room(data):
    """Handle user leaving a call room"""
    room_code = data.get('room_code')
    username = data.get('username')
    
    if room_code:
        leave_room(room_code)
        emit('user_left', {
            'username': username,
            'message': f'{username} left the call'
        }, room=room_code)
        print(f'User {username} left room {room_code}')

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    """Handle WebRTC offer"""
    room_code = data.get('room_code')
    offer = data.get('offer')
    sender = data.get('sender')
    
    emit('webrtc_offer', {
        'offer': offer,
        'sender': sender
    }, room=room_code, include_self=False)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    """Handle WebRTC answer"""
    room_code = data.get('room_code')
    answer = data.get('answer')
    sender = data.get('sender')
    
    emit('webrtc_answer', {
        'answer': answer,
        'sender': sender
    }, room=room_code, include_self=False)

@socketio.on('webrtc_ice_candidate')
def handle_ice_candidate(data):
    """Handle ICE candidate"""
    room_code = data.get('room_code')
    candidate = data.get('candidate')
    sender = data.get('sender')
    
    emit('webrtc_ice_candidate', {
        'candidate': candidate,
        'sender': sender
    }, room=room_code, include_self=False)

@socketio.on('chat_message')
def handle_chat_message(data):
    """Handle chat messages during calls"""
    room_code = data.get('room_code')
    message = data.get('message')
    username = data.get('username')
    timestamp = data.get('timestamp')
    
    emit('chat_message', {
        'message': message,
        'username': username,
        'timestamp': timestamp
    }, room=room_code)

@socketio.on('media_state_change')
def handle_media_state_change(data):
    """Handle mute/unmute and camera on/off events"""
    room_code = data.get('room_code')
    username = data.get('username')
    audio_enabled = data.get('audio_enabled')
    video_enabled = data.get('video_enabled')
    
    emit('media_state_change', {
        'username': username,
        'audio_enabled': audio_enabled,
        'video_enabled': video_enabled
    }, room=room_code, include_self=False)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

