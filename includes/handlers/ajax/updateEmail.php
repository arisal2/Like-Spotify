<?php

include("../../config.php");

if(!isset($_POST['username'])) {

    echo "ERROR: Could not set username";
    exit();

}

if(isset($_POST['emailValue']) && $_POST['emailValue'] != "") {
    
    if(!filter_var($_POST['emailValue'],FILTER_VALIDATE_EMAIL)) {

        echo "Email is invalid";
        exit();

    }

    $email = $_POST['emailValue'];
    $username = $_POST['username'];

    $emailCheck = mysqli_query($con, "SELECT email FROM users WHERE email='$email' AND username='$username'");

    if(mysqli_num_rows($emailCheck) > 0) {
        echo "Email is already in use";
        exit();
    }

    $updateQuery = mysqli_query($con, "UPDATE users SET email = '$email' WHERE username='$username'");
    echo "Update Successful!";

} else {
    echo "You must provide an email";
}

?>