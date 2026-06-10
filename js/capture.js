// This page handles face capture for exam verification
// It compares the student's current face with the image stored in the database during registration

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
    var scanStatus = document.getElementById('scanStatus');          // Where we show verification status
    var studentNameSpan = document.getElementById('studentName');    // Shows student name after verification
    var eligibilityStatusSpan = document.getElementById('eligibilityStatus'); // Shows eligibility
    var regNumberInput = document.getElementById('regNumberInput');  // Input field for registration number
    var verifyRegBtn = document.getElementById('verifyRegBtn');      // Button to verify registration number
    var regErrorMsg = document.getElementById('regErrorMsg');        // Error message for wrong reg number
    var regSuccessMsg = document.getElementById('regSuccessMsg');    // Success message for verified reg number
    var studentNameDisplay = document.getElementById('studentNameDisplay'); // Shows student name after reg verification
    var verifiedStudentName = document.getElementById('verifiedStudentName'); // Name display element

    // Variables to store data while the page is active
    var stream = null;           // The camera stream
    var currentStudent = null;   // Stores the student info after registration number is verified
    var capturedImageData = null; // Stores the captured face image as base64

    // Backend API address - change this to match your server
    var API_BASE_URL = "http://localhost:8072/api/v1";

    // Helper function to show messages to the user
    function showMessage(message, type) {
        var messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = 'message ' + type;
            messageBox.style.display = 'block';
            // Make the message disappear after 3 seconds
            setTimeout(function() {
                if (messageBox) messageBox.style.display = 'none';
            }, 3000);
        }
    }

    // This function asks the backend to check if the student exists by registration number
    async function verifyStudentWithDatabase(regNumber) {
        try {
            var token = localStorage.getItem("jwtToken");
            
            console.log("Checking student with registration number:", regNumber);
            
            var response = await fetch(API_BASE_URL + "/admin/get/student/" + regNumber, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? "Bearer " + token : ""
                }
            });
            
            var result = await response.json();
            console.log("Student verification response:", result);
            
            if (response.ok && result.success) {
                return { verified: true, student: result.data || result.student };
            } else {
                return { verified: false, message: result.message || "Student not found" };
            }
        } catch (error) {
            console.error("Network error:", error);
            return { verified: false, message: "Network error. Please check your connection." };
        }
    }

    // Handle the registration number verification when user clicks the verify button
    async function handleVerifyStudent() {
        var regNumber = regNumberInput.value.trim();
        
        if (!regNumber) {
            regErrorMsg.textContent = 'Please enter a registration number';
            regErrorMsg.classList.add('show');
            return;
        }
        
        // Show loading state on the button
        verifyRegBtn.disabled = true;
        verifyRegBtn.textContent = 'Verifying...';
        
        // Ask the backend to verify this student
        var result = await verifyStudentWithDatabase(regNumber);
        
        if (result.verified) {
            // Student found - store their info
            currentStudent = result.student;
            
            // Update the UI to show success
            regErrorMsg.classList.remove('show');
            regSuccessMsg.classList.add('show');
            studentNameDisplay.classList.add('show');
            verifiedStudentName.textContent = currentStudent.firstName + ' ' + currentStudent.lastName;
            regNumberInput.classList.remove('error');
            
            // Update the scan status
            if (scanStatus) {
                scanStatus.textContent = "Student verified. Please look at the camera and capture your face";
                scanStatus.className = "status-badge status-success";
            }
            
            // Store the verified student in session storage so we don't have to verify again
            sessionStorage.setItem('verifiedStudent', JSON.stringify(currentStudent));
            
            // Hide the success message after 3 seconds
            setTimeout(function() {
                regSuccessMsg.classList.remove('show');
            }, 3000);
        } else {
            // Student not found in the database
            regErrorMsg.textContent = result.message || 'Student not found. Please register first.';
            regErrorMsg.classList.add('show');
            regSuccessMsg.classList.remove('show');
            studentNameDisplay.classList.remove('show');
            regNumberInput.classList.add('error');
            currentStudent = null;
            
            if (scanStatus) {
                scanStatus.textContent = "Student not found. Please register";
                scanStatus.className = "status-badge status-error";
            }
        }
        
        // Reset the button
        verifyRegBtn.disabled = false;
        verifyRegBtn.textContent = 'Verify Student';
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
        } catch (err) {
            console.error("Camera error:", err);
            showMessage('Camera access denied. Please allow camera access and refresh the page.', 'error');
        }
    }

    // Capture the face from the video feed - only the circular area
    function capturePhoto() {
        // Make sure we have a verified student before allowing face capture
        if (!currentStudent) {
            showMessage('Please verify your registration number first', 'error');
            return;
        }
        
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
            
            // Save the captured image as base64 so we can send it to the server
            capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Update the UI
            if (scanStatus) {
                scanStatus.textContent = "Face captured. Verifying with database...";
                scanStatus.className = "status-badge status-waiting";
            }
            
            // Now compare this face with the one stored in the database
            compareFaceWithDatabase();
            
        } catch (error) {
            console.error('Capture error:', error);
            showMessage('Error capturing face. Please try again.', 'error');
        }
    }

    // This function sends the captured face to the backend and asks it to compare with the stored image
    async function compareFaceWithDatabase() {
        if (!currentStudent || !capturedImageData) {
            showMessage('Missing student information or face image', 'error');
            return;
        }
        
        try {
            var token = localStorage.getItem("jwtToken");
            
            // Prepare the data to send to the server
            var payload = {
                regNumber: currentStudent.regNumber || currentStudent.regNumber,
                image: capturedImageData
            };
            
            console.log("Comparing face for student:", currentStudent.regNumber);
            
            // Send to backend for face comparison
            var response = await fetch(API_BASE_URL + "/admin/verify/face", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? "Bearer " + token : ""
                },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            console.log("Face comparison response:", result);
            
            if (response.ok && result.success && result.match === true) {
                // Face matched successfully
                if (scanStatus) {
                    scanStatus.textContent = "Verified - Student matches database record";
                    scanStatus.className = "status-badge status-success";
                }
                
                // Show student information
                var studentInfo = document.getElementById('studentInfo');
                var eligibilityInfo = document.getElementById('eligibilityInfo');
                
                if (studentInfo) studentInfo.style.display = "flex";
                if (eligibilityInfo) eligibilityInfo.style.display = "flex";
                if (studentNameSpan) studentNameSpan.textContent = currentStudent.firstName + ' ' + currentStudent.lastName + ' (' + currentStudent.regNumber + ')';
                if (eligibilityStatusSpan) {
                    eligibilityStatusSpan.textContent = "Eligible - Examination Access Granted";
                    eligibilityStatusSpan.style.color = "#059669";
                }
                
                // Mark attendance in the database
                await markAttendance(currentStudent.regNumber);
                
                showMessage('Face verified successfully! You are eligible for the exam.', 'success');
                
            } else {
                // Face did not match
                if (scanStatus) {
                    scanStatus.textContent = "Verification Failed - Face does not match records";
                    scanStatus.className = "status-badge status-error";
                }
                
                var studentInfo = document.getElementById('studentInfo');
                var eligibilityInfo = document.getElementById('eligibilityInfo');
                
                if (studentInfo) studentInfo.style.display = "none";
                if (eligibilityInfo) eligibilityInfo.style.display = "none";
                
                showMessage('Face verification failed. Please make sure you are the registered student.', 'error');
                
                // Reset after 3 seconds so they can try again
                setTimeout(function() {
                    if (scanStatus) {
                        scanStatus.textContent = "Ready to scan";
                        scanStatus.className = "status-badge status-waiting";
                    }
                    capturedImageData = null;
                }, 3000);
            }
            
        } catch (error) {
            console.error("Face comparison error:", error);
            showMessage('Network error. Please check your connection.', 'error');
            if (scanStatus) {
                scanStatus.textContent = "Network error - Please try again";
                scanStatus.className = "status-badge status-error";
            }
        }
    }

    // Mark attendance in the database after successful face verification
    async function markAttendance(regNumber) {
        try {
            var token = localStorage.getItem("jwtToken");
            
            var payload = {
                regNumber: regNumber,
                timestamp: new Date().toISOString(),
                status: "present"
            };
            
            var response = await fetch(API_BASE_URL + "/admin/mark-attendance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? "Bearer " + token : ""
                },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            console.log("Attendance marked:", result);
            
        } catch (error) {
            console.error("Attendance marking error:", error);
            
        }
    }

    // Check if we already have a verified student in session 
    function checkExistingSession() {
        var savedVerifiedStudent = sessionStorage.getItem('verifiedStudent');
        if (savedVerifiedStudent) {
            var student = JSON.parse(savedVerifiedStudent);
            currentStudent = student;
            regNumberInput.value = student.regNumber;
            verifiedStudentName.textContent = student.firstName + ' ' + student.lastName;
            studentNameDisplay.classList.add('show');
            if (scanStatus) {
                scanStatus.textContent = "Student verified. Please look at the camera and capture your face";
                scanStatus.className = "status-badge status-success";
            }
        }
    }

    // Set up all the event listeners for buttons
    if (captureBtn) {
        captureBtn.addEventListener('click', function() {
            // Add click animation
            captureBtn.style.transform = "scale(0.95)";
            setTimeout(function() {
                captureBtn.style.transform = "";
            }, 200);
            capturePhoto();
        });
    }
    
    if (verifyRegBtn) {
        verifyRegBtn.addEventListener('click', handleVerifyStudent);
    }
    
    if (regNumberInput) {
        // Allow pressing Enter to verify
        regNumberInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleVerifyStudent();
            }
        });
        
        // Clear error styling when user starts typing
        regNumberInput.addEventListener('input', function() {
            regNumberInput.classList.remove('error');
            regErrorMsg.classList.remove('show');
        });
    }

    // Check if we already have a student from before
    checkExistingSession();
    
    // Start the camera
    initCamera();
    
    // Clean up the camera when leaving the page to save resources
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(function(track) { 
                track.stop(); 
            });
        }
    });
    
});