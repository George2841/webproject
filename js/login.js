//LOGIN WITH EMAIL AND PASSWORD

// Get DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Clear previous errors on input
emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error');
    emailError.classList.remove('show');
    emailError.textContent = 'Please enter your email';
});

passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    passwordError.classList.remove('show');
    passwordError.textContent = 'Please enter your password';
});

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    let isValid = true;
    
    // Validate email
    if (!email) {
        emailInput.classList.add('error');
        emailError.classList.add('show');
        emailError.textContent = 'Please enter your email';
        isValid = false;
    } else if (!validateEmail(email)) {
        emailInput.classList.add('error');
        emailError.classList.add('show');
        emailError.textContent = 'Please enter a valid email address';
        isValid = false;
    } else {
        emailInput.classList.remove('error');
        emailError.classList.remove('show');
    }
    
    // Validate password
    if (!password) {
        passwordInput.classList.add('error');
        passwordError.classList.add('show');
        passwordError.textContent = 'Please enter your password';
        isValid = false;
    } else if (password.length < 4) {
        passwordInput.classList.add('error');
        passwordError.classList.add('show');
        passwordError.textContent = 'Password must be at least 4 characters';
        isValid = false;
    } else {
        passwordInput.classList.remove('error');
        passwordError.classList.remove('show');
    }
    
    if (!isValid) return;
    
    // Disable button and show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    
    
    //Real Backend API
    
    try {
        const response = await fetch('https://your-backend-api.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store user info and token
            const userData = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role,
                studentId: data.user.student_id,
                token: data.token,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('authToken', data.token);
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (data.user.role === 'instructor') {
                window.location.href = 'instructor-dashboard.html';
            } else {
                window.location.href = 'home.html';
            }
            
        } else {
            // Show error message from server
            emailError.textContent = data.message || 'Invalid email or password';
            emailError.classList.add('show');
            emailInput.classList.add('error');
            
            // Reset button
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        emailError.textContent = 'Network error. Please try again.';
        emailError.classList.add('show');
        
        // Reset button
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
    
});

// Add Enter key support
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// Check if already logged in and redirect
function checkAlreadyLoggedIn() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (isLoggedIn === 'true' && userData) {
        // Redirect based on role
        if (userData.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (userData.role === 'instructor') {
            window.location.href = 'instructor-dashboard.html';
        } else {
            window.location.href = 'home.html';
        }
    }
}

// Uncomment to enable auto-redirect if already logged in
// checkAlreadyLoggedIn();