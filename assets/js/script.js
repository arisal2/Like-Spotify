var currentPlaylist = []
var audioElement

function Audio() {

    this.currentlyPlaying

    this.audio = document.createElement('audio')

    this.audio.addEventListener("canplay", function() {
        $(".progressTime.remaining").text(this.duration)
    })

    this.setTrack = (track) => {
        this.currentlyPlaying = track
        this.audio.src = track.path
    }

    this.play = () => this.audio.play()

    this.pause = () => this.audio.pause()

}