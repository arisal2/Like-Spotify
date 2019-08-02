
<?php 

include("includes/includedFile.php");

?>

<div class="entityInfo">
    <div class="centerSection">
        <div class="userInfo">
            <h1><?php echo $userLoggedIn->getFirstAndLastName(); ?></h1>
        </div>
    </div>

    <div class="buttonItems">
        <button class="button">USER DETAILS</button>
        <button class="button">LOGOUT</button>
    </div>
</div>