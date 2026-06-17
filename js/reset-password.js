// This script handles the first step of password reset
// The user enters their email and we request an OTP from the backend

const API_BASE_URL = "http://localhost:8072/api/v1";

const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const emailError = document.getElementById('emailError');

// Clear error messages when the user starts typing
emailInput.addEventListener('input', function() {
    emailInput.classList.remove('error');
    emailError.classList.remove('show');
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
});

// Handle form submission
resetForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Make sure the user typed something
    if (!email) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter your email address';
        emailError.classList.add('show');
        return;
    }
    
    // Check if the email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
        return;
    }
    
    // Show loading state so the user knows something is happening
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';
    
    // Hide any old messages
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
    
    try {
        // Ask the backend to send an OTP to this email
        const response = await fetch(API_BASE_URL + '/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        const result = await response.json();
        console.log('Backend response:', result);
        
        if (response.ok && result.success) {
            // OTP was sent successfully
            successMessage.classList.add('show');
            
            // Save the email so we can use it on the next page
            sessionStorage.setItem('resetEmail', email);
            
            // Store reset token if the backend returned one
            if (result.token) {
                sessionStorage.setItem('resetToken', result.token);
            }
            
            successMessage.textContent = '✅ OTP sent successfully! Check your email.';
            
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
            
            // After 2 seconds, take the user to the OTP verification page
            setTimeout(function() {
                window.location.href = 'verify-otp.html';
            }, 2500);
            
        } else {
            // Something went wrong - email not found or other error
            errorMessage.textContent = result.message || '❌ Email not found. Please check and try again.';
            errorMessage.classList.add('show');
            
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
        }
        
    } catch (error) {
        console.error('Network error:', error);
        errorMessage.textContent = '❌ Network error. Please check your internet connection.';
        errorMessage.classList.add('show');
        
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
    }
});