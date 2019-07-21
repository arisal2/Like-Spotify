<?php
    include("includes/config.php");
    include("includes/classes/Account.php");
    include("includes/classes/Constants.php");

    $account = new Account($con);
    
    include("includes/handlers/register-handler.php");
    include("includes/handlers/login-handler.php");

    function getInputValue($name) {
        if(isset($_POST[$name])){
            echo $_POST[$name];
        }
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Welcome to Clonify</title>
    <link rel="stylesheet" type="text/css" href="assets/css/register.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="assets/js/register.js"></script>
</head>
<body>

    <?php
    if(isset($_POST['registerButton'])){
        echo ' <script>
        $(document).ready(function () {
                
                $("#loginForm").hide();
                $("#registrationForm").show();
        });
    </script>';
    } 
    else {
        echo ' <script>
        $(document).ready(function () {
                
                $("#loginForm").show();
                $("#registrationForm").hide();
        });
    </script>';
    }

    ?>
    <div id="background">
        <div id="loginContainer">
            <div id="inputContainer">
                <form id="loginForm" action="register.php" method="POST">
                    <h2>Login to your account</h2>

                    <?php echo $account->getError(Constants::$loginFailed); ?>
                    <p>
                        <label for="loginUsername">Username</label>
                        <input id="loginUsername" name="loginUsername" type="text" placeholder="e.g. arisal2" required>
                    </p>
                    <p>
                        <label for="loginPassword">Password</label>
                        <input id="loginPassword" name="loginPassword" type="password" required>
                    </p>
                    <button type="submit" name="loginButton">LOG IN</button>
                
                    <div class="hasAccountText">
                        <span id="hideLogin">Don't have an account yet? Signup here.</span>
                    </div>    
                </form>


                <form id="registrationForm" action="register.php" method="POST">
                    <h2>Create your free account</h2>
                    <p>
                        <?php echo $account->getError(Constants::$validateUserNameCharacters); ?> 
                        <?php echo $account->getError(Constants::$userNameTaken); ?> 
                        <label for="username">Username</label>
                        <input id="username" name="username" type="text" placeholder="e.g. arisal2"  value="<?php getInputValue('username')?>" required>
                    </p>
                    <p>
                        <?php echo $account->getError(Constants::$validateFirstNameCharacters); ?> 
                        <label for="firstName">First name</label>
                        <input id="firstName" name="firstName" type="text" placeholder="e.g. Abhinav"  value="<?php getInputValue('firstName')?>" required>
                    </p>
                    <p>
                        <?php echo $account->getError(Constants::$validateLastNameCharacters); ?> 
                        <label for="lastName">Last name</label>
                        <input id="lastName" name="lastName" type="text" placeholder="e.g. Risal"  value="<?php getInputValue('lastName')?>" required>
                    </p>
                    <p>
                        <?php echo $account->getError(Constants::$emailDoNotMatch); ?>
                        <?php echo $account->getError(Constants::$emailInvalid); ?>
                        <?php echo $account->getError(Constants::$emailTaken); ?>
                        <label for="email">Email</label>
                        <input id="email" name="email" type="email" placeholder="e.g. abhinavrisal99@gmail.com"  value="<?php getInputValue('email')?>" required>
                    </p>
                    <p>
                        <label for="email2">Confirm email</label>
                        <input id="email2" name="email2" type="email" placeholder="e.g. abhinavrisal99@gmail.com"  value="<?php getInputValue('email2')?>" required>
                    </p>
                    <p>
                        <?php echo $account->getError(Constants::$passwordsDoNotMatch); ?>
                        <?php echo $account->getError(Constants::$passwordsNotAlphanumeric); ?>
                        <?php echo $account->getError(Constants::$validatePasswordCharacters); ?>
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="Your Password" required>
                    </p>
                    <p>
                    <label for="password2">Confirm Password</label>
                    <input id="password2" name="password2" type="password" placeholder="Your Password" required>
                    </p>

                    <button type="submit" name="registerButton">SIGN UP</button>

                    <div class="hasAccountText">
                        <span id="hideRegister">Already have an account? Log in here.</span>
                    </div>   
                </form>
            </div>

            <div id="loginText">
                <h1>Get great music, right now</h1>
                <h1>Listen to loads of songs for free</h1>
                <ul>
                    <li>Discover music you will fall in live with</li>
                    <li>Create your own playlist</li>
                    <li>Follow artists to keep up to date</li>
                </ul>
            </div>

        </div>
    <div>    
</body>
</html>
      

   