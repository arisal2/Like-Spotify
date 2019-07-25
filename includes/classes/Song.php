<?php

class Song{

    private $con;
    private $id;
    private $data;
    private $artistId;
    private $albumId;
    private $genre;
    private $duration;
    private $path;
    
    public function __construct($con, $id) {
        $this->con = $con;
        $this->id = $id;
        $query = mysqli_query($this->con, "SELECT * FROM songs where id= '$this->id'");
        $this->data = mysqli_fetch_array($query);
        $this->title = $this->data['title'];
        $this->artistId = $this->data['artist'];
        $this->albumId = $this->data['album'];
        $this->genre = $this->data['genre'];
        $this->duration = $this->data['duration'];
        $this->path = $this->data['path'];
    }

    public function getTitle()
    {
        return $this->title;
    }

    public function getArtist()
    {
        return new Artist($this->con, $this->artistId);
    }

    public function getAlbum()
    {
        return new Album($this->con, $this->artistId);
    }

    public function getGenre()
    {
        return $this->genre;
    }

    public function getDuration()
    {
        return $this->duration;
    }

    public function getPath()
    {
        return $this->path;
    }

    public function getData()
    {
        return $this->data;
    }
}
?>