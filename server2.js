var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(2000);
var username="";
console.log('server started');

app.set('view engine','ejs');
app.get('/privatechat',function(req,res){
  username=req.query.q;
  console.log(username);
  res.render('privatechat',{username:username});

})


	var user_ids = {}

	io.sockets.on('connection', function(socket){

		// Registra nickname utente
    if(socket.username!=username){
    socket.username = username;
    user_ids[ socket.username ] = socket;
  }


		// Invio un messaggio privato
		socket.on('private_message_sent', function(data, callback){

			//Se quell utente è presente nalla lista, invia messaggio

			if( data.to in user_ids && data.to!=socket.username){
				var processed_msg ={
					msg: data.msg,
					from: socket.username
				}
				//Invia messaggio all utente con cui ho stabilito la connessione
				user_ids[data.to].emit( 'private_message_from_server', processed_msg );
				callback(processed_msg)
			}
			else
				callback(false)
		})
		// Ogni volta che esci dalla chat, chiudo la connessione

	})
