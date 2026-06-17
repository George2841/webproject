const API_BASE_URL = "http://localhost:8072/api/v1";

const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const emailError = document.getElementById('emailError');

emailInput.addEventListener('input', function() {
    emailInput.classList.remove('error');
    emailError.classList.remove('show');
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
});

resetForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter your email address';
        emailError.classList.add('show');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
        return;
    }
    
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';
    
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
    
    try {
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
            successMessage.classList.add('show');
            sessionStorage.setItem('resetEmail', email);
            
            if (result.token) {
                sessionStorage.setItem('resetToken', result.token);
            }
            
            successMessage.textContent = '✅ OTP sent successfully! Check your email.';
            
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
            
            setTimeout(function() {
                window.location.href = 'verify-otp.html';
            }, 2500);
            
        } else {
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