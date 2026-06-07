//REGISTRATION PAGE JAVASCRIPT

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // ========== CLOCK FUNCTIONALITY ==========
    function updateClock() {
        var now = new Date();
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        var timeString = hours + ':' + minutes + ':' + seconds;
        
        var navClock = document.getElementById('navClock');
        if (navClock) {
            navClock.textContent = timeString;
        }
    }
    
    // Update clock every second
    setInterval(updateClock, 1000);
    updateClock();
    
    // ========== MOBILE MENU TOGGLE ==========
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
    
    // ========== GET DOM ELEMENTS ==========
    var regForm = document.getElementById('regForm');
    var firstName = document.getElementById('firstName');
    var lastName = document.getElementById('lastName');
    var regNumber = document.getElementById('regNumber');
    var studentEmail = document.getElementById('studentEmail');
    var department = document.getElementById('department');
    var yearOfStudy = document.getElementById('yearOfStudy');
    var faculty = document.getElementById('faculty');
    var registerBtn = document.getElementById('registerBtn');
    var successMessage = document.getElementById('successMessage');
    
    // ========== VALIDATION FUNCTIONS ==========
    
    // Email validation using regex
    function validateEmail(email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Registration number validation
    // Accepts formats like: BIT/0074/23, CS/2024/001, BIT-0074-23, BIT007423, etc.
    function validateRegNumber(regNo) {
        // Regex explanation:
        // ^ - start of string
        // [A-Za-z]{2,4} - 2 to 4 letters (course code like BIT, CS, ENG)
        // [\/\-]? - optional slash or dash separator
        // [0-9]{2,4} - 2 to 4 digits (year or number like 0074, 2024)
        // [\/\-]? - optional slash or dash separator
        // [0-9]{2,4}$ - 2 to 4 digits at the end (like 23, 001, 2024)
        
        var regRegex = /^[A-Za-z]{2,4}[\/\-]?[0-9]{2,4}[\/\-]?[0-9]{2,4}$/;
        return regRegex.test(regNo);
    }
    
    // Name validation (letters only)
    function validateName(name) {
        var nameRegex = /^[A-Za-z\s]{2,50}$/;
        return nameRegex.test(name);
    }
    
    // ========== ERROR HANDLING FUNCTIONS ==========
    
    function showError(inputElement, errorElement, message) {
        if (inputElement) inputElement.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }
    
    function hideError(inputElement, errorElement) {
        if (inputElement) inputElement.classList.remove('error');
        if (errorElement) errorElement.classList.remove('show');
    }
    
    function showSuccessMessage(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.classList.add('show');
        }
    }
    
    // ========== CLEAR ERRORS ON INPUT ==========
    
    function clearErrorOnInput(inputId, errorId) {
        var input = document.getElementById(inputId);
        var error = document.getElementById(errorId);
        if (input && error) {
            input.addEventListener('input', function() {
                input.classList.remove('error');
                error.classList.remove('show');
            });
        }
    }
    
    function clearSelectError(selectId, errorId) {
        var select = document.getElementById(selectId);
        var error = document.getElementById(errorId);
        if (select && error) {
            select.addEventListener('change', function() {
                select.classList.remove('error');
                error.classList.remove('show');
            });
        }
    }
    
    // Setup clear error listeners for all fields
    clearErrorOnInput('firstName', 'firstNameError');
    clearErrorOnInput('lastName', 'lastNameError');
    clearErrorOnInput('regNumber', 'regNumberError');
    clearErrorOnInput('studentEmail', 'studentEmailError');
    clearErrorOnInput('department', 'departmentError');
    clearErrorOnInput('faculty', 'facultyError');
    clearSelectError('yearOfStudy', 'yearError');
    
    // ========== CHECK FOR DUPLICATE STUDENT ==========
    function isDuplicateStudent(email, regNum) {
        var students = JSON.parse(localStorage.getItem('students') || '[]');
        for (var i = 0; i < students.length; i++) {
            if (students[i].email === email || students[i].regNumber === regNum) {
                return true;
            }
        }
        return false;
    }
    
    // ========== SAVE STUDENT DATA AND REDIRECT ==========
    function saveAndRedirect(studentData) {
        // Save temporary student data to localStorage
        localStorage.setItem('tempStudentData', JSON.stringify(studentData));
        console.log('Data saved to localStorage:', studentData);
        
        // Show success message
        showSuccessMessage('✅ Registration details saved! Redirecting to face capture...');
        
        // Disable button to prevent multiple clicks
        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.textContent = 'Redirecting...';
        }
        
        // Redirect to face capture page after 1.5 seconds
        setTimeout(function() {
            window.location.href = 'capture.html';
        }, 1500);
    }
    
    // ========== VALIDATE ENTIRE FORM ==========
    function validateForm() {
        var isValid = true;
        
        // Get values
        var firstNameVal = firstName.value.trim();
        var lastNameVal = lastName.value.trim();
        var regNumberVal = regNumber.value.trim();
        var emailVal = studentEmail.value.trim();
        var departmentVal = department.value.trim();
        var yearVal = yearOfStudy.value;
        var facultyVal = faculty.value.trim();
        
        // Validate First Name
        if (!firstNameVal) {
            showError(firstName, document.getElementById('firstNameError'), 'First name is required');
            isValid = false;
        } else if (!validateName(firstNameVal)) {
            showError(firstName, document.getElementById('firstNameError'), 'First name must contain only letters (minimum 2 characters)');
            isValid = false;
        } else {
            hideError(firstName, document.getElementById('firstNameError'));
        }
        
        // Validate Last Name
        if (!lastNameVal) {
            showError(lastName, document.getElementById('lastNameError'), 'Last name is required');
            isValid = false;
        } else if (!validateName(lastNameVal)) {
            showError(lastName, document.getElementById('lastNameError'), 'Last name must contain only letters (minimum 2 characters)');
            isValid = false;
        } else {
            hideError(lastName, document.getElementById('lastNameError'));
        }
        
        // Validate Registration Number
        if (!regNumberVal) {
            showError(regNumber, document.getElementById('regNumberError'), 'Registration number is required');
            isValid = false;
        } else if (!validateRegNumber(regNumberVal)) {
            showError(regNumber, document.getElementById('regNumberError'), 'Please enter a valid registration number (e.g., BIT/0074/23, CS/2024/001)');
            isValid = false;
        } else {
            hideError(regNumber, document.getElementById('regNumberError'));
        }
        
        // Validate Email
        if (!emailVal) {
            showError(studentEmail, document.getElementById('studentEmailError'), 'Email address is required');
            isValid = false;
        } else if (!validateEmail(emailVal)) {
            showError(studentEmail, document.getElementById('studentEmailError'), 'Please enter a valid email address');
            isValid = false;
        } else {
            hideError(studentEmail, document.getElementById('studentEmailError'));
        }
        
        // Validate Department
        if (!departmentVal) {
            showError(department, document.getElementById('departmentError'), 'Department is required');
            isValid = false;
        } else {
            hideError(department, document.getElementById('departmentError'));
        }
        
        // Validate Year of Study
        if (!yearVal) {
            showError(yearOfStudy, document.getElementById('yearError'), 'Please select year of study');
            isValid = false;
        } else {
            hideError(yearOfStudy, document.getElementById('yearError'));
        }
        
        // Validate Faculty
        if (!facultyVal) {
            showError(faculty, document.getElementById('facultyError'), 'Faculty is required');
            isValid = false;
        } else {
            hideError(faculty, document.getElementById('facultyError'));
        }
        
        return isValid;
    }
    
    //HANDLE FORM SUBMISSION
    function handleFormSubmit(event) {
        event.preventDefault();
        console.log('Form submitted');
        
        // Validate form
        if (validateForm()) {
            // Get all values
            var studentData = {
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                regNumber: regNumber.value.trim(),
                email: studentEmail.value.trim(),
                department: department.value.trim(),
                yearOfStudy: yearOfStudy.value,
                faculty: faculty.value.trim(),
                registrationDate: new Date().toISOString()
            };
            
            // Check for duplicate
            if (isDuplicateStudent(studentData.email, studentData.regNumber)) {
                showError(studentEmail, document.getElementById('studentEmailError'), 'Student with this email or registration number already exists');
                showError(regNumber, document.getElementById('regNumberError'), 'Student with this email or registration number already exists');
                return;
            }
            
            console.log('Form is valid, saving data...');
            saveAndRedirect(studentData);
        } else {
            console.log('Form validation failed');
        }
    }
    
    // ADD EVENT LISTENER
    if (regForm) {
        regForm.addEventListener('submit', handleFormSubmit);
    }
    
    //LOG FOR DEBUGGING
    console.log('Registration page loaded successfully');
});