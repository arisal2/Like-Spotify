$(document).ready(function () {
    $("#hideLogin").click(function () {
        $("#loginForm").hide();
        $("#registrationForm").show();
    })

    $("#hideRegister").click(function () {
        $("#loginForm").show();
        $("#registrationForm").hide();
    })
});