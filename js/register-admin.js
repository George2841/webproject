//  DASHBOARD PAGE

// DOM Elements
const totalStudentsEl = document.getElementById('totalStudents');
const totalAdminsEl = document.getElementById('totalAdmins');
const verifiedStudentsEl = document.getElementById('verifiedStudents');
const pendingStudentsEl = document.getElementById('pendingStudents');
const adminNameEl = document.getElementById('adminName');
const adminEmailEl = document.getElementById('adminEmail');
const adminRoleEl = document.getElementById('adminRole');
const adminRoleBadge = document.getElementById('adminRoleBadge');
const recentStudentsList = document.getElementById('recentStudentsList');
const recentAdminsList = document.getElementById('recentAdminsList');
const refreshBtn = document.getElementById('refreshBtn');

// Data arrays
let students = [];
let admins = [];

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
    // Load students
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
        students = JSON.parse(savedStudents);
    } else {
        addSampleStudents();
    }
    
    // Load admins
    const savedAdmins = localStorage.getItem('admins');
    if (savedAdmins) {
        admins = JSON.parse(savedAdmins);
    } else {
        addSampleAdmins();
    }
    
    // Load current admin info
    loadAdminInfo();
    
    // Update all dashboard sections
    updateStatistics();
    updateRecentStudents();
    updateRecentAdmins();
    
    // ENSURE REGISTER ADMIN BUTTON IS VISIBLE
    showRegisterAdminButton();
}

//  FORCE SHOW REGISTER ADMIN BUTTON 
function showRegisterAdminButton() {
    // Make sure the Register Admin button is always visible
    const adminButtons = document.querySelectorAll('.action-btn.action-admin');
    const navAdminLink = document.querySelector('.nav-link[href="register-admin.html"]');
    const footerAdminLink = document.querySelector('.footer-link[href="register-admin.html"]');
    const mobileAdminLink = document.querySelector('.mobile-menu a[href="register-admin.html"]');
    
    // Show all admin buttons
    adminButtons.forEach(btn => {
        if (btn) btn.style.display = 'flex';
        if (btn) btn.style.visibility = 'visible';
    });
    
    if (navAdminLink) navAdminLink.style.display = 'block';
    if (footerAdminLink) footerAdminLink.style.display = 'block';
    if (mobileAdminLink) mobileAdminLink.style.display = 'block';
}



//  LOAD ADMIN INFO 
function loadAdminInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (adminNameEl) {
        adminNameEl.textContent = currentUser.name || "Administrator";
    }
    if (adminEmailEl) {
        adminEmailEl.textContent = currentUser.email || "admin@university.ac.ke";
    }
    if (adminRoleEl) {
        adminRoleEl.textContent = currentUser.role === 'super_admin' ? 'Super Administrator' : 'System Administrator';
    }
    if (adminRoleBadge) {
        adminRoleBadge.textContent = currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin';
    }
}

//  UPDATE STATISTICS 
function updateStatistics() {
    const totalStudents = students.length;
    const totalAdmins = admins.length;
    const verifiedStudents = students.filter(s => s.faceImage === true || s.status === 'active').length;
    const pendingStudents = students.filter(s => !s.faceImage || s.status === 'pending_face_capture').length;
    
    animateValue(totalStudentsEl, 0, totalStudents, 500);
    animateValue(totalAdminsEl, 0, totalAdmins, 500);
    animateValue(verifiedStudentsEl, 0, verifiedStudents, 500);
    animateValue(pendingStudentsEl, 0, pendingStudents, 500);
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


//  UPDATE RECENT ADMINS 
function updateRecentAdmins() {
    if (!recentAdminsList) return;
    
    const recentAdmins = [...admins]
        .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
        .slice(0, 5);
    
    if (recentAdmins.length === 0) {
        recentAdminsList.innerHTML = '<tr><td colspan="6" style="text-align: center;">No admins found</td></tr>';
        return;
    }
    
    recentAdminsList.innerHTML = recentAdmins.map(admin => `
        <tr>
            <td>${admin.employeeNumber || 'N/A'}</td>
            <td>${admin.firstName || ''} ${admin.lastName || ''}</td>
            <td>${admin.department || 'N/A'}</td>
            <td>${admin.position || 'Administrator'}</td>
            <td>${admin.email || 'N/A'}</td>
            <td>${new Date(admin.registrationDate).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

//  REFRESH DASHBOARD 
function refreshDashboard() {
    loadDashboardData();
    showToast('Dashboard refreshed successfully!', 'success');
}

//  TOAST NOTIFICATION 
function showToast(message, type) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast && toast.parentElement) toast.remove();
    }, 3000);
}

//  CHECK USER ROLE 
function checkUserRole() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRoleSpan = document.getElementById('userRole');
    
    if (userRoleSpan) {
        if (currentUser.role === 'super_admin') {
            userRoleSpan.textContent = 'Super Admin';
        } else if (currentUser.role === 'admin') {
            userRoleSpan.textContent = 'Admin';
        } else {
            userRoleSpan.textContent = 'User';
        }
    }
}

//  INITIALIZE DASHBOARD 
function initDashboard() {
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Load dashboard data
    loadDashboardData();
    
    // Check user role
    checkUserRole();
    
    // Make sure Register Admin button is visible
    showRegisterAdminButton();
    
    // Add refresh button event
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }
    
    console.log("Dashboard initialized successfully");
    console.log("Register Admin button visibility forced");
}

//  EVENT LISTENERS 
window.addEventListener('load', initDashboard);