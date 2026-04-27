const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join_room', async ({ roomCode, name, avatar }) => {
    if (!roomCode) return;
    
    const cleanCode = roomCode.toUpperCase().trim();
    await socket.join(cleanCode);
    
    console.log(`[ROOM] Socket ${socket.id} joined ${cleanCode}`);
    
    if (!rooms.has(cleanCode)) {
      console.log(`[ROOM] Creating ${cleanCode} with host ${socket.id}`);
      rooms.set(cleanCode, { players: [], hostId: socket.id });
    }
    
    const room = rooms.get(cleanCode);
    
    // Check if room has a host, if not, assign current user
    if (!room.hostId) {
      room.hostId = socket.id;
    }
    
    // Ensure the player is added or updated
    const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
    const playerInfo = {
      id: socket.id,
      name: name === 'YOU' ? (room.players.length === 0 ? 'Player 1' : `Player ${room.players.length + 1}`) : (name || 'Player'),
      avatar: avatar || '👤',
      isHost: room.hostId === socket.id
    };

    if (existingPlayerIndex === -1) {
      if (room.players.length < 4) {
        room.players.push(playerInfo);
        console.log(`[ROOM] ${cleanCode} now has ${room.players.length} players`);
      }
    } else {
      room.players[existingPlayerIndex] = playerInfo;
    }

    // Crucial: Use io.in(cleanCode) to ensure everyone in the room gets it
    const updateData = { 
      players: room.players, 
      hostId: room.hostId,
      timestamp: Date.now() // Add timestamp to force update
    };
    
    io.in(cleanCode).emit('room_update', updateData);
    console.log(`[ROOM] Broadcasted update for ${cleanCode}`);
  });

  socket.on('start_game', ({ roomCode, initialState }) => {
    const room = rooms.get(roomCode);
    if (room) {
      console.log(`[GAME] Starting game in room ${roomCode} with ${room.players.length} players`);
      console.log(`[GAME] Initial state received from host ${socket.id}`);
      io.to(roomCode).emit('game_started', { players: room.players, initialState });
      console.log(`[GAME] Broadcasted game_started to room ${roomCode}`);
    } else {
      console.log(`[GAME] Failed to start game: room ${roomCode} not found`);
    }
  });

  socket.on('game_action', ({ roomCode, action, data }) => {
    socket.to(roomCode).emit('game_action', { action, data, senderId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    // Handle player removal from rooms
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        console.log(`Removed user ${socket.id} from room ${roomCode}. Remaining: ${room.players.length}`);
        
        // If host disconnected, assign new host if players remain
        if (room.hostId === socket.id && room.players.length > 0) {
          room.hostId = room.players[0].id;
          // Update isHost property for all players
          room.players.forEach(p => p.isHost = p.id === room.hostId);
          console.log(`[ROOM] Host left ${roomCode}. New host is ${room.hostId}`);
        }
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          io.to(roomCode).emit('room_update', { players: room.players, hostId: room.hostId });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
