// LOGIN WITH EMAIL AND PASSWORD
// Login details from Html file

console.log("login.js loaded");

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

console.log("loginForm:", loginForm);
console.log("emailInput:", emailInput);
console.log("passwordInput:", passwordInput);
console.log("loginBtn:", loginBtn);

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    emailError.classList.remove('show');
    emailError.textContent = '';
});

passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    passwordError.classList.remove('show');
    passwordError.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {

    console.log("FORM SUBMITTED");

    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    console.log("Email Entered:", email);
    console.log("Password Length:", password.length);

    let isValid = true;

    if (!email) {
        emailError.textContent = 'Please enter your email';
        emailError.classList.add('show');
        isValid = false;
    } else if (!validateEmail(email)) {
        emailError.textContent = 'Please enter a valid email';
        emailError.classList.add('show');
        isValid = false;
    }

    if (!password) {
        passwordError.textContent = 'Please enter your password';
        passwordError.classList.add('show');
        isValid = false;
    }

    if (!isValid) {
        console.log("Validation failed");
        return;
    }

    console.log("Validation passed");

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {

        console.log("Sending POST request...");
        console.log("URL:", "http://localhost:8072/api/v1/auth/login");

        const payload = {
            email: email,
            password: password
        };

        console.log("Payload:", payload);

        const response = await fetch(
            "http://localhost:8072/api/v1/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        console.log("Response Status:", response.status);
        console.log("Response OK:", response.ok);

        const data = await response.json();

        console.log("Response Data:", data);

        if (response.ok) {

            // Store login response i.e jwtToken and email
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("email", data.email);
            localStorage.setItem("jwtToken", data.jwtToken);

            console.log("Login Successful");
            console.log("Email:", data.email);
            console.log("JWT Token:", data.jwtToken);

            // Redirect to dashboard after loggin (direct to dash board based on role)
            window.location.href = "index.html";

        } else {

            console.log("Login Failed");

            emailError.textContent =
                "Invalid email or password";

            emailError.classList.add("show");

            loginBtn.disabled = false;
            loginBtn.textContent = "Log In";
        }

    } catch (error) {

        console.error("Login Error:", error);

        emailError.textContent =
            "Unable to connect to server";

        emailError.classList.add("show");

        loginBtn.disabled = false;
        loginBtn.textContent = "Log In";
    }

});

passwordInput.addEventListener('keypress', (e) => {

    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});