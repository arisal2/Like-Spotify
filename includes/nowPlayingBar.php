<div id="nowPlayingBarContainer">

    <div id="nowPlayingBar">

        <div id="nowPlayingLeft">

            <div class="content">

                <span class="albumLink">
                    <img src="http://clipart-library.com/img/2008830.jpg" class="albumArtwork">
                </span>

                <div class="trackInfo">
                    <span class="trackName">
                        <span>Schism</span>
                    </span>
                    <span class="artistName">
                        <span>Tool</span>
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

                    <button class="controlButton play" title="Play button">
                        <img src="<?php echo $path ?>play.png" alt="Play">
                    </button>

                    <button class="controlButton pause" title="Pause button" style="display: none;">
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