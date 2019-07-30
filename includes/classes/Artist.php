<?php

Class Artist {

    private $con;
    private $id;

    public function __construct($con, $id){
        $this->con = $con;
        $this->id = $id;
    }

    public function getId(){
        return $this->id;
    }
    public function getName(){
        $artistsQuery = mysqli_query($this->con, "SELECT name FROM artists where id= '$this->id'");
        $artist = mysqli_fetch_array($artistsQuery);
        return $artist['name'];
    }

    public function getSongIds() {
        $query = mysqli_query($this->con, "SELECT id FROM songs where artist= '$this->id' ORDER BY plays DESC");
        
        $array = array();

        while($row = mysqli_fetch_array($query)){
            array_push($array, $row['id']);
        }

        return $array;
    }
}

?>