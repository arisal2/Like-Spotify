let currentPlaylist = []
let audioElement

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
    $(".progress").css("width", progress + "%")
}

function Audio() {

    this.currentlyPlaying

    this.audio = document.createElement('audio')

    this.play = () => this.audio.play()

    this.pause = () => this.audio.pause()


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

}