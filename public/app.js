// ==========================================
// KRISHI BAZAR - APPLICATION JAVASCRIPT
// ==========================================

const prices = [
    {
        crop: "Rice",
        variety: "BRRI Dhan 29",
        price: 72,
        change: "+2.8%",
        icon: "🌾"
    },
    {
        crop: "Potato",
        variety: "Local",
        price: 42,
        change: "+1.5%",
        icon: "🥔"
    },
    {
        crop: "Tomato",
        variety: "Local",
        price: 75,
        change: "-2.1%",
        icon: "🍅"
    },
    {
        crop: "Onion",
        variety: "Local",
        price: 88,
        change: "+3.4%",
        icon: "🧅"
    },
    {
        crop: "Chili",
        variety: "Green",
        price: 180,
        change: "+4.2%",
        icon: "🌶️"
    },
    {
        crop: "Eggplant",
        variety: "Local",
        price: 55,
        change: "-1.2%",
        icon: "🍆"
    }
];

let loginPhone = "";

// ==========================================
// STARTUP
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    renderPrices();
    loadSavedFarmer();
    showHome();
});

// ==========================================
// HOME
// ==========================================

function showHome() {
    const home = document.getElementById("homeView");
    const dashboard = document.getElementById("dashboardView");

    if (home) home.classList.remove("hidden");
    if (dashboard) dashboard.classList.add("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ==========================================
// LOGIN - PHONE NUMBER
// ==========================================

function showLogin() {
    const modal = document.getElementById("modal");
    const loginStep = document.getElementById("loginStep");

    if (!modal || !loginStep) return;

    loginStep.innerHTML = `
        <div class="login-content">
            <span class="eyebrow">FARMER LOGIN</span>

            <h2>Welcome back 👋</h2>

            <p>
                Enter your mobile number to receive
                a verification OTP.
            </p>

            <form id="loginForm">

                <label for="loginPhone">
                    Mobile Number
                </label>

                <input
                    id="loginPhone"
                    type="tel"
                    placeholder="01712345678"
                    maxlength="14"
                    required
                />

                <button
                    type="submit"
                    class="primary"
                >
                    Send OTP
                </button>

            </form>

            <div class="login-divider">
                <span>New farmer?</span>
            </div>

            <button
                type="button"
                class="secondary full-width"
                onclick="showRegister()"
            >
                Create Farmer Account
            </button>

            <p class="demo-note">
                Demo mode: OTP is generated locally.
            </p>
        </div>
    `;

    modal.classList.remove("hidden");

    const form = document.getElementById("loginForm");

    if (form) {
        form.addEventListener(
            "submit",
            requestOTP
        );
    }
}

// ==========================================
// REQUEST OTP
// ==========================================

async function requestOTP(event) {
    event.preventDefault();

    const phoneInput =
        document.getElementById("loginPhone");

    const phone = phoneInput.value.trim();

    if (!isValidBangladeshPhone(phone)) {
        notify(
            "Please enter a valid Bangladesh mobile number."
        );
        return;
    }

    loginPhone = phone;

    const button =
        event.target.querySelector(
            'button[type="submit"]'
        );

    button.disabled = true;
    button.textContent = "Sending OTP...";

    try {
        const response = await fetch(
            "/api/auth/request-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    phone: phone
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Could not send OTP."
            );
        }

        console.log(
            "Demo OTP:",
            data.demoOtp
        );

        showOTPForm(
            phone,
            data.demoOtp
        );

    } catch (error) {

        console.error(error);

        notify(
            error.message ||
            "Unable to send OTP."
        );

    } finally {

        button.disabled = false;
        button.textContent = "Send OTP";
    }
}

// ==========================================
// OTP SCREEN
// ==========================================

function showOTPForm(phone, demoOtp) {
    const loginStep =
        document.getElementById("loginStep");

    if (!loginStep) return;

    loginStep.innerHTML = `
        <div class="login-content">

            <span class="eyebrow">
                PHONE VERIFICATION
            </span>

            <h2>Enter your OTP 🔐</h2>

            <p>
                We sent a 6-digit verification code
                to <strong>${phone}</strong>.
            </p>

            <form id="otpForm">

                <label for="otpInput">
                    Verification Code
                </label>

                <input
                    id="otpInput"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="123456"
                    autocomplete="one-time-code"
                    required
                />

                <button
                    type="submit"
                    class="primary"
                >
                    Verify OTP
                </button>

            </form>

            <button
                type="button"
                class="text-btn"
                onclick="showLogin()"
            >
                ← Change mobile number
            </button>

            <div class="demo-otp-box">
                <strong>Demo OTP</strong>
                <span>${demoOtp}</span>
                <small>
                    This will be replaced by
                    Applink SMS later.
                </small>
            </div>

        </div>
    `;

    const form =
        document.getElementById("otpForm");

    if (form) {
        form.addEventListener(
            "submit",
            verifyOTP
        );
    }

    setTimeout(() => {
        const input =
            document.getElementById("otpInput");

        if (input) {
            input.focus();
        }
    }, 100);
}

// ==========================================
// VERIFY OTP
// ==========================================

async function verifyOTP(event) {
    event.preventDefault();

    const otpInput =
        document.getElementById("otpInput");

    const otp = otpInput.value.trim();

    if (!/^\d{6}$/.test(otp)) {
        notify(
            "Please enter the 6-digit OTP."
        );
        return;
    }

    const button =
        event.target.querySelector(
            'button[type="submit"]'
        );

    button.disabled = true;
    button.textContent = "Verifying...";

    try {

        const response = await fetch(
            "/api/auth/verify-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    phone: loginPhone,
                    otp: otp
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            /*
             * If the phone is verified but
             * no farmer exists, send the user
             * to registration.
             */
            if (
                data.verified === true &&
                data.farmerExists === false
            ) {
                notify(
                    "Phone verified. Please create your farmer account."
                );

                showRegisterWithPhone(
                    loginPhone
                );

                return;
            }

            throw new Error(
                data.message ||
                "OTP verification failed."
            );
        }

        localStorage.setItem(
            "krishiBazarFarmer",
            JSON.stringify(data.farmer)
        );

        hideModal();

        notify(
            "Phone verified. Login successful!"
        );

        openDashboard(data.farmer);

    } catch (error) {

        console.error(error);

        notify(
            error.message ||
            "OTP verification failed."
        );

    } finally {

        button.disabled = false;
        button.textContent = "Verify OTP";
    }
}

// ==========================================
// REGISTER
// ==========================================

function showRegister() {
    showRegisterWithPhone("");
}

function showRegisterWithPhone(phone = "") {
    const modal =
        document.getElementById("modal");

    const loginStep =
        document.getElementById("loginStep");

    if (!modal || !loginStep) return;

    loginStep.innerHTML = `
        <div class="login-content">

            <span class="eyebrow">
                FARMER REGISTRATION
            </span>

            <h2>Create your account 🌾</h2>

            <p>
                Register once and manage your
                farming services from Krishi Bazar.
            </p>

            <form id="registerForm">

                <label for="registerName">
                    Full Name
                </label>

                <input
                    id="registerName"
                    type="text"
                    placeholder="Enter your full name"
                    required
                />

                <label for="registerPhone">
                    Mobile Number
                </label>

                <input
                    id="registerPhone"
                    type="tel"
                    placeholder="01712345678"
                    maxlength="14"
                    value="${phone}"
                    required
                />

                <label for="registerDistrict">
                    District
                </label>

                <input
                    id="registerDistrict"
                    type="text"
                    placeholder="e.g. Bogura"
                    required
                />

                <label for="registerUpazila">
                    Upazila
                </label>

                <input
                    id="registerUpazila"
                    type="text"
                    placeholder="e.g. Bogura Sadar"
                />

                <label>
                    Main Crops
                </label>

                <div class="crop-checkboxes">

                    <label class="checkbox-item">
                        <input
                            type="checkbox"
                            name="crops"
                            value="Rice"
                        />
                        🌾 Rice
                    </label>

                    <label class="checkbox-item">
                        <input
                            type="checkbox"
                            name="crops"
                            value="Potato"
                        />
                        🥔 Potato
                    </label>

                    <label class="checkbox-item">
                        <input
                            type="checkbox"
                            name="crops"
                            value="Tomato"
                        />
                        🍅 Tomato
                    </label>

                    <label class="checkbox-item">
                        <input
                            type="checkbox"
                            name="crops"
                            value="Onion"
                        />
                        🧅 Onion
                    </label>

                    <label class="checkbox-item">
                        <input
                            type="checkbox"
                            name="crops"
                            value="Chili"
                        />
                        🌶️ Chili
                    </label>

                </div>

                <button
                    type="submit"
                    class="primary"
                >
                    Create Farmer Account
                </button>

            </form>

            <button
                type="button"
                class="text-btn"
                onclick="showLogin()"
            >
                Already have an account? Login
            </button>

        </div>
    `;

    modal.classList.remove("hidden");

    const form =
        document.getElementById("registerForm");

    if (form) {
        form.addEventListener(
            "submit",
            handleRegistration
        );
    }
}

// ==========================================
// REGISTRATION
// ==========================================

async function handleRegistration(event) {
    event.preventDefault();

    const name =
        document.getElementById(
            "registerName"
        ).value.trim();

    const phone =
        document.getElementById(
            "registerPhone"
        ).value.trim();

    const district =
        document.getElementById(
            "registerDistrict"
        ).value.trim();

    const upazila =
        document.getElementById(
            "registerUpazila"
        ).value.trim();

    const cropInputs =
        document.querySelectorAll(
            'input[name="crops"]:checked'
        );

    const crops =
        Array.from(cropInputs).map(
            input => input.value
        );

    if (!name || !phone || !district) {
        notify(
            "Please complete your name, mobile number and district."
        );
        return;
    }

    if (!isValidBangladeshPhone(phone)) {
        notify(
            "Please enter a valid Bangladesh mobile number."
        );
        return;
    }

    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );

    submitButton.disabled = true;
    submitButton.textContent =
        "Creating account...";

    try {

        const response = await fetch(
            "/api/farmers/register",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    name,
                    phone,
                    district,
                    upazila,
                    crops
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Registration failed."
            );
        }

        localStorage.setItem(
            "krishiBazarFarmer",
            JSON.stringify(data.farmer)
        );

        hideModal();

        notify(
            "Account created successfully!"
        );

        openDashboard(data.farmer);

    } catch (error) {

        console.error(error);

        notify(
            error.message ||
            "Unable to create account."
        );

    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            "Create Farmer Account";
    }
}

// ==========================================
// CLOSE MODAL
// ==========================================

function hideModal() {
    const modal =
        document.getElementById("modal");

    if (modal) {
        modal.classList.add("hidden");
    }
}

// ==========================================
// DASHBOARD
// ==========================================

function openDashboard(farmer) {

    const home =
        document.getElementById("homeView");

    const dashboard =
        document.getElementById(
            "dashboardView"
        );

    if (home) {
        home.classList.add("hidden");
    }

    if (dashboard) {
        dashboard.classList.remove("hidden");
    }

    updateDashboard(farmer);

    switchDash("overview");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ==========================================
// LOAD SAVED FARMER
// ==========================================

function loadSavedFarmer() {

    const saved =
        localStorage.getItem(
            "krishiBazarFarmer"
        );

    if (!saved) return;

    try {

        const farmer =
            JSON.parse(saved);

        updateDashboard(farmer);

    } catch (error) {

        console.error(
            "Could not load saved farmer.",
            error
        );
    }
}

// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard(farmer) {

    if (!farmer) return;

    const name =
        farmer.name || "Farmer";

    const district =
        farmer.district || "Bangladesh";

    setText(
        "welcomeName",
        `Welcome, ${name} 👋`
    );

    setText(
        "welcomeSub",
        `Here is your farming overview for today, ${name}.`
    );

    setText(
        "chipName",
        name
    );

    setText(
        "chipDistrict",
        district
    );

    const firstLetter =
        name.charAt(0).toUpperCase();

    setText(
        "avatar",
        firstLetter
    );

    setText(
        "profileAvatar",
        firstLetter
    );

    setText(
        "profileName",
        name
    );

    setText(
        "profilePhone",
        farmer.phone || "—"
    );

    setText(
        "profileDistrict",
        district
    );

    setText(
        "profileId",
        farmer.id || "—"
    );

    const subscription =
        farmer.subscription;

    if (
        subscription &&
        subscription.active
    ) {

        setText(
            "profileSubscription",
            "PREMIUM"
        );

        setText(
            "overviewStatus",
            "Premium"
        );

    } else {

        setText(
            "profileSubscription",
            "FREE"
        );

        setText(
            "overviewStatus",
            "Free"
        );
    }
}

// ==========================================
// DASHBOARD NAVIGATION
// ==========================================

function switchDash(section) {

    const panels =
        document.querySelectorAll(
            ".dash-panel"
        );

    panels.forEach(panel => {
        panel.classList.add("hidden");
    });

    const selected =
        document.getElementById(
            `dash-${section}`
        );

    if (selected) {
        selected.classList.remove("hidden");
    }

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.dataset.target ===
            section
        ) {
            item.classList.add("active");
        }
    });
}

// ==========================================
// MOBILE SIDEBAR
// ==========================================

function toggleSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) return;

    sidebar.classList.toggle(
        "mobile-open"
    );
}

// ==========================================
// SUBSCRIPTION
// ==========================================

async function subscribe() {

    const saved =
        localStorage.getItem(
            "krishiBazarFarmer"
        );

    if (!saved) {
        notify("Please login first.");
        return;
    }

    const farmer =
        JSON.parse(saved);

    const button =
        document.getElementById(
            "subscribeBtn"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "Activating...";
    }

    try {

        const response =
            await fetch(
                `/api/farmers/${encodeURIComponent(
                    farmer.phone
                )}/subscription`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        plan: "Premium"
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Subscription failed."
            );
        }

        farmer.subscription =
            data.subscription;

        localStorage.setItem(
            "krishiBazarFarmer",
            JSON.stringify(farmer)
        );

        updateDashboard(farmer);

        if (button) {
            button.textContent =
                "✓ Premium Active";

            button.disabled = true;
        }

        notify(
            "Premium service activated successfully."
        );

    } catch (error) {

        console.error(error);

        notify(
            error.message ||
            "Could not activate subscription."
        );

        if (button) {
            button.disabled = false;
            button.textContent =
                "Activate Demo";
        }
    }
}

// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem(
        "krishiBazarFarmer"
    );

    const dashboard =
        document.getElementById(
            "dashboardView"
        );

    if (dashboard) {
        dashboard.classList.add("hidden");
    }

    showHome();

    notify(
        "You have been logged out."
    );
}

// ==========================================
// MARKET PRICES
// ==========================================

function renderPrices() {

    const priceGrid =
        document.getElementById(
            "priceGrid"
        );

    const dashPriceList =
        document.getElementById(
            "dashPriceList"
        );

    const fullPriceGrid =
        document.getElementById(
            "fullPriceGrid"
        );

    if (priceGrid) {
        priceGrid.innerHTML =
            prices
                .map(createPriceCard)
                .join("");
    }

    if (dashPriceList) {
        dashPriceList.innerHTML =
            prices
                .slice(0, 4)
                .map(createDashboardPrice)
                .join("");
    }

    if (fullPriceGrid) {
        fullPriceGrid.innerHTML =
            prices
                .map(createPriceCard)
                .join("");
    }
}

function createPriceCard(item) {

    const positive =
        item.change.startsWith("+");

    return `
        <article class="price-card">

            <div class="price-icon">
                ${item.icon}
            </div>

            <div class="price-info">

                <h3>
                    ${item.crop}
                </h3>

                <p>
                    ${item.variety}
                </p>

            </div>

            <div class="price-value">

                <strong>
                    ৳${item.price}
                </strong>

                <small
                    class="${positive
                        ? "positive"
                        : "negative"}"
                >
                    ${item.change}
                </small>

            </div>

        </article>
    `;
}

function createDashboardPrice(item) {

    const positive =
        item.change.startsWith("+");

    return `
        <div class="dash-price-row">

            <div class="dash-price-crop">

                <span>
                    ${item.icon}
                </span>

                <div>

                    <b>
                        ${item.crop}
                    </b>

                    <small>
                        ${item.variety}
                    </small>

                </div>

            </div>

            <div>

                <strong>
                    ৳${item.price}/kg
                </strong>

                <small
                    class="${positive
                        ? "positive"
                        : "negative"}"
                >
                    ${item.change}
                </small>

            </div>

        </div>
    `;
}

// ==========================================
// NOTIFICATION
// ==========================================

function notify(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3500);
}

// ==========================================
// HELPER
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// ==========================================
// BANGLADESH PHONE VALIDATION
// ==========================================

function isValidBangladeshPhone(phone) {

    const normalized =
        phone.replace(
            /[\s-]/g,
            ""
        );

    return (
        /^01[3-9]\d{8}$/.test(
            normalized
        ) ||
        /^\+8801[3-9]\d{8}$/.test(
            normalized
        ) ||
        /^8801[3-9]\d{8}$/.test(
            normalized
        )
    );
}