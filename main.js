/**
 * This is the JS to implement a lyric generator based off a user's input artist name.
 * This is script also uses musixmatch's API methods through a redirct route from CSE154's
 * webservice.
 */
(function() {
  "use strict";

  const BASE_URL = "https://api.musixmatch.com/ws/1.1/";
  const API_KEY = "apikey=709d0bcfcfb0f47459664e7b5a0cd2d1";
  const REDIRECT_URL =
            "https://courses.cs.washington.edu/courses/cse154/webservices/redirect.php?apiurl=";
  let artistId;
  let albumId;
  let trackId;
  let lyric = "";
  let trackName = "";
  let artistName = "";
  let tracking;

  window.addEventListener("load", initialize);

  /** Initializes the page's button */
  function initialize() {
    let generateBtn = qs("button");
    generateBtn.addEventListener("click", artistSearch);
  }

  /**
   * Returns a random number between 0 and max exclusive
   * @param {Integer} max - max number to be generated
   * @returns {Integer} random number
   */
  function randomize(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Parses the user's input an artist name to get the musixmatch ID for said artist, will
   * pick the first result. Then request an album from the artist based off the id. Then a track
   * off that album will be picked and its lyrics will be requested as well.
   */
  function artistSearch() {
    let userInput = id("artist-query").value;
    if (userInput.includes(" ")) {
      userInput = userInput.replace(" ", "_");
    }
    let apiURL = BASE_URL + "artist.search?q_artist=" + userInput + "&page_size=1&" + API_KEY;
    apiURL = encodeURIComponent(apiURL);
    apiURL = fetchURL(apiURL);

    fetch(apiURL)
      .then(checkStatus)
      .then(parseText)
      .then(function(response) {
        artistId = response["message"]["body"]['artist_list'][0]["artist"]["artist_id"];
      })
      .then(albumSearch)
      .then(trackSearch)
      .then(snippetSearch)
      .then(displayResults)
      .catch(errorReport);
  }

  /**
    * Searchs for the artist's albums given their id and picks a random one
    * @returns {string} response from fetch request, albumId
    */
  function albumSearch() {
    let apiURL = BASE_URL + "artist.albums.get?artist_id=" + artistId + "&page_size=5&" + API_KEY;
    apiURL = encodeURIComponent(apiURL);
    apiURL = fetchURL(apiURL);

    return fetch(apiURL)
      .then(checkStatus)
      .then(parseText)
      .then(function(response) {
        let albumsAvailable = response["message"]['body']["album_list"].length;
        let randAlbumIndex = randomize(albumsAvailable);
        albumId = response["message"]['body']["album_list"][randAlbumIndex]["album"]['album_id'];
      })
      .catch(errorReport);
  }

  /**
    * Searchs for the album's tracks given their id and picks a random one
    * @returns {string} response from fetch request, trackId
    */
  function trackSearch() {
    let apiURL = BASE_URL + "album.tracks.get?album_id="
                 + albumId +"&page_size=5&f_has_lyrics&" + API_KEY;
    apiURL = encodeURIComponent(apiURL);
    apiURL = fetchURL(apiURL);

    return fetch(apiURL)
      .then(checkStatus)
      .then(parseText)
      .then(function(response) {
        let tracksAvailable = response['message']['body']['track_list'].length;
        let trackIndex = randomize(tracksAvailable);
        trackId = response['message']['body']['track_list'][trackIndex]['track']['track_id'];
        trackName = response['message']['body']['track_list'][trackIndex]['track']['track_name'];
        artistName = response['message']['body']['track_list'][trackIndex]['track']['artist_name'];
      })
      .catch(errorReport);
  }

  /**
    * Searchs for a track's snippet of lyrics  given their id
    * @returns {string} response from fetch request, lyric snippet
    */
  function snippetSearch() {
    let apiURL = BASE_URL + "track.snippet.get?track_id=" + trackId + "&" + API_KEY;
    apiURL = encodeURIComponent(apiURL);
    apiURL = fetchURL(apiURL);

    return fetch(apiURL)
      .then(checkStatus)
      .then(parseText)
      .then(function(response) {
        lyric = response['message']['body']['snippet']['snippet_body'];
        tracking = response['message']['body']['snippet']['pixel_tracking_url'];
      })
      .catch(errorReport);
  }

  /**
   * Returns the complete URL for the fetch request
   * @param {string} apiURL - formatted url for musixmatch API
   * @returns {string} URL that can be used for a fetch request
   */
  function fetchURL(apiURL) {
    return REDIRECT_URL + apiURL;
  }

  /** Displays the artist information and generated lyrics. */
  function displayResults() {
    if (lyric === "") {
      lyric = "Couldn't find any lyrics from this track"
    }
    id("lyric").innerText = lyric;
    id("song-name").innerText = trackName;
    id("artist-name").innerText = artistName;
    qs("blockquote").classList.remove("hidden");
    qs("#quote").classList.remove("hidden");
    id("tracking").src = tracking;
    let error = id("error");
    error.innerText = "";
  }

  /**
   * Displays an error for the user and rejects the promised request
   * @param {string} response - response from the failed request
   * @returns {Error} returns an error
   */
  function errorReport(response) {
    id("lyric").innerText =
                  "Something went wrong. Please try a different artist or check your connection.";
    id("song-name").innerText = "";
    id("artist-name").innerText = "";
    let error = id("error");
    error.innerText = "Generation failed, please try again";
    return Promise.reject(new Error("Report:" + response));
  }

  /**
   * Checks whether a given response is valid, if it is returns the reponse's text or
   * throws an error and rejects the current promise.
   * @param {string} response - response
   * @returns {string} response from text or reject promise
   */
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }

  /**
   * Returns the parsed JSON text of the given text
   * @param {string} responseText - text from the response
   * @returns {string} JSON parsed text
   */
  function parseText(responseText) {
    let text = responseText;
    text = JSON.parse(text);
    return text;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }
})();
