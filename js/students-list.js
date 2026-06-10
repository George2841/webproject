//  STUDENTS LIST JAVASCRIPT 

document.addEventListener('DOMContentLoaded', function() {
    
    //  CLOCK FUNCTIONALITY 
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
    
    //  MOBILE MENU TOGGLE 
    window.toggleMenu = function() {
        var mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) mobileMenu.classList.toggle('show');
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
    
    //  API CONFIGURATION 
    var API_BASE_URL = "http://localhost:8072/api/v1";
    
    //  GLOBAL VARIABLES 
    var allStudents = [];
    var currentFilter = 'all';
    var currentPage = 1;
    var rowsPerPage = 10;
    var searchTerm = '';
    
    //  FETCH STUDENTS FROM DATABASE 
    async function fetchStudents() {

    const token = localStorage.getItem("jwtToken");

    try {

        var tbody = document.getElementById('studentsTableBody');

        if (tbody) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;">Loading students...</td></tr>';
        }

        const response = await fetch(
            API_BASE_URL + "/admin/allStudents?page=0&size=10",
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
            throw new Error("Failed to load students");
        }

        const result = await response.json();

        console.log("Students from database:", result);

        // Spring returns List<StudentResponse>
        allStudents = result || [];

        renderStudents();
        updateStatsSummary();

    } catch (error) {

        console.error("Error loading students:", error);

        var tbody = document.getElementById('studentsTableBody');

        if (tbody) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;color:red;">Failed to load students</td></tr>';
        }
    }
}
        
    //  GET FILTERED STUDENTS 
    function getFilteredStudents() {
        var filtered = allStudents;
        
        // Apply status filter
        if (currentFilter === 'verified') {
            filtered = filtered.filter(function(s) {
                return s.faceImage && s.status === 'active';
            });
        } else if (currentFilter === 'pending') {
            filtered = filtered.filter(function(s) {
                return !s.faceImage || s.status === 'pending_face_capture';
            });
        }
        
        // Apply search filter
        if (searchTerm.trim() !== '') {
            var term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(function(s) {
                var fullName = (s.firstName || '') + ' ' + (s.lastName || '');
                return fullName.toLowerCase().includes(term) ||
                       (s.regNumber && s.regNumber.toLowerCase().includes(term)) ||
                       (s.email && s.email.toLowerCase().includes(term));
            });
        }
        
        return filtered;
    }
    
    //  UPDATE STATS SUMMARY 
    function updateStatsSummary() {
        var total = allStudents.length;
        var verified = allStudents.filter(function(s) {
            return s.faceImage && s.status === 'active';
        }).length;
        var pending = total - verified;
        
        var statsHtml = `
            <div class="stat-pill"><span>Total Students:</span> ${total}</div>
            <div class="stat-pill"><span>Verified:</span> ${verified}</div>
            <div class="stat-pill"><span>Pending:</span> ${pending}</div>
            <div class="stat-pill"><span>Completion Rate:</span> ${total > 0 ? Math.round((verified / total) * 100) : 0}%</div>
        `;
        
        var statsSummary = document.getElementById('statsSummary');
        if (statsSummary) statsSummary.innerHTML = statsHtml;
    }
    
    //  RENDER STUDENTS TABLE 
    function renderStudents() {
        var tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;
        
        var filtered = getFilteredStudents();
        var totalPages = Math.ceil(filtered.length / rowsPerPage);
        
        // Ensure current page is valid
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        
        var start = (currentPage - 1) * rowsPerPage;
        var end = start + rowsPerPage;
        var pageStudents = filtered.slice(start, end);
        
        if (pageStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No students found</td></tr>';
            updatePaginationButtons(0, 0);
            return;
        }
        
        tbody.innerHTML = '';
        
        for (var i = 0; i < pageStudents.length; i++) {
            var student = pageStudents[i];
            var row = document.createElement('tr');
            
            var serialNumber = start + i + 1;
            var fullName = (student.firstName || '') + ' ' + (student.lastName || '');
            var regNumber = student.regNumber || 'N/A';
            var email = student.email || 'N/A';
            var department = student.department || 'N/A';
            var yearOfStudy = student.yearOfStudy || 'N/A';
            var faculty = student.faculty || 'N/A';
            
            var isVerified = (student.faceImage && student.status === 'active');
            var statusClass = isVerified ? 'status-verified' : 'status-pending';
            var statusText = isVerified ? 'Verified' : 'Pending';
            
            var regDate = student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : 'N/A';
            
            row.innerHTML = `
                <td>${serialNumber}</td>
                <td>${escapeHtml(fullName)}</strong></td>
                <td>${escapeHtml(regNumber)}</td>
                <td>${escapeHtml(department)}</td>
                <td>${escapeHtml(yearOfStudy)}</td>
                <td>${escapeHtml(faculty)}</td>
            `;
            tbody.appendChild(row);
        }
        
        updatePaginationButtons(currentPage, totalPages);
    }
    
    //  UPDATE PAGINATION BUTTONS 
    function updatePaginationButtons(current, total) {
        var prevBtn = document.getElementById('prevPage');
        var nextBtn = document.getElementById('nextPage');
        var pageInfo = document.getElementById('pageInfo');
        
        if (prevBtn) {
            prevBtn.disabled = (current <= 1);
        }
        
        if (nextBtn) {
            nextBtn.disabled = (current >= total);
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
                renderStudents(); //fuction being called 
            });
        });
    }
    
    //  SETUP SEARCH 
    function setupSearch() {
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchTerm = this.value;
                currentPage = 1;
                renderStudents();
            });
        }
    }
    
    //  SETUP PAGINATION 
    function setupPagination() {
        var prevBtn = document.getElementById('prevPage');
        var nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderStudents();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                var filtered = getFilteredStudents();
                var totalPages = Math.ceil(filtered.length / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderStudents();
                }
            });
        }
    }
    
    //  CHECK URL PARAMETERS FOR FILTER 
    function checkUrlParams() {
        var urlParams = new URLSearchParams(window.location.search);
        var filter = urlParams.get('filter');
        
        if (filter === 'verified') {
            currentFilter = 'verified';
            var verifiedBtn = document.querySelector('.filter-btn[data-filter="verified"]');
            if (verifiedBtn) {
                document.querySelectorAll('.filter-btn').forEach(function(btn) {
                    btn.classList.remove('active');
                });
                verifiedBtn.classList.add('active');
            }
        } else if (filter === 'pending') {
            currentFilter = 'pending';
            var pendingBtn = document.querySelector('.filter-btn[data-filter="pending"]');
            if (pendingBtn) {
                document.querySelectorAll('.filter-btn').forEach(function(btn) {
                    btn.classList.remove('active');
                });
                pendingBtn.classList.add('active');
            }
        }
    }
    
    //  INITIALIZE 
    function init() {
        setupFilterButtons();
        setupSearch();
        setupPagination();
        checkUrlParams();
        fetchStudents();
    }
    
    init();
});