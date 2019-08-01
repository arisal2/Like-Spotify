<?php 

include("includes/includedFile.php");

if(isset($_GET['id'])){
    $albumId = $_GET['id'];
}
else {
    header("Location: index.php");
}

$album = new Album($con, $albumId);
$artist = $album->getArtist();
$artistId = $artist->getId();

?>


<div class="entityInfo">
    <div class="leftSection">
        <img src="<?php echo $album->getArtworkPath(); ?>" alt="ArtworkPath">
    </div>

    <div class="rightSection">
        <h2><?php echo $album->getTitle(); ?></h2>
        <p role="link" tabindex="0" onclick="openPage('artist.php?id=<?php echo $artistId ?>')">By <?php echo $artist->getName(); ?></p>
        <p><?php echo $album->getNumberOfSongs(); ?> Songs</p>
    </div>
</div>

<div class="trackListContainer">
    <ul class="trackList">

        <?php 

            $songIdArray = $album->getSongIds();

            $i = 1;
            foreach($songIdArray as $songId){
                    
                $albumSong = new Song($con,$songId);
                $albumArtist = $albumSong->getArtist();
                
                echo "
                <li class='trackListRow'>
                    <div class='trackCount'>
                        <img class='play' src='assets/images/icons/play-white.png' onclick='setTrack(\"". $albumSong->getId() ."\", tempPlaylist, true)'>
                        <span class='trackNumber'>$i</span>
                    </div>

                    <div class='trackInfo'>
                        <span class='trackName'>" . $albumSong->getTitle() . "</span>
                        <span>" . $albumArtist->getName() . "</span>
                    </div>

                    <div class='trackOptions'>
                        <img class='optionsButton' src='assets/images/icons/more.png' onclick='showOptionsMenu(this)'>
                    </div>

                    <div class='trackDuration'>
                    <span class='trackName'>" . $albumSong->getDuration() . "</span>
                    </div>
                    
                </li>";

                $i++;
            
            }
        
        ?>

        <script>
            var tempSongIds = '<?php echo json_encode($songIdArray); ?>';
            tempPlaylist = JSON.parse(tempSongIds)
        </script>

    </ul>
</div>

<nav class="optionsMenu">
    <input type="hidden" class="songId">
    <div class="item">Add to playlist</div>
    <div class="item">item1</div>
    <div class="item">item2</div>
</nav>
