//  ADMINS LIST JAVASCRIPT 

document.addEventListener('DOMContentLoaded', function() {
    
    //  CLOCK/TIMER FUNCTIONALITY 
    function updateClock() {
        var now = new Date();
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        var timeString = hours + ':' + minutes + ':' + seconds;
        
        var clockElement = document.getElementById('navClock');
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }
    
    // Update clock every second
    setInterval(updateClock, 1000);
    updateClock();
    
    //  MOBILE MENU TOGGLE 
    window.toggleMenu = function() {
        var mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('show');
        }
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        var mobileMenu = document.getElementById('mobileMenu');
        var hamburger = document.getElementById('hamburger');
        
        if (mobileMenu && mobileMenu.classList.contains('show')) {
            if (hamburger && !hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.remove('show');
            }
        }
    });
    
    //  DOM ELEMENTS 
    var adminsTableBody = document.getElementById('adminsTableBody');
    var searchInput = document.getElementById('searchInput');
    var statsSummary = document.getElementById('statsSummary');
    var prevPageBtn = document.getElementById('prevPage');
    var nextPageBtn = document.getElementById('nextPage');
    var pageInfo = document.getElementById('pageInfo');
    
    //  GLOBAL VARIABLES 
    var admins = [];
    var currentFilter = 'all';
    var currentPage = 1;
    var rowsPerPage = 10;
    var searchTerm = '';
    
    //  LOAD ADMINS FROM Database
     async function loadAdmins() {

    const token = localStorage.getItem("jwtToken");

    try {

        var tbody = document.getElementById('adminsTableBody');

        if (tbody) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;">Loading students...</td></tr>';
        }

        const response = await fetch(
            "http://localhost:8072/api/v1/admin/allAdmin?page=0&size=10",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            }
        );

        console.log("Status:", response.status);

        if (!response.ok) {
            throw new Error("Failed to load Admins");
        }
            const result = await response.json();

            console.log("Admins from database:", result);

            admins = result || [];

            console.log("Admins array:", admins);

            renderAdminsTable();
            updateStatsSummary();

    } catch (error) {

        console.error("Error loading Admins:", error);

        var tbody = document.getElementById('adminsTableBody');

        if (tbody) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;color:red;">Failed to load students</td></tr>';
        }
    }

}    
   
    
    // UPDATE STATS SUMMARY
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
    
    //  GET FILTERED ADMINS 
    function getFilteredAdmins() {
        var filtered = admins;
        
        // Apply status filter
        if (currentFilter === 'active') {
            filtered = filtered.filter(function(a) { return a.status === 'active'; });
        } else if (currentFilter === 'inactive') {
            filtered = filtered.filter(function(a) { return a.status === 'inactive'; });
        }
        
        // Apply search filter
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
    
    //  RENDER ADMINS TABLE 
    function renderAdminsTable() {
        if (!adminsTableBody) return;
        
        var filtered = getFilteredAdmins();
        var totalPages = Math.ceil(filtered.length / rowsPerPage);
        
        // Ensure current page is valid
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        
        var start = (currentPage - 1) * rowsPerPage;
        var end = start + rowsPerPage;
        var pageAdmins = filtered.slice(start, end);
        
        if (pageAdmins.length === 0) {
            adminsTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No administrators found</td></tr>';
            updatePaginationButtons(0, 0);
            return;
        }
        
        adminsTableBody.innerHTML = '';
        
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
            
            row.innerHTML = `
                <td>${serialNumber}</td>
                <td><strong>${escapeHtml(fullName)}</strong></td>
                <td>${escapeHtml(employeeNumber)}</td>
                <td>${escapeHtml(phoneNumber)}</td>
                <td>${escapeHtml(department)}</td>
                <td>${escapeHtml(position)}</td>
                <td>${escapeHtml(email)}</td>                                            
                <td>${escapeHtml(createdOn)}</td>
                <td class="action-buttons">
                    <button class="btn-delete" onclick="deleteAdmin(${admin.id})">Delete</button>
                </td>
            `;
            adminsTableBody.appendChild(row);
        }
        
        updatePaginationButtons(currentPage, totalPages);
    }
    
    //  UPDATE PAGINATION BUTTONS 
    function updatePaginationButtons(current, total) {
        if (prevPageBtn) {
            prevPageBtn.disabled = (current <= 1);
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = (current >= total || total === 0);
        }
        
        if (pageInfo) {
            pageInfo.textContent = 'Page ' + current + ' of ' + (total === 0 ? 1 : total);
        }
    }
    
    //  ESCAPE HTML 
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    //  SETUP FILTER BUTTONS 
    function setupFilterButtons() {
        var filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                currentPage = 1;
                renderAdminsTable();
            });
        });
    }
    
    //  SETUP SEARCH 
    function setupSearch() {
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchTerm = this.value;
                currentPage = 1;
                renderAdminsTable();
            });
        }
    }
    
    //  SETUP PAGINATION 
    function setupPagination() {
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderAdminsTable();
                }
            });
        }
        
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
    
    //  DELETE ADMIN FUNCTION 
    window.deleteAdmin = function(id) {
        if (confirm('Are you sure you want to delete this administrator? This action cannot be undone.')) {
            admins = admins.filter(function(a) { return a.id !== id; });
            localStorage.setItem('admins', JSON.stringify(admins));
            
            // Reset page if needed
            var filtered = getFilteredAdmins();
            var totalPages = Math.ceil(filtered.length / rowsPerPage);
            if (currentPage > totalPages && currentPage > 1) {
                currentPage--;
            }
            
            updateStatsSummary();
            renderAdminsTable();
            showToast('Admin deleted successfully!', 'success');
        }
    };
    
    //  TOAST NOTIFICATION 
    function showToast(message, type) {
        var existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        var toast = document.createElement('div');
        toast.className = 'toast-notification ' + type;
        toast.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()">×</button>';
        document.body.appendChild(toast);
        
        // Add toast styles if not exists
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
        
        setTimeout(function() {
            if (toast && toast.parentElement) toast.remove();
        }, 3000);
    }
    
    //  INITIALIZE 
    function init() {
        setupFilterButtons();
        setupSearch();
        setupPagination();
        loadAdmins();
        console.log("Admins List page loaded successfully");
    }
    
    init();
});