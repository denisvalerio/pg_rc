var path=require('path');
var express = require('express');
var app = express();
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3230;
var artist_name="";


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});
//app.use(express.static(__dirname+'/../app/'));

app.set('view engine','ejs');

// rindirizzo alla chat pubblica
app.get('/publicchat',function(req,res){
  var username=req.query.q;
  artist_name=req.query.a;
  res.render('publicchat',{username:username});

})



// Numero totale di utenti nella room
var numUsers = 0;
// Lista di room
var curRoomList = {};

// Azioni possibili per gli utenti (creare room, entrare in una già esistente, abbandonarla)
var logCreate = ' ha creato ';
var logJoin = ' è entrato nella ';
var logLeft = ' ha lasciato ';


var logLab = 'chat';
var logRoom = 'room ';

// Connessione tramite socket.io
// E la room di default è creata al nome dell'artista cercato
io.on('connection', function (socket) {
  var addedUser = false;
  var curRoomName = artist_name;

  // Quando il client manda un nuovo messaggio viene preso ed eseguito
  // (mandato sulla room selezionata dall'utente)
  socket.on('new message', function (data) {

    // Esegue l'inoltro del messaggio a tutti gli utenti che sono in quella room
    socket.broadcast.to(curRoomName).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // Funzione eseguita quando si aggiunge un utente
  socket.on('add user', function (username) {
    if (addedUser) return;

    // Memorizziamo l'username nella socket della sessione per quest utente
    socket.username = username;
    ++numUsers;
    addedUser = true;

    // Prendo parte alla room di default
    socket.join(curRoomName);

    // Verifico se questo room-name non è presente nella lista delle rooms ed in caso
    // aggiungo il room-name alla lista e metto user-number ad 1,
    // altrimenti incremento di 1 il suo nome in lista
    if (!isRoomExist(curRoomName, curRoomList)) {
      curRoomList[curRoomName] = 1;
    } else {
      ++curRoomList[curRoomName];
    }

    // All inizio mostro la lista delle rooms
    socket.emit('show room list', curRoomName, curRoomList);

    socket.emit('login', {
      numUsers: numUsers
    });

    // Stampo nella room il nickname dell'utente appena entrato
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      logAction: logJoin,
      logLocation: logLab,
      roomName: '',
      userJoinOrLeftRoom: false
    });
  });

  // Quando l'utente sta scrivendo lo notifico broadcast
  // a tutti gli altri utenti nella room
  socket.on('typing', function () {
    socket.broadcast.to(curRoomName).emit('typing', {
      username: socket.username
    });
  });

  // Quando l'utente ha smessodi scrivere lo notifico broadcast
  // a tutti gli altri utenti nella room
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // Funzione per quando l'utente si disconnette
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      --curRoomList[curRoomName];

      // Se non ci sono utenti nella room la cancello
      // Eccetto se è la room di default
      if (curRoomList[curRoomName] === 0 && curRoomName !== artist_name) {
        delete curRoomList[curRoomName];
      }

      if (numUsers === 0) {
        curRoomList = {};
      }
      // Notifico globalmente che questo cliente ha abbandonato
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        logAction: logLeft,
        logLocation: logLab,
        roomName: ''
      });
    }
  });

  // Mostro la lista di room all'utente
  socket.on('room list', function () {
    socket.emit('show room list', curRoomName, curRoomList);
  });

  socket.on('join room', function (room) {
    socket.emit('stop typing');

    if (room !== curRoomName) {

      //Quando l'utente entra in una nuova room
      // automaticamnte lascia quella precedente
      socket.leave(curRoomName);
      socket.broadcast.to(curRoomName).emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        logAction: logLeft,
        logLocation: logRoom,
        roomName: '「' + curRoomName + '」',
        userJoinOrLeftRoom: true
      });
      --curRoomList[curRoomName];

      if (curRoomList[curRoomName] === 0 && curRoomName !== artist_name) {
        delete curRoomList[curRoomName];
      }

      // Entra nella nuova room scelta
      socket.join(room);

      // Se non è presente la room (che voglio creare) nella
      // lista delle room, la creo.
      if (!isRoomExist(room, curRoomList)) {
        curRoomList[room] = 1;
        socket.emit('join left result', {
          username: socket.username,
          logAction: logCreate,
          logLocation: logRoom,
          roomName: '「' + room + '」'
        });
      } else {
        ++curRoomList[room];
        socket.emit('join left result', {
          username: socket.username,
          logAction: logJoin,
          logLocation: logRoom,
          roomName: '「' + room + '」'
        });
      }

      // Ogni volta che un utente entra nella room, si aggiorna la lista utenti di quella room
      socket.emit('show room list', room, curRoomList);
      curRoomName = room;
      socket.broadcast.to(room).emit('user joined', {
        username: socket.username,
        numUsers: numUsers,
        logAction: logJoin,
        logLocation: logRoom,
        roomName: '「' + room + '」',
        userJoinOrLeftRoom: true
      })
    }
  });
});

// Funzione che verifica se la room che si vuole creare è nella lista
function isRoomExist (roomName, roomList) {
  return roomList[roomName] >= 0;
}
