//HOME PAGE JAVASCRIPT

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get current user data
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Display user information
function displayUserInfo() {
    const user = getCurrentUser();
    
    if (user) {
        // Display user name/email
        const userNameSpan = document.getElementById('userNameDisplay');
        if (userNameSpan) {
            const displayName = user.name || user.email.split('@')[0];
            userNameSpan.textContent = displayName;
        }
        
        // Display user email
        const userEmailSpan = document.getElementById('userEmailDisplay');
        if (userEmailSpan) {
            userEmailSpan.textContent = user.email;
        }
        
        // Display user role
        const userRoleSpan = document.getElementById('userRoleDisplay');
        if (userRoleSpan) {
            let roleText = '';
            switch(user.role) {
                case 'admin':
                    roleText = 'Administrator';
                    break;
                case 'instructor':
                    roleText = 'Instructor';
                    break;
                default:
                    roleText = 'Student';
            }
            userRoleSpan.textContent = roleText;
        }
        
        // Display student ID if applicable
        if (user.studentId) {
            const studentIdSpan = document.getElementById('studentIdDisplay');
            if (studentIdSpan) {
                studentIdSpan.textContent = user.studentId;
            }
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

// Initialize home page
function initHomePage() {
    if (checkAuth()) {
        displayUserInfo();
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', initHomePage);
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

//MOBILE MENU TOGGLE
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

//ANIMATED CONFIDENCE BAR
let confidenceInterval;

function startConfidenceSimulation() {
    let confidence = 0;
    const confidencePct = document.getElementById('confidencePct');
    const confidenceFill = document.getElementById('confidenceFill');
    const studentName = document.getElementById('studentName');
    const eligibilityBadge = document.getElementById('eligibilityBadge');
    
    if (!confidencePct || !confidenceFill) return;
    
    confidenceInterval = setInterval(() => {
        if (confidence < 94.7) {
            confidence += Math.random() * 8;
            if (confidence > 94.7) confidence = 94.7;
            const confidenceValue = confidence.toFixed(1);
            confidencePct.textContent = `${confidenceValue}%`;
            confidenceFill.style.width = `${confidenceValue}%`;
            
            // Update color based on confidence
            if (confidenceValue >= 90) {
                confidenceFill.style.background = "linear-gradient(90deg, #10b981, #34d399)";
            } else if (confidenceValue >= 75) {
                confidenceFill.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
            } else {
                confidenceFill.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
            }
        }
    }, 150);
}

//UPDATE STUDENT INFO AFTER SIMULATION
function updateStudentInfo() {
    setTimeout(() => {
        const studentNameEl = document.getElementById('studentName');
        const eligibilityBadgeEl = document.getElementById('eligibilityBadge');
        
        if (studentNameEl) {
            studentNameEl.textContent = "John Doe";
        }
        if (eligibilityBadgeEl) {
            eligibilityBadgeEl.textContent = "✓ Eligible";
            eligibilityBadgeEl.classList.add('eligible');
        }
    }, 3000);
}

//TOAST NOTIFICATION FUNCTION
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

//WELCOME TOAST ON PAGE LOAD
function showWelcomeMessage() {
    setTimeout(() => {
        showToast('Welcome to FaceGuard Exam Security System', 'success');
    }, 1000);
}

//SMOOTH SCROLL FOR ANCHOR LINKS
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

//ADD ACTIVE CLASS TO CURRENT NAV LINK
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

//CLOSE MOBILE MENU WHEN CLICKING OUTSIDE
function initMobileMenuClose() {
    document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburger = document.getElementById('hamburger');
        
        if (mobileMenu && mobileMenu.classList.contains('show')) {
            if (!mobileMenu.contains(event.target) && !hamburger.contains(event.target)) {
                mobileMenu.classList.remove('show');
            }
        }
    });
}

//INTERSECTION OBSERVER FOR ANIMATIONS
function initScrollAnimations() {
    const elements = document.querySelectorAll('.stat-card, .camera-card, .hero-text');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

//INITIALIZE ALL FUNCTIONS ON PAGE LOAD
function initHomePage() {
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Start confidence simulation
    startConfidenceSimulation();
    
    // Update student info
    updateStudentInfo();
    
    // Show welcome message
    showWelcomeMessage();
    
    // Set active nav link
    setActiveNavLink();
    
    // Initialize mobile menu close
    initMobileMenuClose();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize smooth scroll
    initSmoothScroll();
}

//CLEAN UP ON PAGE UNLOAD 
function cleanupHomePage() {
    if (confidenceInterval) {
        clearInterval(confidenceInterval);
    }
}

//EVENT LISTENERS
window.addEventListener('load', initHomePage);
window.addEventListener('beforeunload', cleanupHomePage);