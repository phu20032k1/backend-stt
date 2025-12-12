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
app.post("/api/stt", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        console.log("🎧 Audio received:", req.file.path);

        // Đọc file thành buffer (CHỐNG ECONNRESET)
        const audioBuffer = fs.readFileSync(req.file.path);

        const transcription = await openai.audio.transcriptions.create({
            file: new File([audioBuffer], "audio.webm", {
                type: "audio/webm",
            }),
            model: "whisper-1",
        });

        fs.unlinkSync(req.file.path);

        res.json({
            text: transcription.text,
            language: transcription.language,
        });

    } catch (err) {
        console.error("Whisper error:", err);

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

