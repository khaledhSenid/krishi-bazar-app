const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

const dataDir = path.join(__dirname, "data");
const farmersFile = path.join(dataDir, "farmers.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(farmersFile)) {
    fs.writeFileSync(farmersFile, "[]");
}

function getFarmers() {
    try {
        const data = fs.readFileSync(farmersFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Could not read farmers:", error);
        return [];
    }
}

function saveFarmers(farmers) {
    fs.writeFileSync(farmersFile, JSON.stringify(farmers, null, 2));
}

// ==========================================
// DEMO OTP STORAGE
// ==========================================

const otpStore = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Krishi Bazar API is running"
    });
});

// ==========================================
// REQUEST OTP
// ==========================================

app.post("/api/auth/request-otp", (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({
            success: false,
            message: "Mobile number is required."
        });
    }

    const normalizedPhone = phone.trim();

    const otp = generateOTP();

    otpStore.set(normalizedPhone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
    });

    console.log(`📱 Demo OTP for ${normalizedPhone}: ${otp}`);

    res.json({
        success: true,
        message: "OTP generated successfully.",
        expiresIn: 300,

        // DEMO ONLY
        demoOtp: otp
    });
});

// ==========================================
// VERIFY OTP
// ==========================================

app.post("/api/auth/verify-otp", (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            message: "Mobile number and OTP are required."
        });
    }

    const normalizedPhone = phone.trim();
    const storedOTP = otpStore.get(normalizedPhone);

    if (!storedOTP) {
        return res.status(400).json({
            success: false,
            message: "No OTP request found. Please request a new OTP."
        });
    }

    if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(normalizedPhone);

        return res.status(400).json({
            success: false,
            message: "OTP has expired. Please request a new OTP."
        });
    }

    if (storedOTP.otp !== otp.trim()) {
        storedOTP.attempts += 1;

        return res.status(400).json({
            success: false,
            message: "Invalid OTP."
        });
    }

    // OTP is correct
    otpStore.delete(normalizedPhone);

    const farmers = getFarmers();

    const farmer = farmers.find(
        farmer => farmer.phone === normalizedPhone
    );

    if (!farmer) {
        return res.status(404).json({
            success: false,
            message: "Phone verified, but no farmer account was found.",
            verified: true,
            farmerExists: false
        });
    }

    res.json({
        success: true,
        message: "OTP verified successfully.",
        verified: true,
        farmerExists: true,
        farmer
    });
});

// ==========================================
// FARMER REGISTRATION
// ==========================================

app.post("/api/farmers/register", (req, res) => {
    const {
        name,
        phone,
        district,
        upazila,
        crops
    } = req.body;

    if (!name || !phone || !district) {
        return res.status(400).json({
            success: false,
            message: "Name, phone and district are required."
        });
    }

    const farmers = getFarmers();

    const existingFarmer = farmers.find(
        farmer => farmer.phone === phone
    );

    if (existingFarmer) {
        return res.status(409).json({
            success: false,
            message: "A farmer with this phone number already exists.",
            farmer: existingFarmer
        });
    }

    const farmer = {
        id: Date.now().toString(),
        name: name.trim(),
        phone: phone.trim(),
        district: district.trim(),
        upazila: upazila
            ? upazila.trim()
            : "",
        crops: Array.isArray(crops)
            ? crops
            : [],
        subscription: {
            active: false,
            plan: null
        },
        createdAt: new Date().toISOString()
    };

    farmers.push(farmer);

    saveFarmers(farmers);

    res.status(201).json({
        success: true,
        message: "Farmer registered successfully.",
        farmer
    });
});

// ==========================================
// GET FARMER
// ==========================================

app.get("/api/farmers/:phone", (req, res) => {
    const phone = req.params.phone;

    const farmers = getFarmers();

    const farmer = farmers.find(
        farmer => farmer.phone === phone
    );

    if (!farmer) {
        return res.status(404).json({
            success: false,
            message: "Farmer not found."
        });
    }

    res.json({
        success: true,
        farmer
    });
});

// ==========================================
// UPDATE FARMER
// ==========================================

app.put("/api/farmers/:phone", (req, res) => {
    const phone = req.params.phone;

    const {
        name,
        district,
        upazila,
        crops
    } = req.body;

    const farmers = getFarmers();

    const farmerIndex = farmers.findIndex(
        farmer => farmer.phone === phone
    );

    if (farmerIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "Farmer not found."
        });
    }

    if (name !== undefined) {
        farmers[farmerIndex].name = name.trim();
    }

    if (district !== undefined) {
        farmers[farmerIndex].district =
            district.trim();
    }

    if (upazila !== undefined) {
        farmers[farmerIndex].upazila =
            upazila.trim();
    }

    if (crops !== undefined && Array.isArray(crops)) {
        farmers[farmerIndex].crops = crops;
    }

    farmers[farmerIndex].updatedAt =
        new Date().toISOString();

    saveFarmers(farmers);

    res.json({
        success: true,
        message: "Farmer profile updated.",
        farmer: farmers[farmerIndex]
    });
});

// ==========================================
// SUBSCRIPTION
// ==========================================

app.post("/api/farmers/:phone/subscription", (req, res) => {
    const phone = req.params.phone;
    const { plan } = req.body;

    const farmers = getFarmers();

    const farmerIndex = farmers.findIndex(
        farmer => farmer.phone === phone
    );

    if (farmerIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "Farmer not found."
        });
    }

    farmers[farmerIndex].subscription = {
        active: true,
        plan: plan || "Premium",
        activatedAt: new Date().toISOString()
    };

    saveFarmers(farmers);

    res.json({
        success: true,
        message: "Subscription activated.",
        subscription:
            farmers[farmerIndex].subscription
    });
});

// ==========================================
// APPLINK MESSAGE CALLBACK
// ==========================================

app.post("/api/applink/message", (req, res) => {
    console.log("-----------------------------------");
    console.log("📩 Applink callback received");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("-----------------------------------");

    // Acknowledge the Applink callback
    res.status(200).json({
        success: true,
        message: "Applink message received"
    });
});
// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log("-----------------------------------");
    console.log("🌾 Krishi Bazar server started");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log("-----------------------------------");
});