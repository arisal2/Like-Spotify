<?php
    class Account {

        private $con;
        private $errorArray;

        public function __construct($con) {
            $this->con = $con;
            $this->errorArray = array();
        }
        
        public function register ($un, $fm, $ln, $em, $em2, $pw, $pw2){
            $this->validateUsername($un);
            $this->validateFirstName($fm);
            $this->validateLastName($ln);
            $this->validateEmails($em,$em2);
            $this->validatePasswords($pw,$pw2);

            if(empty($this->errorArray) == true) {
                return $this->insertUserDetails($un, $fm, $ln, $em, $pw);
            } else {
                return false;
            }
        }

        public function getError($error){
            if(!in_array($error, $this->errorArray)){
                $error = "";
            }
            return "<span class='errorMessage'>$error</span>";
        }

        private function insertUserDetails($un, $fm, $ln, $em, $pw){
            $encryptedPassword = md5($pw);
            $profilePicture = "assets/images/profile-pics/images.png";
            $date = date("Y-m-d");
            $result = mysqli_query($this->con,"INSERT INTO users VALUES (NULL,'$un','$fm','$ln','$em','$encryptedPassword','$date','$profilePicture')");
        
            return $result;
        }

    
        private function validateUsername($un) {
            if(strlen($un) > 25 || strlen($un) < 5){
                array_push($this->errorArray, Constants::$validateUserNameCharacters);
                return;
            }

            $checkUserNameQuery = mysqli_query($this->con,"SELECT username from users WHERE username = '$un'");
            if(mysqli_num_rows($checkUserNameQuery)!= 0){
                array_push($this->errorArray,Constants::$userNameTaken);
                return;
            }
        }
                                 
        private function validateFirstName($fn) {
            if(strlen($fn) > 25 || strlen($fn) < 2){
                array_push($this->errorArray, Constants::$validateFirstNameCharacters);
                return;
            }
        }
    
        private function validateLastName($ln) {
            if(strlen($ln) > 25 || strlen($ln) < 2){
                array_push($this->errorArray, Constants::$validateLastNameCharacters);
                return;
            }
        }
    
        private function validateEmails($em, $em2) {
            if($em != $em2) {
                array_push($this->errorArray, Constants::$emailDoNotMatch);
                return;
            }

            if(!filter_var($em, FILTER_VALIDATE_EMAIL)){
                array_push($this->errorArray, Constants::$emailInvalid);
                return;
            }

            $checEmailQuery = mysqli_query($this->con,"SELECT email from users WHERE email = '$em'");
            if(mysqli_num_rows($checkEmailQuery)!= 0){
                array_push($this->errorArray,Constants::$emailTaken);
                return;
            }
        }

        private function validatePasswords($pw, $pw2) {
            if($pw != $pw2) {
                array_push($this->errorArray, Constants::$passwordsDoNotMatch);
                return;
            }

            if(preg_match('/[^A-Za-z0-9]/', $pw)){
                array_push($this->errorArray, Constants::$passwordsNotAlphanumeric);
                return;
            }

            if(strlen($pw) > 25 || strlen($pw) < 5){
                array_push($this->errorArray, Constants::$validatePasswordCharacters);
                return;
            }
        }
    }

?>