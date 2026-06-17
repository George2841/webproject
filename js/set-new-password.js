// This script handles the final step of password reset
// The user creates a new password after OTP verification

const API_BASE_URL = "http://localhost:8072/api/v1";

const setPasswordForm = document.getElementById('setPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');

// Get the reset token and email from the session
const resetToken = sessionStorage.getItem('resetToken');
const resetEmail = sessionStorage.getItem('resetEmail');

// If we don't have a token or email, send them back to start
if (!resetToken || !resetEmail) {
    window.location.href = 'reset-password.html';
}

// Clear errors when the user types
newPasswordInput.addEventListener('input', function() {
    newPasswordInput.classList.remove('error');
    passwordError.classList.remove('show');
    errorMessage.classList.remove('show');
});

confirmPasswordInput.addEventListener('input', function() {
    confirmPasswordInput.classList.remove('error');
    confirmError.classList.remove('show');
    errorMessage.classList.remove('show');
});

// Handle form submission
setPasswordForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    let isValid = true;
    
    // Check that the password is long enough
    if (!newPassword || newPassword.length < 6) {
        newPasswordInput.classList.add('error');
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordError.classList.add('show');
        isValid = false;
    } else {
        newPasswordInput.classList.remove('error');
        passwordError.classList.remove('show');
    }
    
    // Check that both passwords match
    if (!confirmPassword || newPassword !== confirmPassword) {
        confirmPasswordInput.classList.add('error');
        confirmError.textContent = 'Passwords do not match';
        confirmError.classList.add('show');
        isValid = false;
    } else {
        confirmPasswordInput.classList.remove('error');
        confirmError.classList.remove('show');
    }
    
    if (!isValid) {
        return;
    }
    
    // Show loading state
    resetPasswordBtn.disabled = true;
    resetPasswordBtn.textContent = 'Resetting...';
    
    // Hide old messages
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
    
    try {
        // Send the new password to the backend
        const response = await fetch(API_BASE_URL + '/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + resetToken
            },
            body: JSON.stringify({
                email: resetEmail,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        console.log('Password reset response:', result);
        
        if (response.ok && result.success) {
            // Password was reset successfully
            successMessage.classList.add('show');
            successMessage.textContent = '✅ Password reset successful! Redirecting to login...';
            
            // Clean up the session data
            sessionStorage.removeItem('resetToken');
            sessionStorage.removeItem('resetEmail');
            
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.textContent = 'Reset Password';
            
            // After 3 seconds, send the user to the login page
            setTimeout(function() {
                window.location.href = 'login.html';
            }, 3000);
            
        } else {
            // Password reset failed
            errorMessage.textContent = result.message || '❌ Password reset failed. Please try again.';
            errorMessage.classList.add('show');
            
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.textContent = 'Reset Password';
        }
        
    } catch (error) {
        console.error('Network error:', error);
        errorMessage.textContent = '❌ Network error. Please check your connection.';
        errorMessage.classList.add('show');
        
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.textContent = 'Reset Password';
    }
});