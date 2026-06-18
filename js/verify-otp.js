const API_BASE_URL = "http://localhost:8072/api/v1";

const verifyForm = document.getElementById('verifyOtpForm');
const otpInput = document.getElementById('otp');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const otpError = document.getElementById('otpError');
const resendLink = document.getElementById('resendOtp');

const resetEmail = sessionStorage.getItem('resetEmail');

if (!resetEmail) {
    window.location.href = 'reset-password.html';
}

otpInput.addEventListener('input', function() {
    otpInput.classList.remove('error');
    otpError.classList.remove('show');
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    this.value = this.value.replace(/[^0-9]/g, '');
});

verifyForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        otpInput.classList.add('error');
        otpError.textContent = 'Please enter a valid 6-digit OTP';
        otpError.classList.add('show');
        return;
    }
    
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = 'Verifying...';
    
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
    
    try {
        const response = await fetch(API_BASE_URL + '/auth/verify-otp/'+ otp, {
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
            successMessage.classList.add('show');
            successMessage.textContent = ' OTP verified! Redirecting to reset password...';
            
            if (result.token) {
                sessionStorage.setItem('resetToken', result.token);
            }
            
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify OTP';
            
            setTimeout(function() {
                window.location.href = 'set-new-password.html';
            }, 2500);
            
        } else {
            errorMessage.textContent = result.message || ' Invalid OTP. Please try again.';
            errorMessage.classList.add('show');
            otpInput.classList.add('error');
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify OTP';
        }
        
    } catch (error) {
        console.error('Network error:', error);
        errorMessage.textContent = ' Network error. Please check your connection.';
        errorMessage.classList.add('show');
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify OTP';
    }
});

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
            successMessage.textContent = ' New OTP sent to your email!';
            successMessage.classList.add('show');
            errorMessage.classList.remove('show');
        } else {
            errorMessage.textContent = result.message || 'Failed to send OTP. Please try again.';
            errorMessage.classList.add('show');
        }
        
    } catch (error) {
        errorMessage.textContent = ' Network error. Please try again.';
        errorMessage.classList.add('show');
    }
    
    setTimeout(function() {
        resendLink.textContent = 'Resend OTP';
        resendLink.style.color = '#667eea';
    }, 3000);
});