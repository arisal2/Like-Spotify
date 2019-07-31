<?php

include("includes/includedFile.php")

?>


<div class="playListContanier">
    
    <div class="gridViewContainer">

    <h2>PLAYLISTS</h2>
    
    <div class="buttonItems">
        
        <button class="button green" onclick="createPlaylist()">NEW PLAYLISTS</button>
    
    </div>

    <?php
        $username = $userLoggedIn->getUsername();
    
        $playlistQuery = mysqli_query($con, "SELECT * FROM playlists WHERE owner ='$username'");

        if(mysqli_num_rows($playlistQuery) == 0){
            echo "<span class='noResult'> No playlists found matching ". $username. "</span>";
        }

        while($row = mysqli_fetch_array($playlistQuery)) {

            $playlist = new Playlist($con, $row);
           
            echo "<div role='link' tabindex='0' onclick='openPage(\"playlist.php?id=".$playlist->getId()."\")' class='gridViewItem'>

                <div class='playListImage'>
                    <img src='assets/images/icons/playlist.png'>
                </div>

                <div class='gridViewInfo'>
                        
                ". $playlist->getName() . "

                </div>
            </div>";
        }
    ?> 

    </div>

</div>


