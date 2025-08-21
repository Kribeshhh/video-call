from flask import Blueprint, jsonify, request, session
from flask_login import login_user, logout_user, login_required, current_user
from src.models.user import User, Contact, db

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User registered successfully', 'user': user.to_dict()}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return jsonify({'message': 'Login successful', 'user': user.to_dict()}), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@user_bp.route('/current-user', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({'user': current_user.to_dict()}), 200

@user_bp.route('/check-auth', methods=['GET'])
def check_auth():
    if current_user.is_authenticated:
        return jsonify({'authenticated': True, 'user': current_user.to_dict()}), 200
    else:
        return jsonify({'authenticated': False}), 200

# Contact management endpoints
@user_bp.route('/contacts', methods=['GET'])
@login_required
def get_contacts():
    contacts = Contact.query.filter_by(user_id=current_user.id).all()
    return jsonify([contact.to_dict() for contact in contacts])

@user_bp.route('/contacts', methods=['POST'])
@login_required
def create_contact():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email', '')
        phone = data.get('phone', '')
        notes = data.get('notes', '')
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        contact = Contact(
            name=name,
            email=email,
            phone=phone,
            notes=notes,
            user_id=current_user.id
        )
        db.session.add(contact)
        db.session.commit()
        
        return jsonify(contact.to_dict()), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/contacts/<int:contact_id>', methods=['GET'])
@login_required
def get_contact(contact_id):
    contact = Contact.query.filter_by(id=contact_id, user_id=current_user.id).first()
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    return jsonify(contact.to_dict())

@user_bp.route('/contacts/<int:contact_id>', methods=['PUT'])
@login_required
def update_contact(contact_id):
    try:
        contact = Contact.query.filter_by(id=contact_id, user_id=current_user.id).first()
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
        
        data = request.json
        contact.name = data.get('name', contact.name)
        contact.email = data.get('email', contact.email)
        contact.phone = data.get('phone', contact.phone)
        contact.notes = data.get('notes', contact.notes)
        
        db.session.commit()
        return jsonify(contact.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/contacts/<int:contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    try:
        contact = Contact.query.filter_by(id=contact_id, user_id=current_user.id).first()
        if not contact:
            return jsonify({'error': 'Contact not found'}), 404
        
        db.session.delete(contact)
        db.session.commit()
        return jsonify({'message': 'Contact deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Legacy user endpoints (keeping for compatibility)
@user_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())
