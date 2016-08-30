var app   = require('express')();
var http  = require('http').Server(app);
var io    = require('socket.io')(http);

var port  = process.env.PORT || 8080;

var idMapping = [];

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});

app.get('/', function(req, res){
  res.send('welcome to my chat server');
});

// usernames which are currently connected to the chat
var usernames = {};

var getSocketIdForUser = function(id) {
  var socketIdToReturn = false;
  idMapping.map(function(user) {
    if (user.id == id) {
      socketIdToReturn = user.socketId;
    }
  });
  return socketIdToReturn;
}

io.on('connection', function (socket) {

  var addedUser = false;

  socket.on('register-user', function(id) {
    var userFound = false;
    idMapping.map(function(user) {
      if (user.id === id) {
        user.socketId = socket.id;
        userFound = true;
      }
    });
    if (!userFound) {
      var newUser = {
        id: id,
        socketId: socket.id
      };
      idMapping.push(newUser);
    }
  });

  socket.on('new message', function (data) {
    var toSocketId = getSocketIdForUser(data.toUserId);
    if (toSocketId) {
      io.to(toSocketId).emit('new message', data);
      io.to(socket.id).emit('new message', data);
    } else {
      io.to(socket.id).emit('new message', data);
    }
  });

  socket.on('disconnect', function () {
    var indexToRemove = null;
    idMapping.map(function(user, index) {
      if (user.socketId == socket.id) {
        indexToRemove = index;
      }
    });
    idMapping.splice(indexToRemove, 1);
  });

});

app.get('/usernames', function(req, res){
  res.send(usernames);
});

http.listen(port, function(){
  console.log('listening on *:'+port);
});