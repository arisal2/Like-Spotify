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

const routes = {
    songUrl: "includes/handlers/ajax/getSongJson.php",
    artistUrl: "includes/handlers/ajax/getArtistJson.php",
    albumUrl: "includes/handlers/ajax/getAlbumJson.php",
    updatePlaysUrl: "includes/handlers/ajax/updatePlays.php",
    createPlaylist: "includes/handlers/ajax/createPlaylist.php",
    deletePlaylist: "includes/handlers/ajax/deletePlaylist.php",
    addToPlaylist: "includes/handlers/ajax/addToPlaylist.php",
    removeFromPlaylist: "includes/handlers/ajax/removeFromPlaylist.php",
    logout: "includes/handlers/ajax/logout.php",
    updateEmail: "includes/handlers/ajax/updateEmail.php",
    updatePassword: "includes/handlers/ajax/updatePassword.php"
}

$(document).click(function(click) {
    let target = $(click.target)
    if (!target.hasClass("item") && !target.hasClass("optionsButton")) {
        hideOptions()
    }
})

$(window).scroll(function() {
    hideOptions()
})

$(document).on("change", "select.playlist", function() {

    let select = $(this)
    let playlistId = select.val()
    let songId = select.prev(".songId").val()

    let addToPlaylistData = {
        songId: songId,
        playlistId: playlistId
    }

    $.post(routes['addToPlaylist'], addToPlaylistData).done(function(error) {

        error = error.replace(/\n/ig, '')
        if (error != '') {
            alert(error)
            return
        }

        hideOptions()
        select.val("")

    })
})

openPage = (url) => {

    if (url.indexOf("?") == -1) {
        url = url + "?"
    }

    let encodedUrl = encodeURI(url + "&userLoggedIn=" + userLoggedIn)
    $("#mainContent").load(encodedUrl)
    $("body").scrollTop(0)
    history.pushState(null, null, url)
}

updateEmail = (emailClass) => {

    let emailValue = $("." + emailClass).val()

    let emailData = {
        emailValue: emailValue,
        username: userLoggedIn
    }

    $.post(routes['updateEmail'], emailData).done(function(response) {
        $("." + emailClass).nextAll(".message").text(response)
    })

}

updatePassword = (oldPasswordClass, newPasswordClass1, newPasswordClass2) => {

    let oldPassword = $("." + oldPasswordClass).val()
    let newPassword1 = $("." + newPasswordClass1).val()
    let newPassword2 = $("." + newPasswordClass2).val()

    let passwordData = {
        oldPassword: oldPassword,
        newPassword1: newPassword1,
        newPassword2: newPassword2,
        username: userLoggedIn
    }

    $.post(routes['updatePassword'], passwordData).done(function(response) {
        $("." + oldPasswordClass).nextAll(".message").text(response)
    })

}

logout = () => {
    $.post(routes['logout'], function() {
        location.reload()
    })
}

removeFromPlaylist = (button, playlistId) => {

    let songId = $(button).prevAll(".songId").val()

    let removeFromPlaylistData = {
        songId: songId,
        playlistId: playlistId
    }

    $.post(routes['removeFromPlaylist'], removeFromPlaylistData)
        .done(function(error) {
            error = error.replace(/\n/ig, '')
            if (error != "") {
                alert(error)
                return
            }
            openPage("playlist.php?id=" + playlistId)
        })

}

createPlaylist = () => {

    let popup = prompt("Please enter the name of your playlist")

    let playlistData = { name: popup, username: userLoggedIn }

    if (popup != null) {

        $.post(routes['createPlaylist'], playlistData)
            .done(function(error) {
                error = error.replace(/\n/ig, '')
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

        $.post(routes['deletePlaylist'], deleteData)
            .done(function(error) {
                error = error.replace(/\n/ig, '')
                if (error != "") {
                    alert(error)
                    return
                }
                openPage("yourMusic.php")
            })

    }
}

hideOptions = () => {
    let menu = $(".optionsMenu")
    if (menu.css("display") != "none") {
        menu.css("display", "none")
    }
}

showOptionsMenu = (button) => {

    let songId = $(button).prevAll(".songId").val()

    let menu = $(".optionsMenu")
    let menuWidth = menu.width()
    menu.find(".songId").val(songId)
    let left = $(button).position().left

    let scrollTop = $(window).scrollTop() //Distance from top of window to top of document
    let elementOffset = $(button).offset().top //Distance from top of document
    let top = elementOffset - scrollTop

    menu.css({ "top": top + "px", "left": left - menuWidth + "px", "display": "inline" })

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