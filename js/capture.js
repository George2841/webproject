//FACE CAPTURE PAGE JAVASCRIPT
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    //CLOCK/TIMER FUNCTIONALITY
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        
        const navClock = document.getElementById('navClock');
        if (navClock) {
            navClock.textContent = timeString;
        }
    }
    
    // Update clock every second
    setInterval(updateClock, 1000);
    updateClock();
    
    //DOM ELEMENTS
    const video = document.getElementById('videoFeed');
    const canvas = document.getElementById('photoCanvas');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const finishBtn = document.getElementById('finishBtn');
    const previewImage = document.getElementById('previewImage');
    const capturedPreview = document.getElementById('capturedPreview');
    const messageBox = document.getElementById('messageBox');
    const manualCaptureBtn = document.getElementById('captureBtn');
    
    let stream = null;
    let capturedImageData = null;
    let studentData = null;
    
    //MOBILE MENU TOGGLE
    window.toggleMenu = function() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('show');
        }
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburger = document.getElementById('hamburger');
        
        if (mobileMenu && mobileMenu.classList.contains('show')) {
            if (hamburger && !hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.remove('show');
            }
        }
    });
    
    //LOAD STUDENT DATA FROM LOCALSTORAGE
    function loadStudentData() {
        try {
            const studentData = JSON.parse(localStorage.getItem('studentData'));
            
           
            
            // Display student information
            const displayName = document.getElementById('displayName');
            const displayRegNumber = document.getElementById('displayRegNumber');
            
            if (displayName) {
                displayName.textContent = studentData.firstName + ' ' + studentData.lastName;
            }
            if (displayRegNumber) {
                displayRegNumber.textContent = studentData.regNumber;
            }
            
            return true;
        } catch (error) {
            console.error('Error loading student data:', error);
            showMessage('Error loading student data. Please register again.', 'error');
            setTimeout(function() {
                window.location.href = 'registration.html';
            }, 2000);
            return false;
        }
    }
    
    //SHOW MESSAGE FUNCTION
    function showMessage(message, type) {
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = 'message ' + type;
            messageBox.style.display = 'block';
            
            // Auto hide after 3 seconds for info messages
            if (type === 'info') {
                setTimeout(function() {
                    if (messageBox) {
                        messageBox.style.display = 'none';
                    }
                }, 3000);
            }
        }
    }
    
    function hideMessage() {
        if (messageBox) {
            messageBox.style.display = 'none';
            messageBox.className = 'message';
        }
    }
    
    //CAMERA INITIALIZATION
    async function initCamera() {
        try {
            const streamResult = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                }
            });
            stream = streamResult;
            if (video) {
                video.srcObject = stream;
            }
            showMessage('Camera ready. Center your face in the circle.', 'info');
        } catch (err) {
            console.error("Camera error:", err);
            
            if (err.name === 'NotAllowedError') {
                showMessage('Camera access denied. Please allow camera access and refresh the page.', 'error');
            } else if (err.name === 'NotFoundError') {
                showMessage('No camera found. Please connect a camera and refresh the page.', 'error');
            } else {
                showMessage('Unable to access camera. Please check your camera settings.', 'error');
            }
        }
    }
    
    //STOP CAMERA STREAM
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
            stream = null;
        }
    }
    
    //CAPTURE PHOTO (Only face area from circle)
    function capturePhoto() {
        if (!video || !video.srcObject || !stream) {
            showMessage('Camera not ready. Please wait...', 'error');
            return;
        }
        
        try {
            const ctx = canvas.getContext('2d');
            
            // Get video and overlay dimensions
            const videoRect = video.getBoundingClientRect();
            const scanFrame = document.querySelector('.scan-frame');
            
            if (!scanFrame) {
                showMessage('Scanner frame not found. Please refresh the page.', 'error');
                return;
            }
            
            const overlayRect = scanFrame.getBoundingClientRect();
            
            // Calculate scale factors
            const scaleX = video.videoWidth / videoRect.width;
            const scaleY = video.videoHeight / videoRect.height;
            
            // Calculate circle position and size
            const circleX = (overlayRect.left - videoRect.left) * scaleX;
            const circleY = (overlayRect.top - videoRect.top) * scaleY;
            const circleSize = overlayRect.width * scaleX;
            
            // Set canvas dimensions
            canvas.width = circleSize;
            canvas.height = circleSize;
            
            // Draw only the circular area
            ctx.save();
            ctx.beginPath();
            ctx.arc(circleSize / 2, circleSize / 2, circleSize / 2, 0, Math.PI * 2);
            ctx.clip();
            
            // Mirror the image
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, circleX, circleY, circleSize, circleSize, 0, 0, canvas.width, canvas.height);
            
            ctx.restore();
            
            // Add border to captured image
            ctx.beginPath();
            ctx.arc(circleSize / 2, circleSize / 2, circleSize / 2 - 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Save captured image data
            capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
            
            const payload = {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                regNumber: studentData.regNumber,
                studentEmail: studentData.studentEmail,
                department: studentData.department,
                faculty: studentData.faculty,
                yearOfStudy: studentData.yearOfStudy,
                image: capturedImageData
            };


             fetch("http://localhost:8072/api/v1/admin/create/student",{
                method: "POST",
                headers: {
                    "Content-Type": "application/json"

                },
                body: JSON.stringify(payload)

             })








            
            // Show preview
            if (previewImage) {
                previewImage.src = capturedImageData;
            }
            if (capturedPreview) {
                capturedPreview.style.display = 'block';
            }
            
            // Update button visibility
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
            if (retakeBtn) retakeBtn.style.display = 'block';
            if (finishBtn) finishBtn.style.display = 'block';
            
            showMessage('Face captured successfully! Click "Complete Registration" to finish.', 'success');
            
        } catch (error) {
            console.error('Capture error:', error);
            showMessage('Error capturing face. Please try again.', 'error');
        }
    }
    
    //RETAKE PHOTO
    function retakePhoto() {
        // Reset captured data
        capturedImageData = null;
        
        // Hide preview
        if (capturedPreview) {
            capturedPreview.style.display = 'none';
        }
        if (previewImage) {
            previewImage.src = '';
        }
        
        // Reset button visibility
        if (capturePhotoBtn) capturePhotoBtn.style.display = 'block';
        if (retakeBtn) retakeBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
        
        // Hide message
        hideMessage();
        
        showMessage('Position your face in the circle and capture again.', 'info');
    }
    
    //VALIDATE FACE IMAGE
    function validateFaceImage(imageData) {
        return new Promise(function(resolve) {
            var img = new Image();
            img.onload = function() {
                // Check if image has content (not empty/black)
                var tempCanvas = document.createElement('canvas');
                var tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                tempCtx.drawImage(img, 0, 0);
                
                var imageDataObj = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                var data = imageDataObj.data;
                
                // Check if image has any non-black pixels
                var hasContent = false;
                for (var i = 0; i < data.length; i += 4) {
                    if (data[i] > 10 || data[i+1] > 10 || data[i+2] > 10) {
                        hasContent = true;
                        break;
                    }
                }
                
                resolve(hasContent);
            };
            img.onerror = function() {
                resolve(false);
            };
            img.src = imageData;
        });
    }
    
    //SAVE STUDENT WITH FACE IMAGE
    async function completeRegistration() {
        if (!capturedImageData) {
            showMessage('Please capture your face first!', 'error');
            return;
        }
        
        // Validate face image
        var isValidImage = await validateFaceImage(capturedImageData);
        if (!isValidImage) {
            showMessage('Invalid face image. Please retake your photo.', 'error');
            retakePhoto();
            return;
        }
        
        if (finishBtn) {
            finishBtn.disabled = true;
            finishBtn.textContent = 'Saving...';
        }
        
        try {
            // Get existing students or create new array
            var students = JSON.parse(localStorage.getItem('students') || '[]');
            
            // Check if student already exists
            var existingIndex = -1;
            for (var i = 0; i < students.length; i++) {
                if (students[i].email === studentData.email) {
                    existingIndex = i;
                    break;
                }
            }
            
            // Create full student data object
            var fullStudentData = {
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                regNumber: studentData.regNumber,
                email: studentData.email,
                password: studentData.password,
                department: studentData.department,
                yearOfStudy: studentData.yearOfStudy,
                faculty: studentData.faculty,
                faceImage: capturedImageData,
                faceEncoding: null,
                registrationDate: new Date().toISOString(),
                status: 'active',
                lastLogin: null
            };
            
            if (existingIndex >= 0) {
                // Update existing student with face image
                students[existingIndex] = fullStudentData;
                showMessage('Student data updated successfully!', 'success');
            } else {
                students.push(fullStudentData);
                showMessage('Registration completed successfully!', 'success');
            }
            
            // Save to localStorage
            localStorage.setItem('students', JSON.stringify(students));
            
            // Also store current user session
            var userSession = {
                email: studentData.email,
                name: studentData.firstName + ' ' + studentData.lastName,
                regNumber: studentData.regNumber,
                role: 'student',
                loginTime: new Date().toISOString(),
                hasFaceImage: true
            };
            localStorage.setItem('currentUser', JSON.stringify(userSession));
            localStorage.setItem('isLoggedIn', 'true');
            
            // Clear temporary data
            localStorage.removeItem('tempStudentData');
            
            // Stop camera
            stopCamera();
            
            // Redirect to dashboard after 2 seconds
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Error saving registration. Please try again.', 'error');
            if (finishBtn) {
                finishBtn.disabled = false;
                finishBtn.textContent = '✓ Complete Registration & Continue';
            }
        }
    }
    
    //EVENT LISTENERS
    if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', capturePhoto);
    }
    
    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }
    
    if (finishBtn) {
        finishBtn.addEventListener('click', completeRegistration);
    }
    
    // Manual capture button in video wrapper
    if (manualCaptureBtn) {
        manualCaptureBtn.addEventListener('click', capturePhoto);
    }
    
    //PREVENT ACCIDENTAL PAGE REFRESH
    window.addEventListener('beforeunload', function(e) {
        if (capturedImageData && finishBtn && finishBtn.style.display !== 'none') {
            // Registration in progress, show warning
            e.preventDefault();
            e.returnValue = 'Registration in progress. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
    
    //INITIALIZE PAGE
    var dataLoaded = loadStudentData();
    if (dataLoaded !== false) {
        initCamera();
    }
    
    // CLEAN UP ON PAGE UNLOAD
    window.addEventListener('beforeunload', function() {
        stopCamera();
    });
    
    //LOG FOR DEBUGGING
    console.log('Face capture page loaded successfully');
});