var currentPlaylist = [];
var audioElement;

function Audio() {

    this.currentlyPlaying;
    this.audio = document.createElement('audio');

    this.setTrack = (src) => {
        this.audio.src = src;
    }

    this.play = () => {
        this.audio.play();
    }
}