
//CAPTURE PAGE JAVASCRIPT

document.addEventListener('DOMContentLoaded', function() {
    
    //CLOCK FUNCTIONALITY
    function updateClock() {
        var now = new Date();
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        var timeString = hours + ':' + minutes + ':' + seconds;
        var navClock = document.getElementById('navClock');
        if (navClock) navClock.textContent = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock();
    
    //MOBILE MENU
    window.toggleMenu = function() {
        var mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) mobileMenu.classList.toggle('show');
    }
    
    //DOM ELEMENTS
    var video = document.getElementById('videoFeed');
    var canvas = document.getElementById('photoCanvas');
    var capturePhotoBtn = document.getElementById('capturePhotoBtn');
    var retakeBtn = document.getElementById('retakeBtn');
    var finishBtn = document.getElementById('finishBtn');
    var previewImage = document.getElementById('previewImage');
    var capturedPreview = document.getElementById('capturedPreview');
    var messageBox = document.getElementById('messageBox');
    var successOverlay = document.getElementById('successOverlay');
    var manualCaptureBtn = document.getElementById('captureBtn');
    
    var stream = null;
    var capturedImageData = null;
    var studentData = null;
    
    // API CONFIGURATION
    var API_BASE_URL = "http://localhost:8072/api/v1";
    
    //SHOW MESSAGE
    function showMessage(message, type) {
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = 'message ' + type;
            messageBox.style.display = 'block';
            setTimeout(function() {
                if (messageBox) messageBox.style.display = 'none';
            }, 3000);
        }
    }
    
    //LOAD STUDENT DATA
    function loadStudentData() {
        try {
            studentData = JSON.parse(localStorage.getItem('tempStudentData'));
            
            if (!studentData) {
                showMessage('No registration data found. Please register first.', 'error');
                setTimeout(function() {
                    window.location.href = 'registration.html';
                }, 2000);
                return false;
            }
            
            var displayName = document.getElementById('displayName');
            var displayRegNumber = document.getElementById('displayRegNumber');
            
            if (displayName) {
                displayName.textContent = studentData.firstName + ' ' + studentData.lastName;
            }
            if (displayRegNumber) {
                displayRegNumber.textContent = studentData.regNumber;
            }
            return true;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }
    
    //CAMERA INIT
    async function initCamera() {
        try {
            var streamResult = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            });
            stream = streamResult;
            if (video) video.srcObject = stream;
            showMessage('Camera ready. Center your face in the circle.', 'info');
        } catch (err) {
            showMessage('Camera access denied. Please allow camera access.', 'error');
        }
    }
    
    //CAPTURE PHOTO
    function capturePhoto() {
        if (!video || !video.srcObject || !stream) {
            showMessage('Camera not ready. Please wait...', 'error');
            return;
        }
        
        try {
            var ctx = canvas.getContext('2d');
            var videoRect = video.getBoundingClientRect();
            var scanFrame = document.querySelector('.scan-frame');
            if (!scanFrame) { showMessage('Scanner frame not found.', 'error'); return; }
            
            var overlayRect = scanFrame.getBoundingClientRect();
            var scaleX = video.videoWidth / videoRect.width;
            var scaleY = video.videoHeight / videoRect.height;
            var circleX = (overlayRect.left - videoRect.left) * scaleX;
            var circleY = (overlayRect.top - videoRect.top) * scaleY;
            var circleSize = overlayRect.width * scaleX;
            
            canvas.width = circleSize;
            canvas.height = circleSize;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(circleSize / 2, circleSize / 2, circleSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, circleX, circleY, circleSize, circleSize, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
            
            if (previewImage) previewImage.src = capturedImageData;
            if (capturedPreview) capturedPreview.style.display = 'block';
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
            if (retakeBtn) retakeBtn.style.display = 'block';
            if (finishBtn) finishBtn.style.display = 'block';
            
            showMessage('Face captured! Click "Finish Registration" to complete.', 'success');
        } catch (error) {
            showMessage('Error capturing face. Please try again.', 'error');
        }
    }
    
    //RETAKE PHOTO
    function retakePhoto() {
        capturedImageData = null;
        if (capturedPreview) capturedPreview.style.display = 'none';
        if (previewImage) previewImage.src = '';
        if (capturePhotoBtn) capturePhotoBtn.style.display = 'block';
        if (retakeBtn) retakeBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
        showMessage('Position your face in the circle and capture again.', 'info');
    }
    
    // ========== SEND DATA TO BACKEND DATABASE ==========
    async function sendToDatabase(studentData, capturedImageData) {
        try {
            const token = localStorage.getItem("jwtToken");

            console.log("JWT Token:", token);

            if (!token) {
                return {
                    success: false,
                    message: "JWT token not found. Please login again."
                };
            }

            const payload = {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                regNumber: studentData.regNumber,
                studentEmail: studentData.email,
                department: studentData.department,
                faculty: studentData.faculty,
                yearOfStudy: studentData.yearOfStudy,
                image: capturedImageData
            };

            //this consoler log  for debugging
            console.log("Sending data to database...");
            console.log("Token =", token);
            console.log("URL =", "http://localhost:8072/api/v1/admin/create/student");
            console.log("Payload =", payload);

            const response = await fetch("http://localhost:8072/api/v1/admin/create/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error("Database submission error:", error);
            return { success: false, message: "An error occurred while saving to database." };
        }
    }
});
