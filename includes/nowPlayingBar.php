<?php 

$songQuery = mysqli_query($con, "SELECT id FROM songs ORDER BY RAND() LIMIT 10");

$resultArray = array();

while($row = mysqli_fetch_array($songQuery)){
    array_push($resultArray, $row['id']);
}

$jsonArray = json_encode($resultArray);

?>

<script>

$(document).ready(function(){
    currentPlaylist = <?php echo $jsonArray ?>;
    audioElement = new Audio()
    setTrack(currentPlaylist[0], currentPlaylist, false)
    updateVolumeProgressBar(audioElement.audio)
    
    //Progress Bar control

    $(".playbackBar .progressBar").mousedown(function(){
        mouseDown=true
    })

    $(".playbackBar .progressBar").mousemove(function(e){
        if(mouseDown){
            timeFromOffset(e, this)
        }
    })

    $(".playbackBar .progressBar").mouseup(function(e){
            timeFromOffset(e, this)
    })


    //Volume Control

    $(".volumeBar .progressBar").mousedown(function(){
        mouseDown=true
    })

    $(".volumeBar .progressBar").mousemove(function(e){
        if(mouseDown){

            let percentage = e.offsetX / $(this).width()

            if(percentage >=0 && percentage <=1) {
                audioElement.audio.volume = percentage
            }
        }
    })

    $(".volumeBar .progressBar").mouseup(function(e){

        let percentage = e.offsetX / $(this).width()
        
        if(percentage >=0 && percentage <=1) {
            audioElement.audio.volume = percentage
        }
    })

    $(document).mouseup(function(){
        mouseDown = false
    })
})

const url = {
        songUrl: "includes/handlers/ajax/getSongJson.php",
        artistUrl: "includes/handlers/ajax/getArtistJson.php",
        albumUrl: "includes/handlers/ajax/getAlbumJson.php",
        updatePlaysUrl: "includes/handlers/ajax/updatePlays.php"
    }

 timeFromOffset = (mouse, progressBar) => {
    let percentage = mouse.offsetX / $(progressBar).width() * 100
    let seconds = audioElement.audio.duration * (percentage/100)
    audioElement.setTime(seconds)
 }    

 setTrack = (trackId, newPlaylist, play) => {

    const songData = {
        songId: trackId 
    }
    
    $.post(url['songUrl'], songData, function(data) {

        let track = JSON.parse(data)

        const artistData = {
            artistId: track.artist
        }

        const albumData = {
            albumId: track.album
        }

        $(".trackName span").text(track.title)

        $.post(url['artistUrl'], artistData, function(data) { 
                let artist = JSON.parse(data)
                $(".artistName span").text(artist.name)
        })

        $.post(url['albumUrl'], albumData, function(data) {
            let album = JSON.parse(data)
            $(".albumLink img").attr("src", album.artworkPath)
        })


        audioElement.setTrack(track)
        playSong()

    })

    if(play){
        audioElement.play()
    }
}


 playSong = () => {
    if(audioElement.audio.currentTime == 0){
       $.post(url["updatePlaysUrl"],  {songId: audioElement.currentlyPlaying.id })
    }
    $(".controlButton.play").hide()
    $(".controlButton.pause").show()
    audioElement.play()
}

pauseSong = () => {
    $(".controlButton.play").show()
    $(".controlButton.pause").hide()
    audioElement.pause()
}

</script>

<div id="nowPlayingBarContainer">

    <div id="nowPlayingBar">

        <div id="nowPlayingLeft">

            <div class="content">

                <span class="albumLink">
                    <img src="" class="albumArtwork">
                </span>

                <div class="trackInfo">
                    <span class="trackName">
                        <span></span>
                    </span>
                    <span class="artistName">
                        <span></span>
                    </span>
                </div>

            </div>

        </div>

        <div id="nowPlayingCenter">

            <div class="content playerControls">

                <div class="buttons">

                    <button class="controlButton shuffle" title="Shuffle button">
                        <img src="<?php echo $path ?>shuffle.png" alt="Shuffle">
                    </button>

                    <button class="controlButton previous" title="Previous button">
                        <img src="<?php echo $path ?>previous.png" alt="Previous">
                    </button>

                    <button class="controlButton play" title="Play button" onclick="playSong()">
                        <img src="<?php echo $path ?>play.png" alt="Play">
                    </button>

                    <button class="controlButton pause" title="Pause button" style="display: none;" onclick="pauseSong()">
                        <img src="<?php echo $path ?>pause.png" alt="Pause">
                    </button>

                    <button class="controlButton next" title="Next button">
                        <img src="<?php echo $path ?>next.png" alt="Next">
                    </button>

                    <button class="controlButton repeat" title="Repeat button">
                        <img src="<?php echo $path ?>repeat.png" alt="Repeat">
                    </button>

                </div>

                <div class="playbackBar">

                    <span class="progressTime current">0.00</span>

                    <div class="progressBar">

                        <div class="progressBarBg">

                            <div class="progress">

                            </div>

                        </div>

                    </div>

                    <span class="progressTime remaining">0.00</span>
                    
                </div>

            </div>

        </div>

        <div id="nowPlayingRight">

            <div class="volumeBar">
                
                <button class="controlButton volume" title="Volume button">
                    <img src="<?php echo $path ?>volume.png" alt="">
                </button>

                <div class="ProgressBar">

                    <div class="progressBarBg">

                            <div class="progress">

                            </div>
                    </div>

                </div>

            </div>

        </div>

    </div>

</div>