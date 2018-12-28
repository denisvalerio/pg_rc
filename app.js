
var express = require('express');
var request = require('request');
var cors = require('cors');
var querystring = require('querystring');



var client_id = '2d56e22bf1ed4d0c96ec616cc6ed5bba'; // Your client id
var client_secret = '6dd3ecabd9f944fdb446ce03a9bc0a62'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var apikey='fp5PvandNOdyHRJd';

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: 'pk.eyJ1Ijoic3ZldmFzIiwiYSI6ImNqcTZiZG01bTI2a2k0OGxjOWR6bjZlYmEifQ.cv6fWAD7oKn96CJmbJKnhw' });



var concerts=[];
var nome_artista='';
var nickname='';
var a_t='';
var app = express();
var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));


//utilizzo file .ejs e li metto nella cartella /views
app.set('view engine','ejs');


//rindirizamento alla pagina iniziale
app.get('/',function (req,res) {
  res.render('index');
});

app.get('/login', function(req, res) {



  // Autenticazione oauth spotify
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
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
          headers: { 'Authorization': 'Bearer ' + access_token }

        };

        // STAMPA info utente registrato
        request.get(options, function(error, response, body) {
            console.log(body);
            var me=JSON.parse(body);
            //console.log(me);
            nickname=me.display_name;


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
    console.log(infojson);
    if(infojson=="undefined"){
      res.render('404traccia');
    }
    if(infojson.tracks.items==""){
      res.render('404traccia');
    }
    var array_tracks=infojson.tracks.items;
    var data=ListaTracks(array_tracks);
    res.render('index2',{data: data});
  })
});

// Funzione per prendere le traccie
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

// Ricerca concerti in cui uso una post per prendermi l'artista

app.get('/concerti',function(req,res){
  var art=req.query.q;
  nome_artista=art

  // Chiamata REST API songkick per info eventi (concerti)
  var options={
    url: "https://api.songkick.com/api/3.0/events.json?apikey="+apikey+"&artist_name="+art,
  };
  request(options,function(error,response,body){
    var infojson2=JSON.parse(body);

    // Non ci sono attualmente concerti per quell'artista
    if(infojson2.resultsPage.results.event==undefined){
      res.render('404canzoni')
    }
    else{
      var array_concerti=infojson2.resultsPage.results.event;
      var concerti=ListaConcerti(array_concerti);
      concerts=concerti;

      // Rindirizzo a concerti.ejs dove passo la lista dei concerti
      // artista, e il nickname dell'utente loggato tramite spotify
      res.render('concerti',{evento:concerts,name:nickname,artista:nome_artista});
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
      posto: tmp.venue.displayName
    }


  }
  return list_concert;
}

app.get('/mappe',function (req,res) {
  var place=req.query.q;
  var nome_luogo=req.query.e;
  var data_evento=req.query.d;
  var nome_artista=req.query.a;
  var stato_nazione=req.query.n;
  var info_concerto={
    data: data_evento,
    luogo: nome_luogo,
    artista: nome_artista,
    stato: stato_nazione
  }
  geocodingClient.forwardGeocode({
    query: place,
    limit: 1
  }).send().then(response => {
    const match = response.body;
    var coordinate=PrendiCoordinate(match.features[0].center);
    res.render('mappe',{evento_concerto:info_concerto,maps:coordinate});
  });
})

function PrendiCoordinate(mappe){
  var latelong={
    lat:mappe[0],
    long:mappe[1]
  }
  return latelong;
}
console.log('Listening on 8888');
app.listen(8888);
