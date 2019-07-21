<?php

include("includes/config.php");

if(isset($_SESSION['userLoggedIn'])){
    $userLoggedIn = $_SESSION['userLoggedIn'];
} 
else {
    header("Location: register.php");
}

?>
<head>
    <title>Welcome to Clonify!</title>
</head>
<body>
    
</body>
</html>