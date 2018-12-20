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

	//  *--------------------- SOCKET CODES -----------------------

	var user_ids = {}

	io.sockets.on('connection', function(socket){

		socket.on('register_id', function(sent_id, callback){ // registering the IDS
			if( sent_id in user_ids ){ 						  // if sent_id exists
				callback(false);						 	  // send false in call back
			}
			else{
				socket.user_me = sent_id;
				user_ids[ socket.user_me ] = socket;
				callback(sent_id);
			}
		});


		// sending private message
		socket.on('private_message_sent', function(data, callback){

			if( data.to in user_ids ){ 	// if user_id passed is valid
				var processed_msg ={
					msg: data.msg,
					from: socket.user_me
				}
				user_ids[data.to].emit( 'private_message_from_server', processed_msg ); // send msg to the subscriber
				// io.sockets.emit('from_server', processed_msg) 			// broadcast message to every one including me
				callback(processed_msg)
			}
			else
				callback(false)
		})

	 socket.on('disconnect', function(data){
		 	if( !socket.user_me ) return
		 	delete user_ids.socket.user_me;
		})
	})
