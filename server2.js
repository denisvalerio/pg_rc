var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(2000);

console.log('server started');

app.set('view engine','ejs');
app.get('/privatechat',function(req,res){
  var username=req.query.q;
  console.log(username);
  res.render('privatechat',{username:username});

})


	var user_ids = {}

	io.sockets.on('connection', function(socket){

		// Registra nickname utente
		socket.on('register_id', function(sent_id, callback){ 

			// Verifica se quel nickname è già presente nella user-ids
			// in caso affermativo manda un acallback FALSE
			// (non poso scrivermi da solo)
			if( sent_id in user_ids ){ 						 
				callback(false);						 	  
			}
			// Setto username dell utente ch entra e l'aggiungo alla lista
			else{
				socket.username = sent_id;
				user_ids[ socket.username ] = socket;
				callback(sent_id);
			}
		});


		// Invio un messaggio privato
		socket.on('private_message_sent', function(data, callback){

			//Se quell utente è presente nalla lista, invia messaggio
			if( data.to in user_ids ){ 
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
		// Ogni volta che esci dala chat, chiudo la connessione
	 socket.on('disconnect', function(data){
		 	if( !socket.username ) return
		 	delete user_ids.socket.username;
		})
	})
