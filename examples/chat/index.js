// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 30000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
//all users online
var users = [];

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;
    console.log(socket.id);
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    
    socket.emit('login', {
      numUsers: numUsers,
      //sent all users online to new user
      users: users
    });
    //debug
    console.log(users.length);

    
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      userId: socket.id,
      username: socket.username,
    });
    var user = {
    	userId: socket.id,
    	username: socket.username
    }
    // record every users online
    // if push username first, your username will in yourself list
    users.push(user);
    //debug
    console.log(users.length);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        userId: socket.id,
      });
      //delete the user log out from users array
      for (var i = 0; i < users.length; i++) {
      	if (users[i].username==socket.username) {
      		users.splice(i,1);
      	};
      };
      
    }
    //debug
    console.log(users.length);
  });
});
