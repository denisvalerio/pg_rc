
var express = require('express');
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');


var client_id = '2d56e22bf1ed4d0c96ec616cc6ed5bba'; // Your client id
var client_secret = '6dd3ecabd9f944fdb446ce03a9bc0a62'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri



var stateKey = 'spotify_auth_state';
var a_t='';
var app = express();
var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.set('view engine','ejs');

app.get('/',function (req,res) {
  res.render('index');
});

app.get('/login', function(req, res) {

  var state = 'ciao';
  res.cookie(stateKey, state);

  // Autenticazione oauth spotify
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


app.get('/callback', function(req, res){
  var code=req.query.code;
  var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    // verifico se ho preso token dal code e in caso di successo salvo in a_t
    // a_t mi servirà per le chiamate REST alle API
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;
        a_t=access_token;
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // STAMPA info utente registrato
        request.get(options, function(error, response, body) {
            console.log(body);
        });
        //rindirizzo pagina "ricerca"
          res.render('index3');
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });


});
app.post('/richiesta',function(req,res){
  // prendo il valore che scrivo nella casella di testo, e lo converto in stringa
  var info =JSON.stringify(req.body.traccia);
  res.redirect('http://localhost:8888/api?traccia='+info);
});

//richista API seach spotify, type=track
app.get('/api',function(req,res){
  var track=req.query.traccia;
  var options={
    url: 'https://api.spotify.com/v1/search?q='+track+'&type=track&limit=15',
    method: 'GET',
    headers:{
      'Authorization': 'Bearer '+a_t
    }
  };
  request(options,function(error,response,body){
    //prendo file json che ricevo dalla chiamata rest API
    var infojson=JSON.parse(body);
    if(infojson==undefined){
      res.render('index3');
    }
    var array_tracks=infojson.tracks.items;
    var data=ListaTracks(array_tracks);
    res.render('index2',{data: data});
  })
});

//funzione per prendere le traccie
function ListaTracks(songItems) {
  var list_track =[] ;
  for (var i = 0; i < songItems.length; ++i) {
    var tmp = songItems[i];

    list_track[i]={
      nomeCanzone: tmp.name,
      album: tmp.album.name,
      immagine:tmp.album.images[1],
      artista: tmp.artists[0].name,
      preview: tmp.preview_url,
      linkSpotify: tmp.external_urls.spotify
    }

  }
  return list_track;
}

//ricerca concerti in cui uso una post per prendermi l'artista

app.get('/concerti',function(req,res){
  var art=req.query.q;
  console.log(art);
  var options={
    url: "https://api.songkick.com/api/3.0/events.json?apikey=fp5PvandNOdyHRJd&artist_name="+art,
  };
  request(options,function(error,response,body){
    var infojson2=JSON.parse(body);
    
    if(infojson2.resultsPage.results.event==undefined){

    }
    else{
      var array_concerti=infojson2.resultsPage.results.event;
      var concerti=ListaConcerti(array_concerti);
      res.render('concerti',{evento:concerti});
    }
  })
});

function ListaConcerti(concertItems){
  var list_concert=[];
  for (var i=0; i <concertItems.length; ++i){
    var tmp=concertItems[i];

    list_concert[i]={
      tipoEvento: tmp.type,
      luogo: tmp.location.city,
      data: tmp.start.date,
      //orario: tmp.start.time,
      nomePosto: tmp.displayName
    }
    console.log(list_concert[i]);

  }
  return list_concert;
}

console.log('Listening on 8888');
app.listen(8888);
