var audioObject = null;
var onAirClass = "onAir";
var songListClass = "songList";
var searchTerm = null;
var curOffset = 0;
var limitPerPage = 10;
var hasNext = false;
var hasPrev = false;
var hasAdvancedSearch = false;

$(document).ready(function(){
  var $search = $("#search-form");
  var $song = $search.find("#query");
  var $artist = $search.find("#artist-query");
  var $album = $search.find("#album-query");
  var $genre = $search.find("#genre-query");
  var $year = $search.find("#year-query");
  $search.submit(function(e) {
    curOffset = 0;
    hasNext = false;
    e.preventDefault();
    searchTerm = '"' + $song.val() + '"';
    if (hasAdvancedSearch) {
      if ($album.val().length > 0) {
        searchTerm += ' album:"' + $album.val() + '"';
      }
      if ($artist.val().length > 0) {
        searchTerm += ' artist:"' + $artist.val() + '"';
      }
      if ($genre.val().length > 0) {
        searchTerm += ' genre:"' + $genre.val() + '"';
      }
      if ($year.val().length > 0) {
        if (!isNaN($year.val())) {
          searchTerm += ' year:' + $year.val();
        } else {
          alert("invalid year, ignored this field.");
        }
      }
    }
    console.log(searchTerm);
    searchTrack(searchTerm);
  });
  $("#nextPage").click(function(){
    curOffset += limitPerPage;
    console.log("next offset" + curOffset);
    searchTrack(searchTerm);
  });
  $("#prevPage").click(function(){
    curOffset -= limitPerPage;
    console.log("prev offset" + curOffset);
    searchTrack(searchTerm);
  });
  $("#advanced-button").click(function(){
    if (hasAdvancedSearch) {
      $("#advanced-form").slideUp();
    } else {
      $("#advanced-form").slideDown();
    }
    hasAdvancedSearch = !hasAdvancedSearch;
  });
});

var searchTrack = function(query) {
  if (audioObject != null) {
    audioObject.pause();
  }
  $.ajax({
    url: 'https://api.spotify.com/v1/search',
    data: {
      q: query,
      type: 'track',
      limit: limitPerPage,
      offset: curOffset
    },
    success: function (response) {
      hasNext = (curOffset + limitPerPage) < response.tracks.total;
      hasPrev = (curOffset - limitPerPage) >= 0;
      handleTrackResponse(response);
    }
  });
};

var handleTrackResponse = function(response) {
  console.log(response);
  var $results = $("#results");
  $results.html(layoutSongList(response.tracks.items));
  $("." + songListClass).click(playSong);
  if (hasNext) {
    $("#nextPage").show();
  } else {
    $("#nextPage").hide();
  }
  if (hasPrev) {
    $("#prevPage").show();
  } else {
    $("#prevPage").hide();
  }
}

// Input is the song items, and output is layed out html source
var layoutSongList = function(songItems) {
  var htmlText = "";
  for (var i = 0; i < songItems.length; ++i) {
    var cur = songItems[i];
    //console.log(cur);
    var songName = cur.name;
    var artistName = "Unkonwn";
    if (cur.artists.length > 0) {
      artistName = cur.artists[0].name;
    }
    var imgUrl = "http://dudespaper.com/wp-content/uploads/2008/12/lebowskirecordalbum1.jpg";
    if (cur.album.images.length > 0) {
      imgUrl = cur.album.images[0].url;
    }
    var preview = cur.preview_url;
    htmlText += '<div class="col-lg-4 col-sm-6 text-center cover songList" data-preview="' + preview + '"><img id="cover-img" class="img-circle img-responsive img-center" src="'+ imgUrl +'" alt=""><h4>'+ songName +'<small><br>'+ artistName +'</small></h4></div>';
  }
  return htmlText;
}

var playSong = function() {
  if (audioObject != null) {
    audioObject.pause();
  }
  if ($(this).find("#cover-img").hasClass(onAirClass)) {
    $(this).find("#cover-img").removeClass(onAirClass);
    return;
  }
  $(this).parent().find("." + onAirClass).removeClass(onAirClass);
  var previewUrl = $(this).attr("data-preview");
  audioObject = new Audio(previewUrl);
  audioObject.play();
  $(this).find("#cover-img").addClass(onAirClass);
}
