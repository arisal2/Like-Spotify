var currentPlaylist = array();
var audioElement;

function Audio() {

    this.currentlyPlaying;
    this.audio = document.createElement('audio');

    this.setTrack = (src) => {
        this.audio.src = src;
    }
}