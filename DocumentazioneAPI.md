# Progetto Reti di Calcolatori - Share the music

## Documentazione API

**Spotify**: Quando un utente accede all'applicazione, viene ridirezionato sulla pagina di login di Spotify per consentire l'accesso da parte dell'applicazione ai dati relativi all'utente.

https://accounts.spotify.com/authorize' + '?response_type=code' +'&client_id=' + my_client_id  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri='+ encodeURIComponent(redirect_uri)

response_type consiste nel authorization grant, client_id è il codice univoco dell'applicazione data da Spotify, scope consente all'applicazione di accedere a endpoint API specifici per conto di un utente, redirect_uri è il sito a cui viene ridirezionato l'utente dopo aver accettato o rifiutato.

Ora l'applicazione verifica che l'utente abbia effettuato l'accesso e solo dopo invia il codice ricevuto (Authorization Grant) per un token d'accesso.

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

client_id è il codice univoco dell'applicazione data da Spotify nel momento in cui tu hai registrato la tua applicazione, redirect-uri è il sito a cui viene ridirezionato l'utente dopo aver accettato o rifiutato l'accesso ( lo stesso ), client_secret è una chiave segreta dell'applicazione data da Spotify ,code è il codice restituito dall'endpoint precedente

La risposta è in formato JSON e contiene il token di accesso alle API di Spotify per accedere alle informazioni dell'utente connesso. Il token di accesso viene memorizzato lato server nella sessione del browser.

Uso le API di Spotify per avere informazione sull'utente loggato

var options = {
          url: 'https://api.spotify.com/v1/me',
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + a_t}
        };

a_t è la varibile in cui è stato memorizzato l'access Token ricevuto in precendenza.

La risposta è in formato JSON e contiene le informazione sul profilo dell'utente (documentazione del file: https://developer.spotify.com/documentation/web-api/reference/users-profile/get-current-users-profile/), noi prenderemo il nickname (displayName) dell'utente che verrà utilizzato nelle chat pubblica e privata per identificare quell'utente.

Ora l'utente si trova davanti ad una barra di ricerca, che utilizza per cercare le varie canzoni. Ogni volta che viene cercata una determinata canzone viene fatta una chiamata REST di tipo POST, http://localhost:8888/ricerca , in modo tale da portermi prendere quella determinata canzone inserita. Ottenuta la stringa, vado ad effettuare una chiamata REST di tipo GET alle API di Spotify (Search for an Item) passando la stringa(traccia) appena ricevuta, http://localhost:8888/api?traccia='+info.
	
  var track=req.query.traccia;
  
  var options={
    url: 'https://api.spotify.com/v1/search?q='+track+'&type=track&limit=15',
    method: 'GET',
    headers:{
      'Authorization': 'Bearer '+a_t
    }
  };

track è la traccia che viene presa dalla barra di ricerca ogni volta che un utente ricerca una canzone, type indica il tipo di item che deve considerare, che in questo caso track perchè stiamo considerando la traccia, limit indica il limite di tracce che vorremo che ci vengano restituite dal file json.

La risposta sarà in formato JSON e contiene le informazione sulla traccia cercata dall'utente (documentazione del file: https://developer.spotify.com/documentation/web-api/reference/search/search/), noi prenderemo il nome della canzone, nome dell'album, immagine dell'album, artista, la preview di Spotify e il link della canzone di Spotify, che mostreremo nel file risultato.ejs

Ora l'utente potra ricercare anche i concerti relativi all'artista di quella canzone se esistono. Abbiamo utilizzato le API di Songkick per poter prendere i concerti di un artista, il quale ci ha fornino un Apikey ottenuta tramite la registrazione sul sito.

**Songkick:** Nel momento in cui l'utente clicca sul bottone "cerca concerti" verrà indirizzato a http://localhost:8888/concerti?q=<%= lista.artista %>, dove lista.artista consiste nel nome dell'artista. 

var art=req.query.q;

  nome_artista=art;
  var options={
    url: "https://api.songkick.com/api/3.0/events.json?apikey="+apikey+"&artist_name="+nome_artista
  };

apikey chiave fornita da Songkick per poter richiedere una determinata risorsa a Songkick, artist_name nome dell'artista di cui voglio sapere se vi sono concerti.

La risposta sarà in formato JSON e contiene le informazione sui concerti di quell'artista (documentazione del file: https://www.songkick.com/developer/event-search), noi prenderemo la città dove si svolgerà il concerto, la data e il luogo (stadio) dove avverrà, che mostreremo in concerti.ejs

**Mapbox:** Inoltre ci siamo serviti delle API di mapbox per ottenere le coordinate dello stadio, in cui suonerà l'artista, per creare una mappa dove verrà mostrato il luogo, contrassegnato da un icon. 
http://localhost:8888/mappe?q=<%= lista_eventi.posto%>&d=<%= lista_eventi.data %>&a=<%= artista%>&n=<%= lista_eventi.luogo %>
dove lista_eventi.posto è lo stadio di cui si vuole avere le coordinate, lista_eventi.data,artista,lista_eventi.luogo sono le informazioni che compariranno cliccando sull'icon nella mappa.

var place=req.query.q;

geocodingClient.forwardGeocode({
    query: place,
    limit: 1
  }).send().then(response => {
    const match = response.body;
    var coordinate=PrendiCoordinate(match.features[0].center);
    res.render('mappe',{evento_concerto:info_concerto,maps:coordinate,token:token_mappe});
  }); 

place si riferisce allo stadio, geocodingClient.forwardGeocode utilizzato per la geolocalizzazione di un posto preciso, limit sono i risultati che voglio che mi ritornino nel file JSON, PrendiCoordinate(match.features[0].center) funzione che utilizzo per prenderemi le coordinate del luogo dal file JSON,res.render('mappe',{evento_concerto:info_concerto,maps:coordinate,token:token_mappe})
rindirizzo al file mappe.ejs dove vado a passargli le coordinate, il token per la creazione della mappa che mi è stato fornito da mapbox al momento della registrazione e le info_concerto che sono le informazioni mostrate prima che mi serviranno per creare icona sulla mappa.

La risposta sarà in formato JSON e contiene le informazione sul quel posto "place" (documentazione del file: https://www.mapbox.com/api-documentation/?language=JavaScript#endpoints), prenderemo le coordinate relative al quel posto che ci serviranno per la creazione della mappa.




