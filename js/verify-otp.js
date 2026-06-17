// This script handles the second step of password reset
// The user enters the OTP they received in their email

const API_BASE_URL = "http://localhost:8072/api/v1";

const verifyForm = document.getElementById('verifyOtpForm');
const otpInput = document.getElementById('otp');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const otpError = document.getElementById('otpError');
const resendLink = document.getElementById('resendOtp');

// Get the email from the previous page
const resetEmail = sessionStorage.getItem('resetEmail');

// If we don't have an email, something went wrong - send them back
if (!resetEmail) {
    window.location.href = 'reset-password.html';
}

// Clear error messages when the user types
otpInput.addEventListener('input', function() {
    otpInput.classList.remove('error');
    otpError.classList.remove('show');
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    
    // Only allow numbers - reject letters and symbols
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Handle form submission
verifyForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const otp = otpInput.value.trim();
    
    // The OTP must be exactly 6 digits
    if (!otp || otp.length !== 6) {
        otpInput.classList.add('error');
        otpError.textContent = 'Please enter a valid 6-digit OTP';
        otpError.classList.add('show');
        return;
    }
    
    // Show loading state
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = 'Verifying...';
    
    // Hide old messages
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
    
    try {
        // Send the OTP to the backend for verification
        const response = await fetch(API_BASE_URL + '/auth/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: resetEmail,
                otp: otp
            })
        });
        
        const result = await response.json();
        console.log('OTP verification response:', result);
        
        if (response.ok && result.success) {
            // OTP is correct - move to password reset
            successMessage.classList.add('show');
            successMessage.textContent = '✅ OTP verified! Redirecting to reset password...';
            
            // Store the token for the next step
            if (result.token) {
                sessionStorage.setItem('resetToken', result.token);
            }
            
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify OTP';
            
            // After 2 seconds, go to the set new password page
            setTimeout(function() {
                window.location.href = 'set-new-password.html';
            }, 2500);
            
        } else {
            // OTP was wrong - show error
            errorMessage.textContent = result.message || '❌ Invalid OTP. Please try again.';
            errorMessage.classList.add('show');
            otpInput.classList.add('error');
            
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify OTP';
        }
        
    } catch (error) {
        console.error('Network error:', error);
        errorMessage.textContent = '❌ Network error. Please check your connection.';
        errorMessage.classList.add('show');
        
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify OTP';
    }
});

// Handle resend OTP - sends a new OTP to the user's email
resendLink.addEventListener('click', async function(event) {
    event.preventDefault();
    
    resendLink.textContent = 'Sending...';
    resendLink.style.color = '#999';
    
    try {
        const response = await fetch(API_BASE_URL + '/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: resetEmail })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            successMessage.textContent = '✅ New OTP sent to your email!';
            successMessage.classList.add('show');
            errorMessage.classList.remove('show');
        } else {
            errorMessage.textContent = result.message || '❌ Failed to send OTP. Please try again.';
            errorMessage.classList.add('show');
        }
        
    } catch (error) {
        errorMessage.textContent = '❌ Network error. Please try again.';
        errorMessage.classList.add('show');
    }
    
    // Reset the link text after 3 seconds
    setTimeout(function() {
        resendLink.textContent = 'Resend OTP';
        resendLink.style.color = '#667eea';
    }, 3000);
});