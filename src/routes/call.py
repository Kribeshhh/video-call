from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from flask_socketio import emit, join_room, leave_room, rooms
import uuid
import string
import random

call_bp = Blueprint('call', __name__)

# Store active call rooms
active_rooms = {}

def generate_room_code():
    """Generate a unique 6-character room code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@call_bp.route('/create-room', methods=['POST'])
@login_required
def create_room():
    """Create a new call room with a unique code"""
    try:
        room_code = generate_room_code()
        
        # Ensure the room code is unique
        while room_code in active_rooms:
            room_code = generate_room_code()
        
        # Initialize room data
        active_rooms[room_code] = {
            'creator': current_user.id,
            'participants': [],
            'created_at': str(uuid.uuid4())  # Using uuid as timestamp placeholder
        }
        
        return jsonify({
            'room_code': room_code,
            'message': 'Room created successfully'
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/join-room/<room_code>', methods=['POST'])
@login_required
def join_room_api(room_code):
    """Join an existing call room"""
    try:
        if room_code not in active_rooms:
            return jsonify({'error': 'Room not found'}), 404
        
        room = active_rooms[room_code]
        
        # Check if user is already in the room
        user_in_room = any(p['user_id'] == current_user.id for p in room['participants'])
        
        if not user_in_room:
            # Add user to room participants
            room['participants'].append({
                'user_id': current_user.id,
                'username': current_user.username
            })
        
        return jsonify({
            'message': 'Joined room successfully',
            'room_code': room_code,
            'participants': room['participants']
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/leave-room/<room_code>', methods=['POST'])
@login_required
def leave_room_api(room_code):
    """Leave a call room"""
    try:
        if room_code not in active_rooms:
            return jsonify({'error': 'Room not found'}), 404
        
        room = active_rooms[room_code]
        
        # Remove user from room participants
        room['participants'] = [p for p in room['participants'] if p['user_id'] != current_user.id]
        
        # If no participants left, remove the room
        if not room['participants']:
            del active_rooms[room_code]
        
        return jsonify({'message': 'Left room successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/room-status/<room_code>', methods=['GET'])
@login_required
def get_room_status(room_code):
    """Get the status of a call room"""
    try:
        if room_code not in active_rooms:
            return jsonify({'error': 'Room not found'}), 404
        
        room = active_rooms[room_code]
        return jsonify({
            'room_code': room_code,
            'participants': room['participants'],
            'participant_count': len(room['participants'])
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/active-rooms', methods=['GET'])
@login_required
def get_active_rooms():
    """Get all active rooms (for debugging)"""
    return jsonify({
        'active_rooms': list(active_rooms.keys()),
        'total_rooms': len(active_rooms)
    }), 200

