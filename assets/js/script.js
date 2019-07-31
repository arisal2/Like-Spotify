var currentPlaylist = []
var shufflePlaylist = []
var tempPlaylist = []
var audioElement
var mouseDown = false
var currentIndex = 0
var repeat = false
var shuffle = false
var userLoggedIn
var timer

const localUrl = {
    songUrl: "includes/handlers/ajax/getSongJson.php",
    artistUrl: "includes/handlers/ajax/getArtistJson.php",
    albumUrl: "includes/handlers/ajax/getAlbumJson.php",
    updatePlaysUrl: "includes/handlers/ajax/updatePlays.php",
    createPlaylist: "includes/handlers/ajax/createPlaylist.php",
    deletePlaylist: "includes/handlers/ajax/deletePlaylist.php",
}

openPage = (url) => {

    if (url.indexOf("?") == -1) {
        url = url + "?"
    }

    let encodedUrl = encodeURI(url + "&userLoggedIn=" + userLoggedIn)
    $("#mainContent").load(encodedUrl)
    $("body").scrollTop(0)
    history.pushState(null, null, url)
}

createPlaylist = () => {

    let popup = prompt("Please enter the name of your playlist")

    let playlistData = { name: popup, username: userLoggedIn }

    if (popup != null) {

        $.post(localUrl['createPlaylist'], playlistData)
            .done(function(error) {
                if (error != "") {
                    alert(error)
                    return
                }
                openPage("yourMusic.php")
            })
    }
}

deletePlaylist = (playlistId) => {

    let prompt = confirm("Are you sure you want to delete the playlist?")

    let deleteData = { playlistId: playlistId }

    if (prompt) {

        $.post(localUrl['deletePlaylist'], deleteData)
            .done(function(error) {
                if (error != "") {
                    alert(error)
                    return
                }
                openPage("yourMusic.php")
            })
    }
}

formatTime = (second) => {

    let time = Math.round(second)
    let minutes = Math.floor(time / 60)
    let seconds = time - (minutes * 60)

    let extraZero = (seconds < 10) ? "0" : ""

    return minutes + ":" + extraZero + seconds
}

updateTimeProgressBar = (audio) => {

    $(".progressTime.current").text(formatTime(audio.currentTime))
    $(".progressTime.remaining").text(formatTime(audio.duration - audio.currentTime))

    let progress = audio.currentTime / audio.duration * 100
    $(".playbackBar .progress").css("width", progress + "%")

}

updateVolumeProgressBar = (audio) => {

    let volume = audio.volume * 100
    $(".volumeBar .progress").css("width", volume + "%")

}

playFirstSong = () => setTrack(tempPlaylist[0], tempPlaylist, true)

function Audio() {

    this.currentlyPlaying

    this.audio = document.createElement('audio')

    this.play = () => this.audio.play()

    this.pause = () => this.audio.pause()

    this.setTime = (seconds) => this.audio.currentTime = seconds

    this.setTrack = (track) => {
        this.currentlyPlaying = track
        this.audio.src = track.path
    }

    this.audio.addEventListener("timeupdate", function() {
        if (this.duration) {
            updateTimeProgressBar(this)
        }
    })

    this.audio.addEventListener("canplay", function() {

        let duration = formatTime(this.duration)
        $(".progressTime.remaining").text(duration)

    })

    this.audio.addEventListener("volumechange", function() {
        updateVolumeProgressBar(this)
    })

    this.audio.addEventListener("ended", function() {
        nextSong()
    })

}