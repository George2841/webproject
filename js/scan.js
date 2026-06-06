//SCAN PAGE JAVASCRIPT

// DOM Elements
const video = document.getElementById('videoFeed');
const canvas = document.getElementById('photoCanvas');
const captureBtn = document.getElementById('captureBtn');
const scanStatus = document.getElementById('scanStatus');
const studentInfo = document.getElementById('studentInfo');
const eligibilityInfo = document.getElementById('eligibilityInfo');
const studentNameSpan = document.getElementById('studentName');
const eligibilityStatusSpan = document.getElementById('eligibilityStatus');

// Sample student database (this would come from backend)
const students = [
    { name: "GEORGE OTIENO", id: "BIT/0074/23", course: "IT", eligible: true },
    { name: "EDGAR KIPROTICH", id: "BIT/0022/23", course: "IT", eligible: true },
    { name: "BAHATI MASITSA", id: "BIT/0048/23", course: "Mathematics", eligible: false },
    
];

// Store scan history in localStorage
let scanHistory = [];

//LIVE CLOCK FUNCTION
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    const clockElement = document.getElementById('navClock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

// MOBILE MENU TOGGLE
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

//START CAMERA
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        if (video) {
            video.srcObject = stream;
            updateScanStatus("Camera Ready", "success");
            console.log("Camera started successfully");
        }
        return true;
    } catch (error) {
        console.error("Camera error:", error);
        
        if (error.name === 'NotAllowedError') {
            updateScanStatus("Camera Access Denied - Please allow camera", "error");
            showToast("Please allow camera access to use face scan", "error");
        } else if (error.name === 'NotFoundError') {
            updateScanStatus("No Camera Found", "error");
            showToast("No camera detected on your device", "error");
        } else {
            updateScanStatus("Camera Error - Please refresh", "error");
            showToast("Unable to access camera. Please check your permissions.", "error");
        }
        return false;
    }
}

//UPDATE SCAN STATUS
function updateScanStatus(message, type) {
    if (scanStatus) {
        scanStatus.textContent = message;
        scanStatus.className = `status-badge status-${type}`;
    }
}

//SIMULATE FACE SCAN
async function performFaceScan(imageData) {
    return new Promise((resolve) => {
        // Simulate processing delay (1.5-2.5 seconds)
        const delay = 1500 + Math.random() * 1000;
        
        setTimeout(() => {
            // Generate random confidence between 75% and 99%
            const confidence = (75 + Math.random() * 24).toFixed(1);
            resolve(parseFloat(confidence));
        }, delay);
    });
}

//IDENTIFY STUDENT FROM FACE
async function identifyStudent(confidence) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let selectedStudent = null;
            
            if (confidence >= 85) {
                // High confidence - return a valid student
                const validStudents = students.filter(s => s.eligible);
                selectedStudent = validStudents[Math.floor(Math.random() * validStudents.length)];
            } else if (confidence >= 70) {
                // Medium confidence - random student (could be ineligible)
                selectedStudent = students[Math.floor(Math.random() * students.length)];
            } else {
                // Low confidence - no match found
                selectedStudent = null;
            }
            
            resolve(selectedStudent);
        }, 500);
    });
}

//ADD TO SCAN HISTORY
function addToScanHistory(student, confidence, status) {
    const scanRecord = {
        id: Date.now(),
        dateTime: new Date().toLocaleString(),
        confidence: confidence,
        status: status,
        studentName: student ? student.name : "Unknown",
        studentId: student ? student.id : "N/A"
    };
    
    // Load existing history
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
        scanHistory = JSON.parse(savedHistory);
    }
    
    // Add new record
    scanHistory.unshift(scanRecord);
    
    // Keep only last 50 records
    if (scanHistory.length > 50) {
        scanHistory = scanHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
}

//CAPTURE PHOTO AND ANALYZE
async function captureAndAnalyze() {
    // Check if camera is ready
    if (!video || !video.srcObject) {
        showToast("Camera not ready. Please allow camera access.", "error");
        return;
    }
    
    // Disable button during processing
    if (captureBtn) {
        captureBtn.disabled = true;
        captureBtn.style.opacity = "0.5";
        captureBtn.style.cursor = "not-allowed";
    }
    
    // Add flash effect
    const wrapper = document.querySelector('.video-wrapper');
    if (wrapper) {
        wrapper.style.backgroundColor = 'rgba(255,255,255,0.3)';
        setTimeout(() => {
            wrapper.style.backgroundColor = 'transparent';
        }, 200);
    }
    
    // Update UI to scanning state
    updateScanStatus("Scanning...", "waiting");
    
    if (studentInfo) studentInfo.style.display = "none";
    if (eligibilityInfo) eligibilityInfo.style.display = "none";
    
    // Capture photo from video
    if (canvas && video) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data (for future backend integration)
        const imageData = canvas.toDataURL('image/jpeg');
        console.log("Image captured at:", new Date().toLocaleTimeString());
        
        // Perform face scan simulation
        const confidence = await performFaceScan(imageData);
        
        // Identify student
        const student = await identifyStudent(confidence);
        
        // Display results
        if (student && confidence >= 75) {
            // Successful recognition
            studentNameSpan.textContent = `${student.name} (${student.id}) - ${student.course}`;
            
            if (student.eligible) {
                eligibilityStatusSpan.innerHTML = '<span style="color:#10b981; font-weight:600;">✓ Eligible - Can take exam</span>';
                updateScanStatus(`Verified! ${confidence}% Match`, "success");
                showToast(`Welcome ${student.name}! You are eligible for the exam.`, "success");
                addToScanHistory(student, confidence, "verified");
            } else {
                eligibilityStatusSpan.innerHTML = '<span style="color:#ef4444; font-weight:600;">✗ Not Eligible - Please check requirements</span>';
                updateScanStatus(`Not Eligible - ${confidence}% Match`, "error");
                showToast(`${student.name} is not eligible for this exam.`, "error");
                addToScanHistory(student, confidence, "failed");
            }
            
            if (studentInfo) studentInfo.style.display = "flex";
            if (eligibilityInfo) eligibilityInfo.style.display = "flex";
            
        } else if (confidence >= 70) {
            // Low confidence match
            studentNameSpan.textContent = "Uncertain Match";
            eligibilityStatusSpan.innerHTML = '<span style="color:#f59e0b; font-weight:600;">⚠️ Low confidence - Please scan again with better lighting</span>';
            updateScanStatus(`Low Confidence - ${confidence}%`, "error");
            showToast("Face not clearly recognized. Please ensure good lighting and position.", "warning");
            
            if (studentInfo) studentInfo.style.display = "flex";
            if (eligibilityInfo) eligibilityInfo.style.display = "flex";
            addToScanHistory(null, confidence, "failed");
            
        } else {
            // No match found
            studentNameSpan.textContent = "Student Not Recognized";
            eligibilityStatusSpan.innerHTML = '<span style="color:#ef4444; font-weight:600;">✗ Not found in database</span>';
            updateScanStatus(`Recognition Failed - ${confidence}%`, "error");
            showToast("Student not recognized. Please contact administrator.", "error");
            
            if (studentInfo) studentInfo.style.display = "flex";
            if (eligibilityInfo) eligibilityInfo.style.display = "flex";
            addToScanHistory(null, confidence, "failed");
        }
    }
    
    // Re-enable button
    if (captureBtn) {
        captureBtn.disabled = false;
        captureBtn.style.opacity = "1";
        captureBtn.style.cursor = "pointer";
    }
}

//TOAST NOTIFICATION
function showToast(message, type) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast && toast.parentElement) toast.remove();
    }, 3000);
}

//RESET SCAN FORM
function resetScan() {
    if (studentInfo) studentInfo.style.display = "none";
    if (eligibilityInfo) eligibilityInfo.style.display = "none";
    updateScanStatus("Ready to Scan", "waiting");
    
    if (studentNameSpan) studentNameSpan.textContent = "--";
    if (eligibilityStatusSpan) eligibilityStatusSpan.innerHTML = "--";
    
    showToast("Ready for next scan", "success");
}

//CHECK CAMERA PERMISSION STATUS
async function checkCameraPermission() {
    try {
        const result = await navigator.permissions.query({ name: 'camera' });
        if (result.state === 'granted') {
            console.log("Camera permission already granted");
        } else if (result.state === 'denied') {
            updateScanStatus("Camera Permission Denied", "error");
            showToast("Please enable camera permission in browser settings", "error");
        }
        
        result.addEventListener('change', () => {
            if (result.state === 'granted') {
                startCamera();
            }
        });
    } catch (error) {
        console.log("Permission API not supported");
    }
}

//ADD KEYBOARD SHORTCUT
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Press 'Space' or 'Enter' to capture
        if (event.code === 'Space' || event.code === 'Enter') {
            if (captureBtn && !captureBtn.disabled) {
                event.preventDefault();
                captureAndAnalyze();
            }
        }
        // Press 'R' to reset
        if (event.code === 'KeyR') {
            event.preventDefault();
            resetScan();
        }
    });
}

//INITIALIZE SCAN PAGE
async function initScanPage() {
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Check camera permission
    await checkCameraPermission();
    
    // Start camera
    await startCamera();
    
    // Initialize keyboard shortcuts
    initKeyboardShortcuts();
    
    // Add capture button event listener
    if (captureBtn) {
        captureBtn.addEventListener('click', captureAndAnalyze);
    }
    
    console.log("Scan page initialized");
}

//CLEAN UP ON PAGE UNLOAD
function cleanupScanPage() {
    // Stop camera tracks
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => {
            track.stop();
        });
        video.srcObject = null;
    }
}

//EVENT LISTENERS
window.addEventListener('load', initScanPage);
window.addEventListener('beforeunload', cleanupScanPage);