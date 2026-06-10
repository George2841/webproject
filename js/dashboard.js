//  DASHBOARD PAGE JAVASCRIPT 

// DOM Elements
const totalScansEl = document.getElementById('totalScans');
const verifiedScansEl = document.getElementById('verifiedScans');
const failedScansEl = document.getElementById('failedScans');
const eligibilityRateEl = document.getElementById('eligibilityRate');
const studentNameEl = document.getElementById('studentName');
const studentIdEl = document.getElementById('studentId');
const studentCourseEl = document.getElementById('studentCourse');
const eligibilityBadgeEl = document.getElementById('eligibilityBadge');
const scansListEl = document.getElementById('scansList');
const refreshBtn = document.getElementById('refreshBtn');

// Scan history data
let scanHistory = [];



//  LIVE CLOCK FUNCTION 
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const clockElement = document.getElementById('navClock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

//  MOBILE MENU TOGGLE 
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('show');
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

//  LOAD DATA FROM LOCALSTORAGE 
function loadDashboardData() {
    // Load scan history from localStorage
    const savedScans = localStorage.getItem('scanHistory');
    if (savedScans) {
        scanHistory = JSON.parse(savedScans);
    } else {
        // Add sample data if no history exists
        addSampleData();
    }
    
    // Load student info from localStorage
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
        currentStudent = JSON.parse(savedStudent);
    }
    
    // Try to get current user from login session
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.name) {
        currentStudent.name = currentUser.name;
        currentStudent.email = currentUser.email;
        if (currentUser.regNumber) {
            currentStudent.id = currentUser.regNumber;
        }
    }
    
    // Update all dashboard sections
    updateStatistics();
    updateStudentInfo();
    updateScansTable();
}



//  UPDATE STATISTICS CARDS 
function updateStatistics() {
    const totalScans = scanHistory.length;
    const verifiedScans = scanHistory.filter(scan => scan.status === 'verified').length;
    const failedScans = scanHistory.filter(scan => scan.status === 'failed').length;
    const eligibilityRate = totalScans > 0 ? ((verifiedScans / totalScans) * 100).toFixed(1) : 0;
    
    // Animate counter effect
    animateValue(totalScansEl, 0, totalScans, 500);
    animateValue(verifiedScansEl, 0, verifiedScans, 500);
    animateValue(failedScansEl, 0, failedScans, 500);
    
    if (eligibilityRateEl) {
        eligibilityRateEl.textContent = eligibilityRate + '%';
    }
}

//  ANIMATE NUMBER COUNTER 
function animateValue(element, start, end, duration) {
    if (!element) return;
    
    const startTime = performance.now();
    const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(start + (end - start) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    };
    
    requestAnimationFrame(updateCounter);
}

//  UPDATE STUDENT INFORMATION 
function updateStudentInfo() {
    if (studentNameEl) studentNameEl.textContent = currentStudent.name;
    if (studentIdEl) studentIdEl.textContent = currentStudent.id;
    if (studentCourseEl) studentCourseEl.textContent = currentStudent.course;
    
    if (eligibilityBadgeEl) {
        if (currentStudent.eligible) {
            eligibilityBadgeEl.textContent = "✓ Eligible";
            eligibilityBadgeEl.className = "eligibility-badge eligible";
        } else {
            eligibilityBadgeEl.textContent = "✗ Not Eligible";
            eligibilityBadgeEl.className = "eligibility-badge not-eligible";
        }
    }
}

//  UPDATE SCANS HISTORY TABLE 
function updateScansTable() {
    if (!scansListEl) return;
    
    if (scanHistory.length === 0) {
        scansListEl.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem;">
                    No scan history available. Complete your first face scan!
                </td>
            </tr>
        `;
        return;
    }
    
    // Display last 10 scans (most recent first)
    const recentScans = [...scanHistory].reverse().slice(0, 10);
    
    scansListEl.innerHTML = recentScans.map(scan => `
        <tr>
            <td>${scan.dateTime}</td>
            <td>${scan.studentName}</td>
            <td>${scan.studentId}</td>
            <td>
                <div class="confidence-bar">
                    <span class="confidence-value">${scan.confidence}%</span>
                    <div class="confidence-track">
                        <div class="confidence-fill" style="width: ${scan.confidence}%; background: ${getConfidenceColor(scan.confidence)}"></div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${scan.status === 'verified' ? 'status-success' : 'status-error'}">
                    ${scan.status === 'verified' ? 'Verified' : 'Failed'}
                </span>
            </td>
            <td>
                <button class="btn-view" onclick="viewScanDetails(${scan.id})">
                    View Details
                </button>
            </td>
        </tr>
    `).join('');
}

//  GET CONFIDENCE BAR COLOR 
function getConfidenceColor(confidence) {
    if (confidence >= 85) return '#10b981';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
}

//  VIEW SCAN DETAILS 
function viewScanDetails(scanId) {
    const scan = scanHistory.find(s => s.id === scanId);
    if (!scan) return;
    
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'scan-modal';
    modal.innerHTML = `
        <div class="scan-modal-content">
            <div class="scan-modal-header">
                <h3>Scan Details</h3>
                <button class="modal-close" onclick="this.closest('.scan-modal').remove()">&times;</button>
            </div>
            <div class="scan-modal-body">
                <div class="detail-row">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value">${scan.dateTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Student Name:</span>
                    <span class="detail-value">${scan.studentName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Student ID:</span>
                    <span class="detail-value">${scan.studentId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Confidence Score:</span>
                    <span class="detail-value ${scan.confidence >= 75 ? 'text-success' : 'text-error'}">${scan.confidence}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">
                        <span class="status-badge ${scan.status === 'verified' ? 'status-success' : 'status-error'}">
                            ${scan.status === 'verified' ? 'Verified' : 'Failed'}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles if not exists
    if (!document.querySelector('#modalStyles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'modalStyles';
        modalStyles.textContent = `
            .scan-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            .scan-modal-content {
                background: white;
                border-radius: 16px;
                max-width: 450px;
                width: 90%;
                max-height: 80vh;
                overflow: auto;
                animation: slideUp 0.3s ease;
            }
            .scan-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            }
            .scan-modal-header h3 {
                color: #1f2937;
                margin: 0;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
            }
            .modal-close:hover {
                color: #dc2626;
            }
            .scan-modal-body {
                padding: 1.5rem;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 0;
                border-bottom: 1px solid #f3f4f6;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #4a5568;
            }
            .detail-value {
                color: #1f2937;
            }
            .text-success {
                color: #10b981;
                font-weight: 600;
            }
            .text-error {
                color: #ef4444;
                font-weight: 600;
            }
            .confidence-bar {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .confidence-value {
                font-size: 0.75rem;
                font-weight: 600;
                min-width: 40px;
            }
            .confidence-track {
                flex: 1;
                height: 6px;
                background: #e5e7eb;
                border-radius: 3px;
                overflow: hidden;
            }
            .confidence-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(modalStyles);
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

//  REFRESH DASHBOARD 
function refreshDashboard() {
    // Reload data from localStorage
    const savedScans = localStorage.getItem('scanHistory');
    if (savedScans) {
        scanHistory = JSON.parse(savedScans);
    }
    
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
        currentStudent = JSON.parse(savedStudent);
    }
    
    // Update all sections
    updateStatistics();
    updateStudentInfo();
    updateScansTable();
    
    showToast('Dashboard refreshed successfully!', 'success');
}

//  EXPORT DATA AS CSV 
function exportDashboardData() {
    const headers = ['Date & Time', 'Student Name', 'Student ID', 'Confidence (%)', 'Status'];
    const csvData = scanHistory.map(scan => [
        scan.dateTime,
        scan.studentName,
        scan.studentId,
        scan.confidence,
        scan.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
}

// CLEAR ALL SCAN HISTORY 
function clearScanHistory() {
    if (confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
        localStorage.removeItem('scanHistory');
        scanHistory = [];
        updateStatistics();
        updateScansTable();
        showToast('Scan history cleared successfully!', 'success');
    }
}

//  TOAST NOTIFICATION 
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
    
    // Add toast styles if not exists
    if (!document.querySelector('#toastStyles')) {
        const toastStyles = document.createElement('style');
        toastStyles.id = 'toastStyles';
        toastStyles.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 12px 20px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10001;
                animation: slideInRight 0.3s ease;
            }
            .toast-notification.success {
                border-left: 4px solid #10b981;
            }
            .toast-notification.error {
                border-left: 4px solid #ef4444;
            }
            .toast-notification button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #999;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(toastStyles);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast && toast.parentElement) toast.remove();
    }, 3000);
}

//  ADD EXPORT AND CLEAR BUTTONS 
function addDashboardButtons() {
    const sectionHeader = document.querySelector('.dashboard-section .section-header');
    if (sectionHeader && !document.querySelector('.dashboard-actions')) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'dashboard-actions';
        actionsDiv.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="exportDashboardData()">
                Export Data
            </button>
            <button class="btn btn-outline btn-sm" onclick="clearScanHistory()" style="border-color: #ef4444; color: #ef4444;">
                Clear History
            </button>
            <a href="register-admin.html" class="btn btn-outline btn-sm" style="border-color: #f59e0b; color: #f59e0b;">
                Register Admin
            </a>
        `;
        sectionHeader.appendChild(actionsDiv);
    }
}

//  CHECK USER ROLE 
function checkUserRole() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRoleSpan = document.getElementById('userRole');
    const registerAdminLinks = document.querySelectorAll('a[href="register-admin.html"]');
    
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
        if (userRoleSpan) {
            userRoleSpan.textContent = currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin';
        }
        // Show admin registration links
        registerAdminLinks.forEach(link => {
            link.style.display = 'inline-block';
        });
    } else {
        if (userRoleSpan) {
            userRoleSpan.textContent = 'Student';
        }
        // Hide admin registration for regular students
        registerAdminLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}

//  UPDATE EXAMS LIST 
function updateExamsList() {
    const examsListEl = document.getElementById('examsList');
    if (!examsListEl) return;
    
   
    
    examsListEl.innerHTML = exams.map(exam => `
        <tr>
            <td>${exam.name}</td>
            <td>${exam.date}</td>
            <td>${exam.time}</td>
            <td>${exam.venue}</td>
            <td><span class="status-badge status-upcoming">Upcoming</span></td>
        </tr>
    `).join('');
}

//  INITIALIZE DASHBOARD 
function initDashboard() {
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Load dashboard data
    loadDashboardData();
    
    // Update exams list
    updateExamsList();
    
    // Add export and clear buttons
    addDashboardButtons();
    
    // Check user role
    checkUserRole();
    
    // Add refresh button event
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }
    
    console.log("Dashboard initialized successfully");
}

// EVENT LISTENERS 
window.addEventListener('load', initDashboard);