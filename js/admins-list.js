
// ADMIN LIST PAGE - Manages all administrator records


// Wait for the page to fully load before running any code
document.addEventListener('DOMContentLoaded', function() {
    
    
    // CLOCK FUNCTION - Shows current time in the navigation bar
    
    function updateClock() {
        var now = new Date();                           // Get current date and time
        var hours = String(now.getHours()).padStart(2, '0');     // Get hours (with leading zero)
        var minutes = String(now.getMinutes()).padStart(2, '0');   // Get minutes (with leading zero)
        var seconds = String(now.getSeconds()).padStart(2, '0');   // Get seconds (with leading zero)
        var timeString = hours + ':' + minutes + ':' + seconds;     // Format as HH:MM:SS
        
        var clockElement = document.getElementById('navClock');
        if (clockElement) {
            clockElement.textContent = timeString;      // Update the clock display
        }
    }
    
    // Update the clock every second (1000 milliseconds)
    setInterval(updateClock, 1000);
    updateClock();  // Call once immediately so it doesn't wait a second
    
    
    // MOBILE MENU - Handles the hamburger menu on small screens
    
    window.toggleMenu = function() {
        var mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('show');  // Show or hide the mobile menu
        }
    }
    
    // Close the mobile menu when user clicks anywhere outside of it
    document.addEventListener('click', function(event) {
        var mobileMenu = document.getElementById('mobileMenu');
        var hamburger = document.getElementById('hamburger');
        
        // If mobile menu is open and click is outside both menu and hamburger button, close it
        if (mobileMenu && mobileMenu.classList.contains('show')) {
            if (hamburger && !hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.remove('show');
            }
        }
    });
    
    
    // 3. DOM ELEMENTS - Get references to all HTML elements we'll need
    
    var adminsTableBody = document.getElementById('adminsTableBody');  // Table body where admins are listed
    var searchInput = document.getElementById('searchInput');          // Search box input field
    var statsSummary = document.getElementById('statsSummary');        // Area showing statistics
    var prevPageBtn = document.getElementById('prevPage');             // Previous page button
    var nextPageBtn = document.getElementById('nextPage');             // Next page button
    var pageInfo = document.getElementById('pageInfo');                // Shows current page number
    
    
    // GLOBAL VARIABLES - Track the state of the page
    
    var admins = [];              // Array to hold all administrator records
    var currentFilter = 'all';    // Current filter: 'all', 'active', or 'inactive'
    var currentPage = 1;          // Current page number for pagination
    var rowsPerPage = 10;         // Number of records to show per page
    var searchTerm = '';          // Text entered in the search box
    
    
    // LOAD DATA - Get admin records from browser storage
    
    function loadAdmins() {
        var savedAdmins = localStorage.getItem('admins');  // Try to get saved data
        
        // If we have existing data, use it
        if (savedAdmins && JSON.parse(savedAdmins).length > 0) {
            admins = JSON.parse(savedAdmins);
            console.log("Admins loaded from localStorage:", admins.length);
        } else {
            // No data found - this happens on first time use
            // In a real app, you would fetch from backend API here
            console.log("No admin data found");
            admins = [];  // Start with empty array
        }
        
        updateStatsSummary();   // Refresh the statistics display
        renderAdminsTable();    // Refresh the table with data
    }
    
    
    // UPDATE STATISTICS - Shows total, active, and inactive counts
    
    function updateStatsSummary() {
        var total = admins.length;
        var active = admins.filter(function(a) { return a.status === 'active'; }).length;
        var inactive = total - active;
        
        if (statsSummary) {
            statsSummary.innerHTML = `
                <div class="stat-pill"><span>Total Admins:</span> ${total}</div>
                <div class="stat-pill"><span>Active:</span> ${active}</div>
                <div class="stat-pill"><span>Inactive:</span> ${inactive}</div>
            `;
        }
    }
    
    
    // FILTER ADMINS - Apply search and status filters to the data
    
    function getFilteredAdmins() {
        var filtered = admins;  // Start with all admins
        
        // Apply status filter (active/inactive/all)
        if (currentFilter === 'active') {
            filtered = filtered.filter(function(a) { return a.status === 'active'; });
        } else if (currentFilter === 'inactive') {
            filtered = filtered.filter(function(a) { return a.status === 'inactive'; });
        }
        
        // Apply search filter (if user typed something)
        if (searchTerm.trim() !== '') {
            var term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(function(a) {
                var fullName = (a.firstName || '') + ' ' + (a.lastName || '');
                return fullName.toLowerCase().includes(term) ||
                       (a.employeeNumber && a.employeeNumber.toLowerCase().includes(term)) ||
                       (a.email && a.email.toLowerCase().includes(term)) ||
                       (a.department && a.department.toLowerCase().includes(term));
            });
        }
        
        return filtered;
    }
    
    
    // RENDER TABLE - Display the admin records in the HTML table
    
    function renderAdminsTable() {
        if (!adminsTableBody) return;
        
        var filtered = getFilteredAdmins();           // Get filtered data
        var totalPages = Math.ceil(filtered.length / rowsPerPage);  // Calculate total pages
        
        // Make sure current page is within valid range
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        
        // Get the records for the current page only
        var start = (currentPage - 1) * rowsPerPage;
        var end = start + rowsPerPage;
        var pageAdmins = filtered.slice(start, end);
        
        // Show message if no records found
        if (pageAdmins.length === 0) {
            adminsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No administrators found</td></tr>';
            updatePaginationButtons(0, 0);
            return;
        }
        
        // Clear the table before adding new rows
        adminsTableBody.innerHTML = '';
        
        // Loop through each admin and create a table row
        for (var i = 0; i < pageAdmins.length; i++) {
            var admin = pageAdmins[i];
            var row = document.createElement('tr');
            
            var serialNumber = start + i + 1;
            var fullName = (admin.firstName || '') + ' ' + (admin.lastName || '');
            var employeeNumber = admin.employeeNumber || 'N/A';
            var email = admin.email || 'N/A';
            var phoneNumber = admin.phoneNumber || 'N/A';
            var department = admin.department || 'N/A';
            var position = admin.position || 'N/A';
            var status = admin.status || 'active';
            var statusClass = status === 'active' ? 'status-active' : 'status-inactive';
            var statusText = status === 'active' ? 'Active' : 'Inactive';
            var regDate = admin.registrationDate ? new Date(admin.registrationDate).toLocaleDateString() : 'N/A';
            
            // Build the row HTML
            row.innerHTML = `
                <td>${serialNumber}</td>
                <td>${escapeHtml(employeeNumber)}</td>
                <td><strong>${escapeHtml(fullName)}</strong></td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(phoneNumber)}</td>
                <td>${escapeHtml(department)}</td>
                <td>${escapeHtml(position)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${regDate}</td>
                <td class="action-buttons">
                    <button class="btn-delete" onclick="deleteAdmin(${admin.id})">Delete</button>
                </td>
            `;
            adminsTableBody.appendChild(row);
        }
        
        updatePaginationButtons(currentPage, totalPages);
    }
    
    
    // 9. PAGINATION - Handle previous/next page buttons
    
    function updatePaginationButtons(current, total) {
        // Disable previous button if we're on the first page
        if (prevPageBtn) {
            prevPageBtn.disabled = (current <= 1);
        }
        
        // Disable next button if we're on the last page
        if (nextPageBtn) {
            nextPageBtn.disabled = (current >= total || total === 0);
        }
        
        // Update the page number display
        if (pageInfo) {
            pageInfo.textContent = 'Page ' + current + ' of ' + (total === 0 ? 1 : total);
        }
    }
    
    
    // HELPER FUNCTION - Prevent HTML injection attacks
    
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;  // This safely converts special characters
        return div.innerHTML;
    }
    
    
    // SETUP FILTER BUTTONS - Handle clicks on status filters
    
    function setupFilterButtons() {
        var filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                // Add active class to clicked button
                btn.classList.add('active');
                // Update the filter and refresh the table
                currentFilter = btn.getAttribute('data-filter');
                currentPage = 1;  // Reset to first page when filter changes
                renderAdminsTable();
            });
        });
    }
    
    
    // SETUP SEARCH - Handle typing in the search box
    
    function setupSearch() {
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchTerm = this.value;    // Update search term as user types
                currentPage = 1;             // Reset to first page when searching
                renderAdminsTable();         // Refresh the table with filtered results
            });
        }
    }
    
    
    // SETUP PAGINATION - Handle next/previous button clicks
    
    function setupPagination() {
        // Previous page button
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderAdminsTable();
                }
            });
        }
        
        // Next page button
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', function() {
                var filtered = getFilteredAdmins();
                var totalPages = Math.ceil(filtered.length / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderAdminsTable();
                }
            });
        }
    }
    
    
    // DELETE ADMIN - Remove an admin from the system
    
    window.deleteAdmin = function(id) {
        // Ask for confirmation before deleting
        var userConfirmed = confirm('Are you sure you want to delete this administrator? This action cannot be undone.');
        
        if (userConfirmed) {
            // Remove the admin from the array
            admins = admins.filter(function(a) { return a.id !== id; });
            
            // Save the updated list back to localStorage
            localStorage.setItem('admins', JSON.stringify(admins));
            
            // Fix page number if current page is now empty
            var filtered = getFilteredAdmins();
            var totalPages = Math.ceil(filtered.length / rowsPerPage);
            if (currentPage > totalPages && currentPage > 1) {
                currentPage--;
            }
            
            // Refresh the display
            updateStatsSummary();
            renderAdminsTable();
            showToast('Admin deleted successfully!', 'success');
        }
    };
    
    
    // TOAST NOTIFICATION - Show temporary popup messages
    
    function showToast(message, type) {
        // Remove any existing toast to avoid duplicates
        var existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        // Create the toast element
        var toast = document.createElement('div');
        toast.className = 'toast-notification ' + type;
        toast.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()">×</button>';
        document.body.appendChild(toast);
        
        // Add CSS styles for the toast if they don't exist yet
        if (!document.querySelector('#toastStyles')) {
            var toastStyles = document.createElement('style');
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
                    animation: slideIn 0.3s ease;
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
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(toastStyles);
        }
        
        // Auto-remove the toast after 3 seconds
        setTimeout(function() {
            if (toast && toast.parentElement) toast.remove();
        }, 3000);
    }
    
    
    // INITIALIZE - Start everything when page loads
    
    function init() {
        setupFilterButtons();   // Set up the filter button clicks
        setupSearch();          // Set up the search box
        setupPagination();      // Set up the pagination buttons
        loadAdmins();           // Load the admin data
        console.log("Admins List page loaded successfully");
    }
    
    // Start the application
    init();
    
});