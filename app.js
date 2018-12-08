/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
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

  // your application requests authorization
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

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there

          res.render('index3.ejs');
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });


});
app.post('/richiesta',function(req,res){
  console.log(a_t);

  var info =JSON.stringify(req.body.traccia);
  //console.log(info);
  console.log("Ricevuto richiesta");
  res.redirect('http://localhost:8888/api?token='+a_t+'&traccia='+info);
});

app.get('/api',function(req,res){
  var track=req.query.traccia;
  var token=req.query.token;

  var options={
    url: 'https://api.spotify.com/v1/search?q='+track+'&type=track&limit=15',
    method: 'GET',
    headers:{
      'Authorization': 'Bearer '+a_t
    }

  };
  request(options,function(error,response,body){
    var traccia=JSON.parse(body);
    console.log(traccia);
    if(traccia==undefined){
      res.render('/index3.ejs');
    }
    var array_track=traccia.tracks.items;
    var array_
    var data=ListaTracks(array_track);

    res.render('index2',{data: data});



  })
});
function ListaTracks(songItems) {
  var list_track =[] ;
  for (var i = 0; i < songItems.length; ++i) {
    var cur = songItems[i];

    list_track[i]={
      nomeCanzone: cur.name,
      album: cur.album.name,
      immagine:cur.album.images[1],
      artista: cur.artists[0].name,
      preview: cur.preview_url,
      linkSpotify: cur.external_urls.spotify
    }
    console.log(list_track[i]);


  }
  return list_track;
}
/*
app.get('/callback', function(req, res) {
var code = req.query.code || null;
spotify.search({ type: 'track', query: 'All the Small Things' })
.then(function(response) {
  console.log(response);
  res.sendFile(__dirname + '/index3.html');
})
.catch(function(err) {
  console.log(err);
});

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
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

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});
*/
console.log('Listening on 8888');
app.listen(8888);
