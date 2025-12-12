import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";


dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

app.use(express.json());

// ===== Health check =====
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "STT backend is running"
    });
});

// ===== Test API =====
app.post("/api/test", (req, res) => {
    res.json({
        received: req.body,
        time: new Date().toISOString()
    });
});


// ===== STT API =====
import axios from "axios";
import FormData from "form-data";

app.post("/api/stt", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        console.log("🎧 Audio received:", req.file.path);

        const form = new FormData();
        form.append("file", fs.createReadStream(req.file.path));
        form.append("model", "whisper-1");

        const response = await axios.post(
            "https://api.openai.com/v1/audio/transcriptions",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                timeout: 120000, // ⚠️ QUAN TRỌNG
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        fs.unlinkSync(req.file.path);

        res.json({
            text: response.data.text,
            language: response.data.language,
        });

    } catch (err) {
        console.error("Whisper error:", err?.response?.data || err);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: "Speech to text failed" });
    }
});






app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// ===== Start server =====
// ===== Start server =====
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 STT backend running on port ${PORT}`);
});

// Giữ kết nối lâu cho Railway
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

