// Global variables
let currentUser = null;
let socket = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let currentRoomCode = null;
let isAudioMuted = false;
let isVideoOff = false;

// WebRTC configuration
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:YOUR_TURN_SERVER_URL',
            username: 'USERNAME',
            credential: 'CREDENTIAL'
        }
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check authentication status
    await checkAuthStatus();
    
    // Initialize Socket.IO if user is authenticated
    if (currentUser) {
        initializeSocket();
    }
    
    // Set up event listeners
    setupEventListeners();
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showAuthenticatedUI();
        } else {
            showPage('login');
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showPage('login');
    }
}

function showAuthenticatedUI() {
    document.getElementById('username-display').textContent = currentUser.username;
    document.getElementById('user-menu').style.display = 'block';
    showPage('dashboard');
}

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Contact form
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveContact();
    });
    
    // Chat input
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Join room input
    document.getElementById('join-room-code').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            joinCallRoom();
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showAlert('Login successful!', 'success');
            showAuthenticatedUI();
            initializeSocket();
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            showPage('login');
            // Clear form
            document.getElementById('register-form').reset();
        } else {
            showAlert(data.error || 'Registration failed', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'danger');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        
        // Disconnect socket
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        
        // Stop any active streams
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        showAlert('Logged out successfully', 'info');
        showPage('login');
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout failed', 'danger');
    }
}

// Page navigation
function showPage(pageId) {
    // Hide all pages
    const pages = ['login-page', 'register-page', 'dashboard-page', 'contacts-page', 'call-page'];
    pages.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show selected page
    document.getElementById(pageId + '-page').classList.remove('hidden');
    
    // Update navigation
    updateNavigation(pageId);
    
    // Load page-specific data
    if (pageId === 'contacts') {
        loadContacts();
    } else if (pageId === 'call') {
        resetCallInterface();
    }
}

function updateNavigation(activePageId) {
    const navItems = ['nav-dashboard', 'nav-contacts', 'nav-call'];
    navItems.forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    
    if (activePageId !== 'login' && activePageId !== 'register') {
        const activeNavId = 'nav-' + activePageId;
        if (document.getElementById(activeNavId)) {
            document.getElementById(activeNavId).classList.add('active');
        }
    }
}

// Contact management functions
async function loadContacts() {
    try {
        const response = await fetch('/api/contacts');
        const contacts = await response.json();
        
        displayContacts(contacts);
    } catch (error) {
        console.error('Error loading contacts:', error);
        showAlert('Failed to load contacts', 'danger');
    }
}

function displayContacts(contacts) {
    const container = document.getElementById('contacts-list');
    
    if (contacts.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-people text-muted" style="font-size: 4rem;"></i>
                    <h4 class="text-muted mt-3">No contacts yet</h4>
                    <p class="text-muted">Add your first contact to get started!</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card contact-card h-100">
                <div class="card-body">
                    <h5 class="card-title">
                        <i class="bi bi-person-circle text-primary me-2"></i>
                        ${escapeHtml(contact.name)}
                    </h5>
                    ${contact.email ? `<p class="card-text mb-1"><i class="bi bi-envelope me-2"></i>${escapeHtml(contact.email)}</p>` : ''}
                    ${contact.phone ? `<p class="card-text mb-1"><i class="bi bi-telephone me-2"></i>${escapeHtml(contact.phone)}</p>` : ''}
                    ${contact.notes ? `<p class="card-text"><i class="bi bi-sticky me-2"></i>${escapeHtml(contact.notes)}</p>` : ''}
                    
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editContact(${contact.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteContact(${contact.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddContactModal() {
    document.getElementById('contactModalTitle').textContent = 'Add Contact';
    document.getElementById('contact-form').reset();
    document.getElementById('contact-id').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('contactModal'));
    modal.show();
}

async function editContact(contactId) {
    try {
        const response = await fetch(`/api/contacts/${contactId}`);
        const contact = await response.json();
        
        document.getElementById('contactModalTitle').textContent = 'Edit Contact';
        document.getElementById('contact-id').value = contact.id;
        document.getElementById('contact-name').value = contact.name;
        document.getElementById('contact-email').value = contact.email || '';
        document.getElementById('contact-phone').value = contact.phone || '';
        document.getElementById('contact-notes').value = contact.notes || '';
        
        const modal = new bootstrap.Modal(document.getElementById('contactModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading contact:', error);
        showAlert('Failed to load contact details', 'danger');
    }
}

async function saveContact() {
    const contactId = document.getElementById('contact-id').value;
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const phone = document.getElementById('contact-phone').value;
    const notes = document.getElementById('contact-notes').value;
    
    if (!name.trim()) {
        showAlert('Name is required', 'warning');
        return;
    }
    
    const contactData = { name, email, phone, notes };
    
    try {
        const url = contactId ? `/api/contacts/${contactId}` : '/api/contacts';
        const method = contactId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });
        
        if (response.ok) {
            showAlert(contactId ? 'Contact updated successfully' : 'Contact added successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
            loadContacts();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to save contact', 'danger');
        }
    } catch (error) {
        console.error('Error saving contact:', error);
        showAlert('Failed to save contact', 'danger');
    }
}

async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/contacts/${contactId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Contact deleted successfully', 'success');
            loadContacts();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to delete contact', 'danger');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showAlert('Failed to delete contact', 'danger');
    }
}

// Video call functions
function resetCallInterface() {
    document.getElementById('call-setup').classList.remove('hidden');
    document.getElementById('active-call').classList.add('hidden');
    document.getElementById('join-room-code').value = '';
    
    // Stop any existing streams
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    currentRoomCode = null;
    isAudioMuted = false;
    isVideoOff = false;
}

async function createCallRoom() {
    try {
        const response = await fetch('/api/create-room', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentRoomCode = data.room_code;
            await startCall();
            showAlert(`Room created! Share code: ${currentRoomCode}`, 'success');
        } else {
            showAlert(data.error || 'Failed to create room', 'danger');
        }
    } catch (error) {
        console.error('Error creating room:', error);
        showAlert('Failed to create room', 'danger');
    }
}

async function joinCallRoom() {
    const roomCode = document.getElementById('join-room-code').value.trim().toUpperCase();
    
    if (!roomCode) {
        showAlert('Please enter a room code', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/join-room/${roomCode}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentRoomCode = roomCode;
            await startCall();
            showAlert('Joined room successfully!', 'success');
        } else {
            showAlert(data.error || 'Failed to join room', 'danger');
        }
    } catch (error) {
        console.error('Error joining room:', error);
        showAlert('Failed to join room', 'danger');
    }
}

async function startCall() {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true
        });
        
        document.getElementById('local-video').srcObject = localStream;
        
        // Show call interface
        document.getElementById('call-setup').classList.add('hidden');
        document.getElementById('active-call').classList.remove('hidden');
        document.getElementById('current-room-code').textContent = currentRoomCode;
        
        // Join Socket.IO room
        socket.emit('join_call_room', {
            room_code: currentRoomCode,
            username: currentUser.username
        });
        
        // Initialize peer connection
        initializePeerConnection();
        
    } catch (error) {
        console.error('Error starting call:', error);
        showAlert('Failed to access camera/microphone', 'danger');
    }
}

function initializePeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Handle remote stream
    remoteStream = new MediaStream();
    document.getElementById('remote-video').srcObject = remoteStream;

peerConnection.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach(track => {
        if (!remoteStream.getTracks().find(t => t.kind === track.kind)) {
            remoteStream.addTrack(track);
        }
    });
    document.getElementById('remote-user-badge').textContent = 'Connected';
};
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('webrtc_ice_candidate', {
                room_code: currentRoomCode,
                candidate: event.candidate,
                sender: currentUser.username
            });
        }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'disconnected') {
            document.getElementById('remote-user-badge').textContent = 'Disconnected';
        }
    };
}

async function createOffer() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('webrtc_offer', {
            room_code: currentRoomCode,
            offer: offer,
            sender: currentUser.username
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

async function createAnswer(offer) {
    try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('webrtc_answer', {
            room_code: currentRoomCode,
            answer: answer,
            sender: currentUser.username
        });
    } catch (error) {
        console.error('Error creating answer:', error);
    }
}

function toggleMute() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            isAudioMuted = !audioTrack.enabled;
            
            const muteBtn = document.getElementById('mute-btn');
            const icon = muteBtn.querySelector('i');
            
            if (isAudioMuted) {
                muteBtn.className = 'control-btn muted';
                icon.className = 'bi bi-mic-mute-fill';
            } else {
                muteBtn.className = 'control-btn unmuted';
                icon.className = 'bi bi-mic-fill';
            }
            
            // Notify other participants
            socket.emit('media_state_change', {
                room_code: currentRoomCode,
                username: currentUser.username,
                audio_enabled: !isAudioMuted,
                video_enabled: !isVideoOff
            });
        }
    }
}

function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            isVideoOff = !videoTrack.enabled;
            
            const videoBtn = document.getElementById('video-btn');
            const icon = videoBtn.querySelector('i');
            
            if (isVideoOff) {
                videoBtn.className = 'control-btn video-off';
                icon.className = 'bi bi-camera-video-off-fill';
            } else {
                videoBtn.className = 'control-btn video-on';
                icon.className = 'bi bi-camera-video-fill';
            }
            
            // Notify other participants
            socket.emit('media_state_change', {
                room_code: currentRoomCode,
                username: currentUser.username,
                audio_enabled: !isAudioMuted,
                video_enabled: !isVideoOff
            });
        }
    }
}

async function leaveCall() {
    try {
        if (currentRoomCode) {
            await fetch(`/api/leave-room/${currentRoomCode}`, {
                method: 'POST'
            });
            
            socket.emit('leave_call_room', {
                room_code: currentRoomCode,
                username: currentUser.username
            });
        }
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        
        // Close peer connection
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        
        resetCallInterface();
        showAlert('Left call successfully', 'info');
        
    } catch (error) {
        console.error('Error leaving call:', error);
        resetCallInterface();
    }
}

// Chat functions
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message && currentRoomCode) {
        const timestamp = new Date().toLocaleTimeString();
        
        socket.emit('chat_message', {
            room_code: currentRoomCode,
            message: message,
            username: currentUser.username,
            timestamp: timestamp
        });
        
        input.value = '';
    }
}

function displayChatMessage(data) {
    const messagesContainer = document.getElementById('chat-messages');
    const isOwnMessage = data.username === currentUser.username;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    messageDiv.innerHTML = `
        <div>${escapeHtml(data.message)}</div>
        <div class="message-time">${data.username} • ${data.timestamp}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Socket.IO functions
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    socket.on('user_joined', (data) => {
        showAlert(`${data.username} joined the call`, 'info');
        // If we're already in a call, create an offer for the new user
        if (peerConnection && currentRoomCode) {
            setTimeout(() => createOffer(), 1000);
        }
    });
    
    socket.on('user_left', (data) => {
        showAlert(`${data.username} left the call`, 'info');
        document.getElementById('remote-user-badge').textContent = 'Waiting...';
        document.getElementById('remote-video').srcObject = null;
    });
    
    socket.on('webrtc_offer', async (data) => {
        if (peerConnection) {
            await createAnswer(data.offer);
        }
    });
    
    socket.on('webrtc_answer', async (data) => {
        if (peerConnection) {
            await peerConnection.setRemoteDescription(data.answer);
        }
    });
    
    socket.on('webrtc_ice_candidate', async (data) => {
        if (peerConnection) {
            await peerConnection.addIceCandidate(data.candidate);
        }
    });
    
    socket.on('chat_message', (data) => {
        displayChatMessage(data);
    });
    
    socket.on('media_state_change', (data) => {
        console.log('Media state change:', data);
        // You could show indicators for remote user's mute/video state here
    });
}

// Utility functions
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const alert = bootstrap.Alert.getOrCreateInstance(alertElement);
            alert.close();
        }
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showUserProfile() {
    if (currentUser) {
        showAlert(`Username: ${currentUser.username}\nEmail: ${currentUser.email}`, 'info');
    }
}

