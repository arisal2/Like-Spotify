<?php
    class Account {

        private $errorArray;

        public function __construct() {
            $this->errorArray = array();
        }
        
        public function register ($un, $fm, $ln, $em, $em2, $pw, $pw2){
            $this->validateUsername($un);
            $this->validateFirstName($fm);
            $this->validateLastName($ln);
            $this->validateEmails($em,$em2);
            $this->validatePasswords($pw,$pw2);
        }

    
        private function validateUsername($un) {
            if(strlen($un) > 25 || strlen($un) < 5){
                array_push($this->errorArray, "Your username must be between 5 and 25 characters");
                return;
            }
        }
    
    
        private function validateFirstName($fn) {
            if(strlen($fn) > 25 || strlen($fn) < 2){
                array_push($this->errorArray, "Your firstname must be between 2 and 25 characters");
                return;
            }
        }
    
    
        private function validateLastName($ln) {
            if(strlen($ln) > 25 || strlen($ln) < 2){
                array_push($this->errorArray, "Your lastname must be between 2 and 25 characters");
                return;
            }
        }
    
        private function validateEmails($em, $em2) {
            if($em != $em2) {
                array_push($this->errorArray, "Your emails don't match");
                return;
            }

            if(!filter_var($em, FILTER_VALIDATE_EMAIL)){
                array_push($this->errorArray, "Email is invalid");
                return;
            }
        }
    
    
        private function validatePasswords($pw, $pw2) {
            if($pw != $pw2) {
                array_push($this->errorArray, "Your passwords don't match");
                return;
            }

            if(preg_match('/[^A-Za-z0-9]/', $pw)){
                array_push($this->errorArray, "Your passwords can only contain numbers and letters");
                return;
            }

            if(strlen($pw) > 25 || strlen($pw) < 5){
                array_push($this->errorArray, "Your passowrd must be between 5 and 30 characters");
                return;
            }
        }
    }

?>