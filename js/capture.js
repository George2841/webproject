// This page handles face capture as part of student registration
// The student data comes from the registration page, we just add the face image and send everything to the database

document.addEventListener('DOMContentLoaded', function() {

    // Live clock in the navigation bar - updates every second
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

    // Mobile menu toggle for small screens
    window.toggleMenu = function() {
        var mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) mobileMenu.classList.toggle('show');
    }

    // Get all the HTML elements we need to work with
    var video = document.getElementById('videoFeed');                 // Camera video feed
    var canvas = document.getElementById('photoCanvas');             // Hidden canvas for image processing
    var captureBtn = document.getElementById('captureBtn');          // The circular capture button
    var capturePhotoBtn = document.getElementById('capturePhotoBtn'); // Capture button
    var retakeBtn = document.getElementById('retakeBtn');             // Retake button
    var finishBtn = document.getElementById('finishBtn');             // Finish button
    var previewImage = document.getElementById('previewImage');       // Preview of captured image
    var capturedPreview = document.getElementById('capturedPreview'); // Preview container
    var studentNameDisplay = document.getElementById('displayName');   // Shows student name
    var studentRegDisplay = document.getElementById('displayRegNumber'); // Shows registration number
    var messageBox = document.getElementById('messageBox');           // Message display area

    // Variables to store data while the page is active
    var stream = null;              // The camera stream
    var capturedImageData = null;   // Stores the captured face image as base64
    var studentData = null;         // Student data from registration page

    // Backend API address
    var API_BASE_URL = "http://localhost:8072/api/v1";

    // Show a temporary message to the user
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
            if (studentNameDisplay) {
                studentNameDisplay.textContent = studentData.firstName + ' ' + studentData.lastName;
            }
            if (studentRegDisplay) {
                studentRegDisplay.textContent = studentData.regNumber;
            }
            return true;
        } catch (error) {
            console.error('Error loading student data:', error);
            return false;
        }
    }

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
            console.log("Camera ready");
            showMessage('Camera is ready. Please center your face in the circle and capture.', 'info');
        } catch (err) {
            console.error("Camera error:", err);
            showMessage('Camera access denied. Please allow camera access and refresh the page.', 'error');
        }
    }

    // Capture the face from the video feed - only the circular area
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
            
            // Figure out where the circular scanner is on the screen
            var overlayRect = scanFrame.getBoundingClientRect();
            var scaleX = video.videoWidth / videoRect.width;
            var scaleY = video.videoHeight / videoRect.height;
            var circleX = (overlayRect.left - videoRect.left) * scaleX;
            var circleY = (overlayRect.top - videoRect.top) * scaleY;
            var circleSize = overlayRect.width * scaleX;
            
            // Set canvas size to match the circle
            canvas.width = circleSize;
            canvas.height = circleSize;
            
            // Draw only the part of the video that's inside the circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(circleSize / 2, circleSize / 2, circleSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);  // Mirror the image so it looks like a mirror
            ctx.drawImage(video, circleX, circleY, circleSize, circleSize, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            // Save the captured image as base64
            capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Show preview
            if (previewImage) previewImage.src = capturedImageData;
            if (capturedPreview) capturedPreview.style.display = 'block';
            
            // Update button visibility
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
            if (retakeBtn) retakeBtn.style.display = 'block';
            if (finishBtn) finishBtn.style.display = 'block';
            
            showMessage('Face captured successfully! Click "Finish Registration" to complete.', 'success');
            
        } catch (error) {
            console.error('Capture error:', error);
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

    // Send student data and face image together to the backend database
    async function sendToDatabase(studentData, capturedImageData) {
        try {
            var token = localStorage.getItem("jwtToken");
            
            // Prepare the data to send to the server - includes all registration info plus the face image
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
            
            console.log("Sending complete student data with face image to database...");
            console.log("Payload:", payload);
            
            // Make the API call to save everything
            var response = await fetch(API_BASE_URL + "/admin/create/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? "Bearer " + token : ""
                },
                body: JSON.stringify(payload)
            });
            
            console.log("Response Status:", response.status);
            
            var result = await response.json();
            console.log("Backend Response:", result);
            
            if (response.ok && result.success) {
                return { success: true, data: result, message: "Student registered successfully!" };
            } else {
                return { success: false, message: result.message || "Failed to save student to database" };
            }
            
        } catch (error) {
            console.error("Network Error:", error);
            return { success: false, message: error.message || "Network error. Please check your connection." };
        }
    }

    

    // Show beautiful success popup before redirecting to home page
    function showSuccessPopupAndRedirect(studentData) {
        // Create the popup overlay element
        var popupOverlay = document.createElement('div');
        popupOverlay.className = 'success-popup-overlay';
        
        // Create the popup content
        popupOverlay.innerHTML = `
            <div class="success-popup">
                <div class="success-popup-icon">🎉</div>
                <h2 class="success-popup-title">Registration Complete!</h2>
                <p class="success-popup-message">Your account has been created successfully</p>
                <div class="success-popup-details">
                    <p><strong>Name:</strong> ${studentData.firstName} ${studentData.lastName}</p>
                    <p><strong>Registration Number:</strong> ${studentData.regNumber}</p>
                    <p><strong>Email:</strong> ${studentData.email}</p>
                    <p><strong>Department:</strong> ${studentData.department}</p>
                    <p><strong>Year of Study:</strong> ${studentData.yearOfStudy}</p>
                    <p><strong>Faculty:</strong> ${studentData.faculty}</p>
                </div>
                <div class="success-popup-progress">
                    <div class="progress-bar"></div>
                </div>
                <p class="success-popup-redirect">Redirecting to home page...</p>
            </div>
        `;
        
        // Add the popup to the page
        document.body.appendChild(popupOverlay);
        
        // Add CSS styles for the popup if they don't exist yet
        if (!document.querySelector('#successPopupStyles')) {
            var popupStyles = document.createElement('style');
            popupStyles.id = 'successPopupStyles';
            popupStyles.textContent = `
                .success-popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 20000;
                    animation: fadeInPopup 0.3s ease;
                }
                
                .success-popup {
                    background: white;
                    border-radius: 28px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
                    animation: slideUpPopup 0.5s ease;
                }
                
                .success-popup-icon {
                    font-size: 75px;
                    margin-bottom: 15px;
                    animation: bounceIcon 0.6s ease;
                }
                
                .success-popup-title {
                    font-size: 28px;
                    color: #1f2937;
                    margin-bottom: 10px;
                    font-weight: 700;
                }
                
                .success-popup-message {
                    font-size: 16px;
                    color: #6b7280;
                    margin-bottom: 25px;
                }
                
                .success-popup-details {
                    background: linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%);
                    border-radius: 16px;
                    padding: 18px;
                    margin-bottom: 25px;
                    text-align: left;
                    border: 1px solid #e5e7eb;
                }
                
                .success-popup-details p {
                    margin: 10px 0;
                    font-size: 14px;
                    color: #374151;
                }
                
                .success-popup-details p strong {
                    color: #667eea;
                    min-width: 140px;
                    display: inline-block;
                }
                
                .success-popup-progress {
                    background: #e5e7eb;
                    border-radius: 10px;
                    height: 6px;
                    overflow: hidden;
                    margin-bottom: 15px;
                }
                
                .progress-bar {
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #059669);
                    border-radius: 10px;
                    animation: progressBar 2.5s linear forwards;
                }
                
                .success-popup-redirect {
                    font-size: 13px;
                    color: #9ca3af;
                    margin-top: 10px;
                }
                
                @keyframes fadeInPopup {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUpPopup {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes bounceIcon {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                
                @keyframes progressBar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `;
            document.head.appendChild(popupStyles);
        }
        
        // Stop the camera stream
        if (stream) {
            stream.getTracks().forEach(function(track) { 
                track.stop(); 
            });
        }
        
        // Remove the popup and redirect to home page after 3 seconds
        setTimeout(function() {
            popupOverlay.remove();
            window.location.href = 'index.html';
        }, 3000);
    }

    // Complete the registration process - sends everything to database
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
        
        showMessage('Saving your registration to the database...', 'info');
        
        try {
            // Send student data AND face image together to the backend database
            var dbResult = await sendToDatabase(studentData, capturedImageData);
            
            if (dbResult.success) {
                console.log("Database save successful:", dbResult);
                
                // Prepare complete student data for localStorage backup
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
                    syncedToDatabase: true
                };
                
                // Save to localStorage as backup
                saveToLocalStorage(fullStudentData);
                
                // Show success popup and redirect to home page
                showSuccessPopupAndRedirect(studentData);
                
            } else {
                // Database save failed
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

    // Set up all the event listeners
    if (captureBtn) {
        captureBtn.addEventListener('click', function() {
            captureBtn.style.transform = "scale(0.95)";
            setTimeout(function() {
                captureBtn.style.transform = "";
            }, 200);
            capturePhoto();
        });
    }
    
    if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', capturePhoto);
    }
    
    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }
    
    if (finishBtn) {
        finishBtn.addEventListener('click', completeRegistration);
    }

    // Load student data from registration page and start camera
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