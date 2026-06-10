//FACE CAPTURE PAGE JAVASCRIPT 
// This file handles camera access, face capture, and sending data to the backend

document.addEventListener('DOMContentLoaded', function() {
    
    
    // CLOCK FUNCTION - Shows live time in navigation bar
    
    function updateClock() {
        var now = new Date();
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        var timeString = hours + ':' + minutes + ':' + seconds;
        var navClock = document.getElementById('navClock');
        if (navClock) navClock.textContent = timeString;
    }
    // Update the clock every second
    setInterval(updateClock, 1000);
    updateClock();
    
    
    // MOBILE MENU - Handles hamburger menu toggle
    
    window.toggleMenu = function() {
        var mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) mobileMenu.classList.toggle('show');
    }
    
   
    //  DOM ELEMENTS - Get all HTML elements we need
    
    var video = document.getElementById('videoFeed');           // Camera video feed
    var canvas = document.getElementById('photoCanvas');       // Hidden canvas for image processing
    var capturePhotoBtn = document.getElementById('capturePhotoBtn');  // Capture button
    var retakeBtn = document.getElementById('retakeBtn');              // Retake button
    var finishBtn = document.getElementById('finishBtn');              // Finish registration button
    var previewImage = document.getElementById('previewImage');       // Where captured image preview shows
    var capturedPreview = document.getElementById('capturedPreview'); // Preview container
    var messageBox = document.getElementById('messageBox');           // For showing messages to user
    var successOverlay = document.getElementById('successOverlay');   // Success popup overlay
    var manualCaptureBtn = document.getElementById('captureBtn');     // Alternative capture button
    
    // Variables to store data
    var stream = null;              // Camera stream
    var capturedImageData = null;   //image data after capture
    var studentData = null;         // Student information from registration
    
    
    // 4. API CONFIGURATION - Backend connection settings
    
    var API_BASE_URL = "http://localhost:8072/api/v1";
    
    
    // 5. HELPER FUNCTIONS
    
    
    // Show a temporary message to the user
    function showMessage(message, type) {
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = 'message ' + type;
            messageBox.style.display = 'block';
            // Hide message after 3 seconds
            setTimeout(function() {
                if (messageBox) messageBox.style.display = 'none';
            }, 3000);
        }
    }
    
    // Load student data that was saved during registration
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
            
            // Display student name and registration number on the page
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
            console.error('Error loading student data:', error);
            return false;
        }
    }
    
    
    // 6. CAMERA FUNCTIONS
    
    
    // Start the user's camera
    async function initCamera() {
        try {
            var streamResult = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }, 
                    facingMode: "user" 
                }
            });
            stream = streamResult;
            if (video) video.srcObject = stream;
            showMessage('Camera ready. Center your face in the circle.', 'info');
        } catch (err) {
            showMessage('Camera access denied. Please allow camera access.', 'error');
        }
    }
    
    // Capture photo from the video feed (only the circular area)
    function capturePhoto() {
        // Make sure camera is ready
        if (!video || !video.srcObject || !stream) {
            showMessage('Camera not ready. Please wait...', 'error');
            return;
        }
        
        try {
            var ctx = canvas.getContext('2d');
            var videoRect = video.getBoundingClientRect();
            var scanFrame = document.querySelector('.scan-frame');
            if (!scanFrame) { 
                showMessage('Scanner frame not found.', 'error'); 
                return; 
            }
            
            // Calculate the circular area position
            var overlayRect = scanFrame.getBoundingClientRect();
            var scaleX = video.videoWidth / videoRect.width;
            var scaleY = video.videoHeight / videoRect.height;
            var circleX = (overlayRect.left - videoRect.left) * scaleX;
            var circleY = (overlayRect.top - videoRect.top) * scaleY;
            var circleSize = overlayRect.width * scaleX;
            
            // Set canvas size to match the circle
            canvas.width = circleSize;
            canvas.height = circleSize;
            
            // Draw only the circular area from the video
            ctx.save();
            ctx.beginPath();
            ctx.arc(circleSize / 2, circleSize / 2, circleSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);  // Mirror the image
            ctx.drawImage(video, circleX, circleY, circleSize, circleSize, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            // Save the captured image as base64
            capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Show preview and update buttons
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
    
    // Allow user to retake the photo
    function retakePhoto() {
        capturedImageData = null;
        if (capturedPreview) capturedPreview.style.display = 'none';
        if (previewImage) previewImage.src = '';
        if (capturePhotoBtn) capturePhotoBtn.style.display = 'block';
        if (retakeBtn) retakeBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
        showMessage('Position your face in the circle and capture again.', 'info');
    }
    
    
    // 7. BACKEND DATABASE FUNCTIONS
    
    
    // Send student data and face image to the backend API
    async function sendToDatabase(studentData, capturedImageData) {
        try {
            // Get the authentication token from storage
            var token = localStorage.getItem("jwtToken");
            
            console.log("JWT Token:", token);
            
            // Check if user is logged in
            if (!token) {
                return {
                    success: false,
                    message: "JWT token not found. Please login again."
                };
            }
            
            // Prepare the data to send to the server
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
            
            console.log("Sending data to database...");
            console.log("Payload:", payload);
            console.log("API URL:", "http://localhost:8072/api/v1/admin/create/student");
            
            // Make the API call
            var response = await fetch("http://localhost:8072/api/v1/admin/create/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            });
            
            console.log("Response Status:", response.status);
            console.log("Response OK:", response.ok);
            
            // Get the response text
            var responseText = await response.text();
            console.log("Backend Response:", responseText);
            
            // Check if request was successful
            if (response.ok) {
                return {
                    success: true,
                    data: responseText,
                    message: "Student registered successfully!"
                };
            } else {
                return {
                    success: false,
                    message: responseText || "Failed to save student to database"
                };
            }
            
        } catch (error) {
            console.error("Network Error:", error);
            return {
                success: false,
                message: error.message || "Network error. Please check your connection."
            };
        }
    }
    
    
    // 8. LOCAL STORAGE FUNCTIONS (Backup)
    
    
    // Save student data to localStorage as a backup
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
            
            // Add or update student record
            if (existingIndex >= 0) {
                students[existingIndex] = fullStudentData;
            } else {
                students.push(fullStudentData);
            }
            
            localStorage.setItem('students', JSON.stringify(students));
            
            // Create a user session
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
            
            // Clean up temporary data
            localStorage.removeItem('tempStudentData');
            
            return true;
        } catch (error) {
            console.error("LocalStorage error:", error);
            return false;
        }
    }
    
    
    // 9. REGISTRATION COMPLETION
    
    
    // Show success popup and redirect to home page
    function showSuccessPopupAndRedirect() {
        // Show the success overlay popup
        if (successOverlay) {
            successOverlay.classList.add('show');
        }
        
        // Wait 3 seconds for user to see the success message, then redirect to home
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 3000);
    }
    
    // Complete the registration process
    async function completeRegistration() {
        // Make sure a face has been captured
        if (!capturedImageData) {
            showMessage('Please capture your face first!', 'error');
            return;
        }
        
        // Disable the finish button to prevent double submission
        if (finishBtn) {
            finishBtn.disabled = true;
            finishBtn.textContent = 'Processing...';
        }
        
        showMessage('Saving registration to database...', 'info');
        
        try {
            // Send data to backend database
            var dbResult = await sendToDatabase(studentData, capturedImageData);
            
            if (dbResult.success) {
                console.log("Database save successful:", dbResult);
                
                // Prepare complete student data
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
                
                // Save to localStorage as backup
                saveToLocalStorage(fullStudentData);
                
                // Stop the camera stream to save resources
                if (stream) {
                    stream.getTracks().forEach(function(track) { 
                        track.stop(); 
                    });
                }
                
                // Show success popup and redirect to home page
                showSuccessPopupAndRedirect();
                
            } else {
                // Database save failed - show error message
                console.error("Database save failed:", dbResult.message);
                showMessage(dbResult.message + " - Please check your connection.", 'error');
                
                // Re-enable the finish button
                if (finishBtn) {
                    finishBtn.disabled = false;
                    finishBtn.textContent = 'Finish Registration';
                }
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Error saving registration. Please check your internet connection.', 'error');
            
            // Re-enable the finish button
            if (finishBtn) {
                finishBtn.disabled = false;
                finishBtn.textContent = 'Finish Registration';
            }
        }
    }
    
    
    // 10. EVENT LISTENERS - Connect buttons to functions
     
    if (capturePhotoBtn) capturePhotoBtn.addEventListener('click', capturePhoto);
    if (retakeBtn) retakeBtn.addEventListener('click', retakePhoto);
    if (finishBtn) finishBtn.addEventListener('click', completeRegistration);
    if (manualCaptureBtn) manualCaptureBtn.addEventListener('click', capturePhoto);
    
    
    // INITIALIZE - Start everything when page loads
    
    if (loadStudentData()) {
        initCamera();
    }
    
    // Clean up camera when leaving the page
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(function(track) { 
                track.stop(); 
            });
        }
    });
    
});