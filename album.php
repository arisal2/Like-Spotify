<?php 

include("includes/header.php");

if(isset($_GET['id'])){
    $albumId = $_GET['id'];
}
else {
    header("Location: index.php");
}

$albumQuery = mysqli_query($con, "SELECT * FROM albums where id = '$albumId'");
$album = mysqli_fetch_array($albumQuery);

$artistId = $album['artist'];

$artistsQuery = mysqli_query($con, "SELECT * FROM artists where id= '$artistId'");
$artist = mysqli_fetch_array($artistsQuery);

echo $album['title'];
echo $artist['name'];
?>




<?php

include("includes/footer.php");


?>