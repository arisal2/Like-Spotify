<?php
    ob_start();

    $timezone = date_default_timezone_set("Asia/Kathmandu");

    $con = mysqli_connect("localhost","root","password","clonify");

    if(mysqli_connect_errno()){
        echo "Failed to connect: " . mysqli_connect_errno();
    }
?>