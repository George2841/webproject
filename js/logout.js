
// LOGOUT 


// Where our backend server lives
const API_BASE_URL = "http://localhost:8072/api/v1";

// This function handles the entire logout process
async function logout() {
    //Ask the user if they really want to leave
    const userConfirmed = confirm('Are you sure you want to logout?');
    
    // If they clicked "Cancel", stop here and do nothing
    if (!userConfirmed) {
        return;
    }
    
    // Get the secret token that proves they are logged in
    const token = localStorage.getItem('jwtToken');
    
    // Tell the backend that this token is no longer valid
    try {
        if (token) {
            await fetch(API_BASE_URL + '/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
        }
    } catch (error) {
        // If backend doesn't respond, that's okay - we'll still logout locally
        console.log('Backend logout error (ignoring):', error);
    }
    
    // Remove the secret token from the browser's memory
    localStorage.removeItem('jwtToken');
    
    // Clear any other temporary data sitting in session
    sessionStorage.clear();
    
    // Show a friendly message telling them logout worked
    showLogoutMessage();
    
    // Wait 1 second so they can see the message, then send them to login page
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 1000);
}

// This shows a little popup message that disappears after a few seconds
function showLogoutMessage() {
    // Create a new div element to hold our message
    const toast = document.createElement('div');
    toast.className = 'logout-toast';
    
    // Put the message inside it
    toast.innerHTML = `
        <div class="logout-toast-content">
            <span>✓ You have been logged out successfully!</span>
        </div>
    `;
    
    // Add it to the page so the user can see it
    document.body.appendChild(toast);
    
    // Add some nice styling for the popup if it doesn't exist yet
    if (!document.querySelector('#logoutToastStyles')) {
        const styles = document.createElement('style');
        styles.id = 'logoutToastStyles';
        styles.textContent = `
            .logout-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                animation: slideDown 0.3s ease;
            }
            .logout-toast-content {
                background: #10b981;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            @keyframes slideDown {
                from {
                    top: -50px;
                    opacity: 0;
                }
                to {
                    top: 20px;
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Make the message disappear after 2 seconds
    setTimeout(function() {
        if (toast && toast.parentElement) {
            toast.remove();
        }
    }, 2000);
}

// Find the logout buttons on the page and make them work when clicked
function initLogoutButton() {
    // Look for the logout button in the top navigation bar
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Look for the logout button in the mobile menu
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();  // Stop it from acting like a normal link
            logout();            // Run our logout function instead
        });
    }
}

// When the page finishes loading, set up the logout buttons
document.addEventListener('DOMContentLoaded', initLogoutButton);