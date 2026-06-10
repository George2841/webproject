// SCAN PAGE JAVASCRIPT

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
    var captureBtn = document.getElementById('captureBtn');
    var scanStatus = document.getElementById('scanStatus');
    var studentInfo = document.getElementById('studentInfo');
    var eligibilityInfo = document.getElementById('eligibilityInfo');
    var studentNameSpan = document.getElementById('studentName');
    var eligibilityStatusSpan = document.getElementById('eligibilityStatus');
    var regNumberInput = document.getElementById('regNumberInput');
    var verifyRegBtn = document.getElementById('verifyRegBtn');
    var regErrorMsg = document.getElementById('regErrorMsg');
    var regSuccessMsg = document.getElementById('regSuccessMsg');
    var studentNameDisplay = document.getElementById('studentNameDisplay');
    var verifiedStudentName = document.getElementById('verifiedStudentName');
    
    var stream = null;
    var currentStudent = null;  // Store the verified student
    var capturedImageData = null;
    
    //API CONFIGURATION
    var API_BASE_URL = "http://localhost:8072/api/v1/admin/verify/student";
    
    //DATABASE VERIFICATION FUNCTION
    
   async function verifyFaceWithDatabase() {

    if (!currentStudent || !capturedImageData) {
        return;
    }

    try {

        const token = localStorage.getItem("jwtToken");

        if (!token) {
            scanStatus.textContent = "Login Required";
            scanStatus.className = "status-badge status-error";
            return;
        }

        const payload = {
            regNumber: currentStudent.regNumber,
            image: capturedImageData
        };

        console.log("Face Verification Payload =", payload);

        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log("Response Status =", response.status);

        const text = await response.text();

        console.log("Backend Response =", text);

        let result = {};

        try {
            result = text ? JSON.parse(text) : {};
        } catch (e) {
            console.log("Response is not JSON");
        }

        if (response.ok && result.success && result.match) {

            scanStatus.textContent = "Verified ✓";
            scanStatus.className = "status-badge status-success";

            studentInfo.style.display = "flex";
            eligibilityInfo.style.display = "flex";

            studentNameSpan.textContent =
                currentStudent.firstName +
                " " +
                currentStudent.lastName +
                " (" +
                currentStudent.regNumber +
                ")";

            eligibilityStatusSpan.textContent =
                "Eligible - Examination Access Granted";

            eligibilityStatusSpan.style.color = "#059669";

            await markAttendance(currentStudent.regNumber);

        } else {

            scanStatus.textContent = "Face Verification Failed";
            scanStatus.className = "status-badge status-error";

            console.error("Verification Failed:", result);

            setTimeout(function () {

                scanStatus.textContent = "Ready to Scan";
                scanStatus.className = "status-badge status-waiting";

            }, 3000);
        }

    } catch (error) {

        console.error("Face verification error:", error);

        scanStatus.textContent = "Network Error";
        scanStatus.className = "status-badge status-error";
    }
}
    
    //LOCAL STORAGE VERIFICATION
    function verifyStudentLocally(regNumber) {
        var students = JSON.parse(localStorage.getItem('students') || '[]');
        for (var i = 0; i < students.length; i++) {
            if (students[i].regNumber === regNumber) {
                return { verified: true, student: students[i] };
            }
        }
        return { verified: false, message: "Student not found in local storage" };
    }
    
    //VERIFY STUDENT
    async function verifyStudent(regNumber) {
        // First try database verification
        var dbResult = await verifyStudentWithDatabase(regNumber, null);
        
        if (dbResult.verified) {
            return dbResult;
        } else {
            // Fallback to local storage if database fails
            console.log("Database verification failed, trying local storage...");
            var localResult = verifyStudentLocally(regNumber);
            return localResult;
        }
    }
    
    //REGISTRATION NUMBER VERIFICATION HANDLER
    async function handleVerifyStudent() {
        var regNumber = regNumberInput.value.trim();
        
        if (!regNumber) {
            regErrorMsg.textContent = 'Please enter a registration number';
            regErrorMsg.classList.add('show');
            return;
        }
        
        // Show loading state
        verifyRegBtn.disabled = true;
        verifyRegBtn.textContent = 'Verifying...';
        
        var result = await verifyStudent(regNumber);
        
        if (result.verified) {
            currentStudent = result.student;
            
            // Show success message
            regErrorMsg.classList.remove('show');
            regSuccessMsg.classList.add('show');
            studentNameDisplay.classList.add('show');
            verifiedStudentName.textContent = currentStudent.firstName + ' ' + currentStudent.lastName;
            regNumberInput.classList.remove('error');
            
            // Update scan status
            if (scanStatus) {
                scanStatus.textContent = "Student Verified. Ready to Scan Face";
                scanStatus.className = "status-badge status-success";
            }
            
            // Store verified student in session
            sessionStorage.setItem('verifiedStudent', JSON.stringify(currentStudent));
            
            // Auto-hide success message after 3 seconds
            setTimeout(function() {
                regSuccessMsg.classList.remove('show');
            }, 3000);
        } else {
            // Student not found
            regErrorMsg.textContent = result.message || 'Student not found. Please register first.';
            regErrorMsg.classList.add('show');
            regSuccessMsg.classList.remove('show');
            studentNameDisplay.classList.remove('show');
            regNumberInput.classList.add('error');
            currentStudent = null;
            
            if (scanStatus) {
                scanStatus.textContent = "Student Not Found. Please Register";
                scanStatus.className = "status-badge status-error";
            }
        }
        
        // Reset button
        verifyRegBtn.disabled = false;
        verifyRegBtn.textContent = 'Verify Student';
    }
    
    //CAMERA INITIALIZATION
    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                }
            });
            video.srcObject = stream;
            console.log("Camera initialized successfully");
        } catch (err) {
            console.error("Camera error:", err);
            if (scanStatus) {
                scanStatus.textContent = "Camera Access Denied";
                scanStatus.className = "status-badge status-error";
            }
        }
    }
    
    // CAPTURE PHOTO
    function capturePhoto() {
        if (!currentStudent) {
            if (scanStatus) {
                scanStatus.textContent = "Please verify student first";
                scanStatus.className = "status-badge status-error";
            }
            return;
        }
        
        var ctx = canvas.getContext('2d');
        var videoRect = video.getBoundingClientRect();
        var scanFrame = document.querySelector('.scan-frame');
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
        ctx.arc(circleSize/2, circleSize/2, circleSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, circleX, circleY, circleSize, circleSize, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
        
        if (scanStatus) {
            scanStatus.textContent = "Verifying face with database...";
            scanStatus.className = "status-badge status-waiting";
        }
        
        // Verify face with database
        verifyFaceWithDatabase();
    }
    
    //VERIFY FACE WITH DATABASE
    async function verifyFaceWithDatabase() {
        if (!currentStudent || !capturedImageData) {
            return;
        }
        
        try {
            var payload = {
                regNumber: currentStudent.regNumber,
                image: capturedImageData
            };
            
            console.log("Verifying face with database...");
            
            var response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            console.log("Face verification response:", result);
            
            if (response.ok && result.success && result.match) {
                // Face matched
                if (scanStatus) {
                    scanStatus.textContent = "Verified ✓";
                    scanStatus.className = "status-badge status-success";
                }
                
                if (studentInfo && eligibilityInfo) {
                    studentInfo.style.display = "flex";
                    eligibilityInfo.style.display = "flex";
                    studentNameSpan.textContent = currentStudent.firstName + ' ' + currentStudent.lastName + ' (' + currentStudent.regNumber + ')';
                    eligibilityStatusSpan.textContent = "Eligible - Examination Access Granted";
                    eligibilityStatusSpan.style.color = "#059669";
                }
                
                // Mark attendance in database
                await markAttendance(currentStudent.regNumber);
                
            } else {
                // Face did not match
                if (scanStatus) {
                    scanStatus.textContent = "Face Verification Failed";
                    scanStatus.className = "status-badge status-error";
                }
                
                if (studentInfo && eligibilityInfo) {
                    studentInfo.style.display = "none";
                    eligibilityInfo.style.display = "none";
                }
                
                setTimeout(function() {
                    if (scanStatus) {
                        scanStatus.textContent = "Ready to Scan";
                        scanStatus.className = "status-badge status-waiting";
                    }
                }, 2000);
            }
        } catch (error) {
            console.error("Face verification error:", error);
            if (scanStatus) {
                scanStatus.textContent = "Network Error";
                scanStatus.className = "status-badge status-error";
            }
        }
    }
    
    //MARK ATTENDANCE IN DATABASE
    async function markAttendance(regNumber) {
        try {
            var payload = {
                regNumber: regNumber,
                timestamp: new Date().toISOString(),
                status: "present"
            };
            
            var response = await fetch(API_BASE_URL + "/admin/mark-attendance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            
            var result = await response.json();
            console.log("Attendance marked:", result);
            
        } catch (error) {
            console.error("Attendance marking error:", error);
        }
    }
    
    //CHECK SESSION FOR EXISTING VERIFIED STUDENT
    function checkExistingSession() {
        var savedVerifiedStudent = sessionStorage.getItem('verifiedStudent');
        if (savedVerifiedStudent) {
            var student = JSON.parse(savedVerifiedStudent);
            currentStudent = student;
            regNumberInput.value = student.regNumber;
            verifiedStudentName.textContent = student.firstName + ' ' + student.lastName;
            studentNameDisplay.classList.add('show');
            if (scanStatus) {
                scanStatus.textContent = "Student Verified. Ready to Scan Face";
                scanStatus.className = "status-badge status-success";
            }
        }
    }
    
    //EVENT LISTENERS
    if (captureBtn) {
        captureBtn.addEventListener('click', function() {
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
        regNumberInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleVerifyStudent();
            }
        });
        
        regNumberInput.addEventListener('input', function() {
            regNumberInput.classList.remove('error');
            regErrorMsg.classList.remove('show');
        });
    }
    
    //INITIALIZE
    checkExistingSession();
    initCamera();
    
    // Clean up
    window.addEventListener('beforeunload', function() {
        if (stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
        }
    });
});