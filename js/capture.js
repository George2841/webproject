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

        console.log("Sending data to database...");
        console.log(payload);

        
    console.log("Token =", token);
    console.log("URL =", "http://localhost:8072/api/v1/admin/create/student");
    console.log("Payload =", payload);

        const response = await fetch(
            "http://localhost:8072/api/v1/admin/create/student",
            {
    //SEND DATA TO BACKEND DATABASE
    async function sendToDatabase(studentData, capturedImageData) {
        try {
            // Prepare the payload for the API
            var payload = {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                regNumber: studentData.regNumber,
                studentEmail: studentData.email,
                department: studentData.department,
                faculty: studentData.faculty,
                yearOfStudy: studentData.yearOfStudy,
                image: capturedImageData
            };
            
            console.log("Sending data to database:", payload);
            
            // Make API call to backend
            var response = await fetch("http://localhost:8072/api/v1/admin/create/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            }
        );

        console.log("Response Status:", response.status);
        console.log("Response OK:", response.ok);

        const text = await response.text();

        console.log("Backend Response:", text);

        if (response.ok) {
            return {
                success: true,
                data: text
            };
        }

        return {
            success: false,
            message: text || "Failed to save student"
        };

    } catch (error) {

        console.error("FETCH ERROR:", error);

        return {
            success: false,
            message: error.message
        };
    }
}
    
    //SAVE TO LOCAL STORAGE (Backup)
    function saveToLocalStorage(fullStudentData) {
        try {
            var students = JSON.parse(localStorage.getItem('students') || '[]');
            
            // Check if student already exists
            var existingIndex = -1;
            for (var i = 0; i < students.length; i++) {
                if (students[i].email === fullStudentData.email) {
                    existingIndex = i;
                    break;
                }
            }
            
            if (existingIndex >= 0) {
                students[existingIndex] = fullStudentData;
            } else {
                students.push(fullStudentData);
            }
            
            localStorage.setItem('students', JSON.stringify(students));
            
            // Create user session
            var userSession = {
                email: fullStudentData.email,
                name: fullStudentData.firstName + ' ' + fullStudentData.lastName,
                regNumber: fullStudentData.regNumber,
                role: 'student',
                loginTime: new Date().toISOString(),
                hasFaceImage: true
            };
            localStorage.setItem('currentUser', JSON.stringify(userSession));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.removeItem('tempStudentData');
            
            return true;
        } catch (error) {
            console.error("LocalStorage error:", error);
            return false;
        }
    }
    
    //SHOW SUCCESS POPUP THEN REDIRECT TO HOME
    function showSuccessPopupAndRedirect() {
        // Show the success overlay popup
        if (successOverlay) {
            successOverlay.classList.add('show');
        }
        
        // Wait 3 seconds for user to see the success message
        setTimeout(function() {
            // Redirect to home page (index.html)
            window.location.href = 'index.html';
        }, 3000);
    }
    
    //COMPLETE REGISTRATION
    async function completeRegistration() {
        if (!capturedImageData) {
            showMessage('Please capture your face first!', 'error');
            return;
        }
        
        if (finishBtn) {
            finishBtn.disabled = true;
            finishBtn.textContent = 'Processing...';
        }
        
        showMessage('Saving registration to database...', 'info');
        
        try {
            // Send data to Backend Database ====
            var dbResult = await sendToDatabase(studentData, capturedImageData);
            
            if (dbResult.success) {
                console.log("Database save successful:", dbResult);
                
                //Save to Local Storage as backup
                var fullStudentData = {
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    regNumber: studentData.regNumber,
                    email: studentData.email,
                    department: studentData.department,
                    yearOfStudy: studentData.yearOfStudy,
                    faculty: studentData.faculty,
                    faceImage: capturedImageData,
                    registrationDate: new Date().toISOString(),
                    status: 'active',
                    syncedToDatabase: true,
                    databaseId: dbResult.data?.id || null
                };
                
                saveToLocalStorage(fullStudentData);
                
                // Stop camera
                if (stream) {
                    stream.getTracks().forEach(function(track) { track.stop(); });
                }
                
                // Show success popup and redirect to home
                showSuccessPopupAndRedirect();
                
            } else {
                // Database save failed
                console.error("Database save failed:", dbResult.message);
                showMessage(dbResult.message + " - Please check your connection.", 'error');
                
                if (finishBtn) {
                    finishBtn.disabled = false;
                    finishBtn.textContent = 'Finish Registration';
                }
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Error saving registration. Please check your internet connection.', 'error');
            if (finishBtn) {
                finishBtn.disabled = false;
                finishBtn.textContent = 'Finish Registration';
            }
        }
    }
    
    //EVENT LISTENERS
    if (capturePhotoBtn) capturePhotoBtn.addEventListener('click', capturePhoto);
    if (retakeBtn) retakeBtn.addEventListener('click', retakePhoto);
    if (finishBtn) finishBtn.addEventListener('click', completeRegistration);
    if (manualCaptureBtn) manualCaptureBtn.addEventListener('click', capturePhoto);
    
    //INITIALIZE
    if (loadStudentData()) {
        initCamera();
    }
    
    // Clean up
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(function(track) { track.stop(); });
        }
    });
});