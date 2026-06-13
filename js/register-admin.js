// checks authentication before allowing you to access register-admin page
function checkAuthentication() {

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const jwtToken = localStorage.getItem("jwtToken");

    if (
        !isLoggedIn ||
        isLoggedIn !== "true" ||
        !jwtToken
    ) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// LOGOUT
function logout() {

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("email");
    localStorage.removeItem("currentUser");

    window.location.href = "login.html";
}

//this fuction validate token if it expired or not
async function validateToken() {

    const token = localStorage.getItem("jwtToken");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    //when there is token, this fetch function sends the token to be validated in backend to check if is not expired 
    // and if is aready expired, you are redirected to login page
    try {

        const response = await fetch(
            "http://localhost:8072/api/v1/auth/validate",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        //if response from backend ids not ok, meaning token is expired, that token get cleared from local storage and 
        // you get redirected to login page
        if (!response.ok) {

            localStorage.clear();
            window.location.href = "login.html";

            return false;
        }

        return true;

    } catch (error) {

        localStorage.clear();
        window.location.href = "login.html";

        return false;
    }
}

//backend url
const API_BASE_URL = "http://localhost:8072/api/v1";

//clock
function updateClock() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const clock = document.getElementById("navClock");

    if (clock) {
        clock.textContent = `${hours}:${minutes}:${seconds}`;
    }
}
window.addEventListener("load", async () => {

    if (!checkAuthentication()) {
        return;
    }

    const valid = await validateToken();

    if (!valid) {
        return;
    }

    // page initialization code here
});


setInterval(updateClock, 1000);
updateClock();

// mobile menu
function toggleMenu() {
    const mobileMenu = document.getElementById("mobileMenu");

    if (mobileMenu) {
        mobileMenu.classList.toggle("show");
    }
}

document.addEventListener("click", function (event) {

    const mobileMenu = document.getElementById("mobileMenu");
    const hamburger = document.getElementById("hamburger");

    if (
        mobileMenu &&
        mobileMenu.classList.contains("show") &&
        hamburger &&
        !hamburger.contains(event.target) &&
        !mobileMenu.contains(event.target)
    ) {
        mobileMenu.classList.remove("show");
    }
});

window.toggleMenu = toggleMenu;

//succes pop up message
function showSuccess(message) {

    const successDiv = document.getElementById("successMessage");
    const errorDiv = document.getElementById("errorMessage");

    if (errorDiv) {
        errorDiv.style.display = "none";
    }

    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = "block";
    }
}

function showError(message) {

    const successDiv = document.getElementById("successMessage");
    const errorDiv = document.getElementById("errorMessage");

    if (successDiv) {
        successDiv.style.display = "none";
    }

    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

//create payload of the admin data to be send to backend
async function saveAdmin(adminData) {

    const token = localStorage.getItem("jwtToken");

    const payload = {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        employeeNumber: adminData.employeeNumber,
        phoneNumber: adminData.phoneNumber,
        department: adminData.department,
        position: adminData.position,
        email: adminData.email,
        password: adminData.password
    };

    console.log("Sending Admin:", payload);

    //send admin data to backend to save admin
    const response = await fetch(API_BASE_URL + "/admin/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? "Bearer " + token : ""
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    console.log("Backend Response:", result);

    if (!response.ok) {
        throw new Error(result.message || "Failed to register admin");
    }

    return result;
}

//submit form data
const registerForm = document.getElementById("registerAdminForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const submitBtn = document.getElementById("submitBtn");

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const employeeNumber = document.getElementById("employeeNumber").value.trim();
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const department = document.getElementById("department").value;
        const position = document.getElementById("position").value;
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Validation
        if (
            !firstName ||
            !lastName ||
            !employeeNumber ||
            !phoneNumber ||
            !department ||
            !position ||
            !email ||
            !password
        ) {
            showError("Please fill all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Registering...";

        try {

            const adminData = {
                firstName,
                lastName,
                employeeNumber,
                phoneNumber,
                department,
                position,
                email,
                password
            };

            const result = await saveAdmin(adminData);

            console.log(result);

            showSuccess("Admin registered successfully.");

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "admins-list.html";
            }, 2000);

        } catch (error) {

            console.error(error);

            showError(error.message);

        } finally {

            submitBtn.disabled = false;
            submitBtn.textContent = "Register Admin";
        }
    });
}

console.log("Register Admin page loaded successfully");