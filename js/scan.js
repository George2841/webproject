// SCAN PAGE JAVASCRIPT

document.addEventListener('DOMContentLoaded', function () {

    // CLOCK FUNCTIONALITY
    function updateClock() {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const navClock = document.getElementById('navClock');

        if (navClock) {
            navClock.textContent = `${hours}:${minutes}:${seconds}`;
        }
    }

    setInterval(updateClock, 1000);
    updateClock();

    // MOBILE MENU
    window.toggleMenu = function () {
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileMenu) {
            mobileMenu.classList.toggle('show');
        }
    };

    // DOM ELEMENTS
    const video = document.getElementById('videoFeed');
    const canvas = document.getElementById('photoCanvas');
    const captureBtn = document.getElementById('captureBtn');

    const scanStatus = document.getElementById('scanStatus');

    const studentInfo = document.getElementById('studentInfo');
    const eligibilityInfo = document.getElementById('eligibilityInfo');

    const studentNameSpan = document.getElementById('studentName');
    const eligibilityStatusSpan = document.getElementById('eligibilityStatus');

    const regNumberInput = document.getElementById('regNumberInput');
    const verifyRegBtn = document.getElementById('verifyRegBtn');

    const regErrorMsg = document.getElementById('regErrorMsg');
    const regSuccessMsg = document.getElementById('regSuccessMsg');

    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const verifiedStudentName = document.getElementById('verifiedStudentName');

    // VARIABLES
    let stream = null;
    let currentRegNumber = null;
    let capturedImageData = null;

    // API URL
    const API_BASE_URL =
        "http://localhost:8072/api/v1/admin/verify/student";

    // HANDLE REGISTRATION NUMBER
    function handleVerifyStudent() {

        const regNumber = regNumberInput.value.trim();

        if (!regNumber) {

            regErrorMsg.textContent =
                "Please enter a registration number";

            regErrorMsg.classList.add("show");

            return;
        }

        currentRegNumber = regNumber;

        regErrorMsg.classList.remove("show");

        regSuccessMsg.textContent =
            "Registration number captured successfully";

        regSuccessMsg.classList.add("show");

        verifiedStudentName.textContent = regNumber;

        studentNameDisplay.classList.add("show");

        scanStatus.textContent = "Ready to Scan Face";
        scanStatus.className = "status-badge status-success";
    }

    // CAMERA INITIALIZATION
    async function initCamera() {

        try {

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                }
            });

            video.srcObject = stream;

            console.log("Camera initialized successfully");

        } catch (error) {

            console.error("Camera Error:", error);

            scanStatus.textContent = "Camera Access Denied";
            scanStatus.className = "status-badge status-error";
        }
    }

    // CAPTURE PHOTO
    function capturePhoto() {

        if (!currentRegNumber) {

            scanStatus.textContent =
                "Enter Registration Number First";

            scanStatus.className =
                "status-badge status-error";

            return;
        }

        const ctx = canvas.getContext("2d");

        const videoRect = video.getBoundingClientRect();

        const scanFrame =
            document.querySelector(".scan-frame");

        const overlayRect =
            scanFrame.getBoundingClientRect();

        const scaleX =
            video.videoWidth / videoRect.width;

        const scaleY =
            video.videoHeight / videoRect.height;

        const circleX =
            (overlayRect.left - videoRect.left) * scaleX;

        const circleY =
            (overlayRect.top - videoRect.top) * scaleY;

        const circleSize =
            overlayRect.width * scaleX;

        canvas.width = circleSize;
        canvas.height = circleSize;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            circleSize / 2,
            circleSize / 2,
            circleSize / 2,
            0,
            Math.PI * 2
        );

        ctx.clip();

        // Mirror image
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(
            video,
            circleX,
            circleY,
            circleSize,
            circleSize,
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.restore();

        capturedImageData =
            canvas.toDataURL("image/jpeg", 0.9);

        console.log("Captured Image Ready");

        scanStatus.textContent = "Verifying...";
        scanStatus.className =
            "status-badge status-waiting";

        verifyFaceWithDatabase();
    }

    // VERIFY FACE
    async function verifyFaceWithDatabase() {

        if (!currentRegNumber || !capturedImageData) {
            return;
        }

        try {

            const token =
                localStorage.getItem("jwtToken");

            if (!token) {

                scanStatus.textContent =
                    "Login Required";

                scanStatus.className =
                    "status-badge status-error";

                return;
            }

            const payload = {
                regNumber: currentRegNumber,
                image: capturedImageData
            };

            console.log("Payload:", payload);

            const response = await fetch(
                API_BASE_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const responseText =
                await response.text();

            console.log(
                "Backend Response:",
                responseText
            );

            if (!response.ok) {

                scanStatus.textContent =
                    "Verification Failed";

                scanStatus.className =
                    "status-badge status-error";

                studentInfo.style.display = "none";
                eligibilityInfo.style.display = "none";

                return;
            }

            scanStatus.textContent =
                "Verified ✓";

            scanStatus.className =
                "status-badge status-success";

            studentInfo.style.display = "flex";
            eligibilityInfo.style.display = "flex";

            studentNameSpan.textContent =
                currentRegNumber;

            eligibilityStatusSpan.textContent =
                "Eligible - Examination Access Granted";

            eligibilityStatusSpan.style.color =
                "#059669";

        } catch (error) {

            console.error(
                "Verification Error:",
                error
            );

            scanStatus.textContent =
                "Network Error";

            scanStatus.className =
                "status-badge status-error";
        }
    }

    // EVENT LISTENERS
    if (captureBtn) {

        captureBtn.addEventListener(
            "click",
            function () {

                captureBtn.style.transform =
                    "scale(0.95)";

                setTimeout(function () {

                    captureBtn.style.transform = "";

                }, 200);

                capturePhoto();
            }
        );
    }

    if (verifyRegBtn) {

        verifyRegBtn.addEventListener(
            "click",
            handleVerifyStudent
        );
    }

    if (regNumberInput) {

        regNumberInput.addEventListener(
            "keypress",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    handleVerifyStudent();
                }
            }
        );

        regNumberInput.addEventListener(
            "input",
            function () {

                regNumberInput.classList.remove(
                    "error"
                );

                regErrorMsg.classList.remove(
                    "show"
                );
            }
        );
    }

    // INITIALIZE
    initCamera();

    // CLEAN UP CAMERA
    window.addEventListener(
        "beforeunload",
        function () {

            if (stream) {

                stream.getTracks().forEach(
                    function (track) {
                        track.stop();
                    }
                );
            }
        }
    );
});