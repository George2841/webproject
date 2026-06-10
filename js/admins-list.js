
// Fetches data from backend database 

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
    
    // 2. MOBILE MENU - Handles the hamburger menu on small screens
    
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
    
    // API CONFIGURATION - Backend connection settings
    var API_BASE_URL = "http://localhost:8072/api/v1";  
    
    
    // DOM ELEMENTS - Get references to all HTML elements we'll need
    
    var adminsTableBody = document.getElementById('adminsTableBody');  // Table body where admins are listed
    var searchInput = document.getElementById('searchInput');          // Search box input field
    var statsSummary = document.getElementById('statsSummary');        // Area showing statistics
    var prevPageBtn = document.getElementById('prevPage');             // Previous page button
    var nextPageBtn = document.getElementById('nextPage');             // Next page button
    var pageInfo = document.getElementById('pageInfo');                // Shows current page number
    
    
    //  GLOBAL VARIABLES - Track the state of the page
    
    var admins = [];              // Array to hold all administrator records from database
    var currentFilter = 'all';    // Current filter: 'all', 'active', or 'inactive'
    var currentPage = 1;          // Current page number for pagination
    var rowsPerPage = 10;         // Number of records to show per page
    var searchTerm = '';          // Text entered in the search box
    var isLoading = false;        // Flag to prevent multiple simultaneous requests
    
    
    // FETCH ADMINS FROM BACKEND DATABASE 
    async function fetchAdminsFromDatabase() {
        // Prevent multiple requests at the same time
        if (isLoading) return;
        isLoading = true;
        
        // Show loading state in the table
        if (adminsTableBody) {
            adminsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">⏳ Loading administrators from database...</td></tr>';
        }
        
        try {
            // Get the authentication token from storage 
            var token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
            
            // Prepare the API endpoint with optional search parameter
            var url = API_BASE_URL + "/admin/get/all/admins";
            
            // If there's a search term, add it to the URL
            if (searchTerm.trim() !== '') {
                url = API_BASE_URL + "/admin/search/admins?search=" + encodeURIComponent(searchTerm);
            }
            
            console.log("Fetching admins from:", url);
            
            // Make the API call to fetch all admins
            var response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? "Bearer " + token : ""
                }
            });
            
            // Check if the request was successful
            if (!response.ok) {
                throw new Error("Failed to fetch admins: " + response.status);
            }
            
            // Parse the response data
            var result = await response.json();
            console.log("Admins fetched from database:", result);
            
            // Extract the admins array from the response 
            if (result.success && result.data) {
                admins = result.data; 
            } else if (Array.isArray(result)) {
                admins = result;  
            } else if (result.admins) {
                admins = result.admins;  
            } else {
                admins = [];
                console.warn("Unexpected API response format:", result);
            }
            
            console.log("Loaded " + admins.length + " administrators from database");
            
        } catch (error) {
            console.error("Error fetching admins from database:", error);
            // Show error message in the table
            if (adminsTableBody) {
                adminsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">❌ Error loading administrators. Please check your connection.</td></tr>';
            }
            showToast("Failed to load administrators from database", "error");
            admins = [];  // Reset to empty array on error
        } finally {
            isLoading = false;
            updateStatsSummary();   // Refresh the statistics display
            renderAdminsTable();    // Refresh the table with data
        }
    }
    
    // UPDATE STATISTICS 
    function updateStatsSummary() {
        var total = admins.length;
        var active = admins.filter(function(a) { 
            return a.status === 'active' || a.status === 'ACTIVE'; 
        }).length;
        var inactive = total - active;
        
        if (statsSummary) {
            statsSummary.innerHTML = `
                <div class="stat-pill"><span>Total Admins:</span> ${total}</div>
                <div class="stat-pill"><span>Active:</span> ${active}</div>
                <div class="stat-pill"><span>Inactive:</span> ${inactive}</div>
            `;
        }
    }
    
    // FILTER ADMINS - Apply status filters to the data 
    function getFilteredAdmins() {
        var filtered = admins;  // Start with all admins from database
        
        // Apply status filter (active/inactive/all)
        
        if (currentFilter === 'active') {
            filtered = filtered.filter(function(a) { 
                return a.status === 'active' || a.status === 'ACTIVE'; 
            });
        } else if (currentFilter === 'inactive') {
            filtered = filtered.filter(function(a) { 
                return a.status !== 'active' && a.status !== 'ACTIVE'; 
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
            adminsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">👨‍💼 No administrators found</td></tr>';
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
            var fullName = (admin.firstName || admin.first_name || '') + ' ' + (admin.lastName || admin.last_name || '');
            var employeeNumber = admin.employeeNumber || admin.employee_number || admin.staffId || 'N/A';
            var email = admin.email || 'N/A';
            var phoneNumber = admin.phoneNumber || admin.phone || 'N/A';
            var department = admin.department || 'N/A';
            var position = admin.position || admin.role || 'N/A';
            var status = admin.status || 'active';
            var statusClass = (status === 'active' || status === 'ACTIVE') ? 'status-active' : 'status-inactive';
            var statusText = (status === 'active' || status === 'ACTIVE') ? 'Active' : 'Inactive';
            var regDate = admin.registrationDate || admin.createdAt || admin.createdOn || admin.created_at || 'N/A';
            
            // Format date if it's a valid date string
            if (regDate !== 'N/A') {
                try {
                    regDate = new Date(regDate).toLocaleDateString();
                } catch(e) {
                    regDate = 'N/A';
                }
            }
            
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
                    <button class="btn-delete" onclick="deleteAdmin('${admin.id || admin._id}')">🗑️ Delete</button>
                </td>
            `;
            adminsTableBody.appendChild(row);
        }
        
        updatePaginationButtons(currentPage, totalPages);
    }
    
    // PAGINATION - Handle previous/next page buttons
    
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
    // SETUP SEARCH 
    function setupSearch() {
        if (searchInput) {
            // Use debounce to avoid too many API calls while user is typing
            var debounceTimer;
            
            searchInput.addEventListener('input', function() {
                // Clear the previous timer
                clearTimeout(debounceTimer);
                
                // Update search term
                searchTerm = this.value;
                currentPage = 1;
                
                // Wait 500ms after user stops typing before making the API call
                debounceTimer = setTimeout(function() {
                    // Fetch fresh data from database with the search term
                    fetchAdminsFromDatabase();
                }, 500);
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
    
    //  DELETE ADMIN - Remove an admin from the database
    
    window.deleteAdmin = async function(id) {
        // Ask for confirmation before deleting
        var userConfirmed = confirm('⚠️ Are you sure you want to delete this administrator? This action cannot be undone.');
        
        if (!userConfirmed) return;
        
        try {
            // Get the authentication token
            var token = localStorage.getItem('jwtToken') || localStorage.getItem('authToken');
            
            // Show loading state on the delete button
            showToast('Deleting administrator...', 'info');
            
            // Make API call to delete the admin
            var response = await fetch(API_BASE_URL + "/admin/delete/" + id, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? "Bearer " + token : ""
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to delete admin: " + response.status);
            }
            
            var result = await response.json();
            console.log("Delete response:", result);
            
            // Refresh the admin list from database
            await fetchAdminsFromDatabase();
            
            showToast('Admin deleted successfully!', 'success');
            
        } catch (error) {
            console.error("Error deleting admin:", error);
            showToast('Failed to delete admin. Please try again.', 'error');
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
                .toast-notification.info {
                    border-left: 4px solid #2196f3;
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
    
    
    // REFRESH BUTTON - Manually refresh data from database
    function setupRefreshButton() {
        var refreshBtn = document.getElementById('refreshAdminsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                fetchAdminsFromDatabase();
                showToast('Refreshing admin list...', 'info');
            });
        }
    }
    
    // INITIALIZE - Start everything when page loads
    async function init() {
        setupFilterButtons();   // Set up the filter button clicks
        setupSearch();          // Set up the real-time search box
        setupPagination();      // Set up the pagination buttons
        setupRefreshButton();   // Set up the refresh button (if exists)
        await fetchAdminsFromDatabase();  // Load admin data from database
        console.log(" Admins List page loaded successfully - fetching from database");
    }
    
    // Start the application
    init();
    
});