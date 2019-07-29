let currentPlaylist = []
let shufflePlaylist = []
let tempPlaylist = []
let audioElement
let mouseDown = false
let currentIndex = 0
let repeat = false
let shuffle = false

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