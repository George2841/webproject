

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    //CLOCK FUNCTIONALITY
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        
        const navClock = document.getElementById('navClock');
        if (navClock) {
            navClock.textContent = timeString;
        }
    }
    
    // Update clock every second
    setInterval(updateClock, 1000);
    updateClock();
    
    //MOBILE MENU TOGGLE
    window.toggleMenu = function() {
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburger = document.getElementById('hamburger');
        
        if (mobileMenu) {
            mobileMenu.classList.toggle('show');
        }
        if (hamburger) {
            hamburger.classList.toggle('active');
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
    
    //GET DOM ELEMENTS
    const regForm = document.getElementById('regForm');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const regNumber = document.getElementById('regNumber');
    const studentEmail = document.getElementById('studentEmail');
    const department = document.getElementById('department');
    const yearOfStudy = document.getElementById('yearOfStudy');
    const faculty = document.getElementById('faculty');
    const successMessage = document.getElementById('successMessage');
    
    //HELPER FUNCTIONS
    
    // Email validation using regex
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Clear error on input
    function clearErrorOnInput(inputId, errorId) {
        const input = document.getElementById(inputId);
        const error = document.getElementById(errorId);
        if (input && error) {
            input.addEventListener('input', function() {
                input.classList.remove('error');
                error.classList.remove('show');
                // Reset error message text
                if (inputId === 'studentEmail') {
                    error.textContent = 'Valid email is required';
                }
            });
        }
    }
    
    // Clear error on select dropdown
    function clearSelectError(selectId, errorId) {
        const select = document.getElementById(selectId);
        const error = document.getElementById(errorId);
        if (select && error) {
            select.addEventListener('change', function() {
                select.classList.remove('error');
                error.classList.remove('show');
            });
        }
    }
    
    // Clear error on all inputs
    clearErrorOnInput('firstName', 'firstNameError');
    clearErrorOnInput('lastName', 'lastNameError');
    clearErrorOnInput('regNumber', 'regNumberError');
    clearErrorOnInput('studentEmail', 'studentEmailError');
    clearErrorOnInput('department', 'departmentError');
    clearErrorOnInput('faculty', 'facultyError');
    clearSelectError('yearOfStudy', 'yearError');
    
    //FORM VALIDATION FUNCTION
    function validateForm() {
        let isValid = true;
        
        // Get values
        const firstNameVal = firstName.value.trim();
        const lastNameVal = lastName.value.trim();
        const regNumberVal = regNumber.value.trim();
        const emailVal = studentEmail.value.trim();
        const departmentVal = department.value.trim();
        const yearVal = yearOfStudy.value;
        const facultyVal = faculty.value.trim();
        
        // Validate First Name
        if (!firstNameVal) {
            firstName.classList.add('error');
            const firstNameError = document.getElementById('firstNameError');
            firstNameError.textContent = 'First name is required';
            firstNameError.classList.add('show');
            isValid = false;
        } else if (firstNameVal.length < 2) {
            firstName.classList.add('error');
            const firstNameError = document.getElementById('firstNameError');
            firstNameError.textContent = 'First name must be at least 2 characters';
            firstNameError.classList.add('show');
            isValid = false;
        }
        
        // Validate Last Name
        if (!lastNameVal) {
            lastName.classList.add('error');
            const lastNameError = document.getElementById('lastNameError');
            lastNameError.textContent = 'Last name is required';
            lastNameError.classList.add('show');
            isValid = false;
        } else if (lastNameVal.length < 2) {
            lastName.classList.add('error');
            const lastNameError = document.getElementById('lastNameError');
            lastNameError.textContent = 'Last name must be at least 2 characters';
            lastNameError.classList.add('show');
            isValid = false;
        }
        
        // Validate Registration Number
        if (!regNumberVal) {
            regNumber.classList.add('error');
            const regNumberError = document.getElementById('regNumberError');
            regNumberError.textContent = 'Registration number is required';
            regNumberError.classList.add('show');
            isValid = false;
        } else if (regNumberVal.length < 5) {
            regNumber.classList.add('error');
            const regNumberError = document.getElementById('regNumberError');
            regNumberError.textContent = 'Please enter a valid registration number';
            regNumberError.classList.add('show');
            isValid = false;
        }
        
        // Validate Email
        if (!emailVal) {
            studentEmail.classList.add('error');
            const emailError = document.getElementById('studentEmailError');
            emailError.textContent = 'Email address is required';
            emailError.classList.add('show');
            isValid = false;
        } else if (!validateEmail(emailVal)) {
            studentEmail.classList.add('error');
            const emailError = document.getElementById('studentEmailError');
            emailError.textContent = 'Please enter a valid email address (e.g., name@example.com)';
            emailError.classList.add('show');
            isValid = false;
        }
        
        // Validate Department
        if (!departmentVal) {
            department.classList.add('error');
            const departmentError = document.getElementById('departmentError');
            departmentError.textContent = 'Department is required';
            departmentError.classList.add('show');
            isValid = false;
        }
        
        // Validate Year of Study
        if (!yearVal) {
            yearOfStudy.classList.add('error');
            const yearError = document.getElementById('yearError');
            yearError.textContent = 'Please select year of study';
            yearError.classList.add('show');
            isValid = false;
        }
        
        // Validate Faculty
        if (!facultyVal) {
            faculty.classList.add('error');
            const facultyError = document.getElementById('facultyError');
            facultyError.textContent = 'Faculty is required';
            facultyError.classList.add('show');
            isValid = false;
        }
        
        return isValid;
    }
    
    //CHECK FOR DUPLICATE STUDENT
    function isDuplicateStudent(email, regNumber) {
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        return students.some(student => 
            student.email === email || student.regNumber === regNumber
        );
    }
    
    //SAVE STUDENT DATA
    function saveStudentData(studentData) {
        let students = JSON.parse(localStorage.getItem('students') || '[]');
        students.push(studentData);
        localStorage.setItem('students', JSON.stringify(students));
    }
    
    //SHOW SUCCESS MESSAGE
    function showSuccessAndRedirect() {
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.classList.add('show');
        }
        
        // Disable form inputs
        const inputs = document.querySelectorAll('#regForm input, #regForm select');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // Redirect to scan page after 2 seconds
        setTimeout(function() {
            window.location.href = 'scan.html';
        }, 2000);
    }
    
    //HANDLE FORM SUBMISSION
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Get form values
        const studentData = {
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim(),
            regNumber: regNumber.value.trim(),
            email: studentEmail.value.trim(),
            department: department.value.trim(),
            yearOfStudy: yearOfStudy.value,
            faculty: faculty.value.trim(),
            registrationDate: new Date().toISOString(),
            status: 'active'
        };
        
        // Check for duplicate
        if (isDuplicateStudent(studentData.email, studentData.regNumber)) {
            const emailError = document.getElementById('studentEmailError');
            emailError.textContent = 'A student with this email or registration number already exists';
            emailError.classList.add('show');
            studentEmail.classList.add('error');
            regNumber.classList.add('error');
            return;
        }
        
        // Save to localStorage
        saveStudentData(studentData);
        
        // Also store current user for login session
        const userSession = {
            email: studentData.email,
            name: `${studentData.firstName} ${studentData.lastName}`,
            regNumber: studentData.regNumber,
            role: 'student',
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(userSession));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Show success and redirect
        showSuccessAndRedirect();
    }
    
    //ADD EVENT LISTENER TO FORM
    if (regForm) {
        regForm.addEventListener('submit', handleFormSubmit);
    }
    
    //ADD FOCUS EFFECTS TO INPUTS
    const allInputs = document.querySelectorAll('.form-group input, .form-group select');
    allInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    
    //PREVENT FORM RESUBMISSION ON PAGE REFRESH
    if (window.performance && window.performance.navigation.type === 1) {
        // Page was refreshed, clear any pending data
        console.log('Page refreshed');
    }
    
    //INPUT CHARACTER COUNTERS
    function addCharacterCounter(inputId, maxLength) {
        const input = document.getElementById(inputId);
        if (input) {
            input.setAttribute('maxlength', maxLength);
            const counter = document.createElement('small');
            counter.style.display = 'block';
            counter.style.textAlign = 'right';
            counter.style.fontSize = '11px';
            counter.style.color = '#999';
            counter.style.marginTop = '4px';
            counter.textContent = `0/${maxLength}`;
            
            input.parentElement.appendChild(counter);
            
            input.addEventListener('input', function() {
                const length = this.value.length;
                counter.textContent = `${length}/${maxLength}`;
                if (length > maxLength * 0.8) {
                    counter.style.color = '#ed6c02';
                } else {
                    counter.style.color = '#999';
                }
            });
        }
    }
    
    
    addCharacterCounter('firstName', 50);
    addCharacterCounter('lastName', 50);
    addCharacterCounter('regNumber', 20);
    
    // LOG REGISTRATION ATTEMPT FOR DEBUGGING
    console.log('Registration page loaded successfully');
});