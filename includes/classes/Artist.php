<?php

Class Artist {

    private $con;
    private $id;

    public function __construct($con, $id){
        $this->con = $con;
        $this->id = $id;
    }

    public function getName(){

        $artistsQuery = mysqli_query($this->con, "SELECT name FROM artists where id= '$this->id'");
        $artist = mysqli_fetch_array($artistsQuery);
        return $artist['name'];
    }

}

?>