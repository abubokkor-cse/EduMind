# EduMind - AI Virtual Teacher 🎓

> **Winner Project - National AI Build-a-thon 2026 (MillionX Bangladesh)**  
> Submission ID: MXB2026-Rajshahi-EduMind-AIVirtualTeacher

![EduMind Screenshot](screenshot.png)

## 🌟 Overview

**EduMind** is Bangladesh's first **3D AI virtual teacher** with emotions, voice, and vision capabilities. Built to solve the ৳60,000-180,000/year private tutoring crisis affecting 18 million students.

### ✨ Key Features

- 🎭 **Dual 3D Avatar Teachers** - Choose between Sir Abubokkor (male) or Ma'am Queen (female)
- 😊 **8 Emotions + 8 Gestures** - Context-aware emotional intelligence
- 🗣️ **Voice-First Interaction** - Bengali & English with real-time lip-sync
- 🖼️ **AI Image Generation** - Visual learning with Bengali/English diagrams
- 👁️ **Vision-Powered Explanations** - AI explains generated images in simple terms
- 📚 **4 Learning Modes** - Chat, Curriculum, File Analysis, Research
- 📖 **Textbook Library** - AI chapter extraction (zero duplicate uploads)
- 📴 **Offline-First** - Works without internet (Firebase IndexedDB)
- 💰 **Affordable** - ৳0.33 per 15-min session (30× cheaper than private tutors)

## 📝 Smart AI Quiz System

<table>
  <tr>
    <td width="50%"><img src="first_quize.png" alt="Quiz Conversation" /></td>
    <td width="50%"><img src="second_quize.png" alt="Quiz Questions" /></td>
  </tr>
  <tr>
    <td align="center"><b>Natural AI Conversation</b></td>
    <td align="center"><b>Professional Quiz Overlay</b></td>
  </tr>
</table>

## 🏗️ System Architecture

![EduMind System Architecture](EduMind-System-Architecture.png)

## 🚀 Live Demo

- **YouTube Demo**: [4-minute video](YOUR_YOUTUBE_LINK)
- **Live Website**: [Try EduMind](YOUR_LIVE_DEMO_URL)
- **Presentation**: January 16, 2026 - Daffodil Plaza, Dhaka

## 🏆 Innovation Highlights

| Feature | EduMind | Khan Academy | Byju's | ChatGPT | Private Tutors |
|---------|---------|--------------|--------|---------|----------------|
| Bengali-First | ✅ | ❌ | ❌ | ⚠️ Limited | ✅ |
| 3D Teacher with Emotions | ✅ | ❌ | ❌ | ❌ | ✅ |
| Voice Interaction | ✅ | ❌ | ❌ | ⚠️ Premium | ✅ |
| Offline Mode | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI Image Generation | ✅ | ❌ | ❌ | ✅ | ❌ |
| Cost (Monthly) | ৳299 | Free (ads) | ৳1,500-2,000 | $20 | ৳5,000-15,000 |

## 📊 Technical Stack

### Frontend
- **UI**: Vanilla JavaScript, HTML5, CSS3 (Liquid Glass design)
- **3D Rendering**: Three.js + Custom Avatar System (edumindHead.js)
- **Avatars**: Ready Player Me (custom Bangladesh avatars)
- **3D Environment**: Real classroom (classroom_default.glb)
- **Responsive**: 480px/768px/1024px breakpoints

### AI & Backend
- **AI Engine**: 
  - Gemini 3 Flash (primary - adaptive thinking)
  - Gemini 2.5 Flash (fallback)
  - Gemini 3 Pro Image (Bengali images)
  - Gemini 2.5 Flash Image (English images)
  - Gemini 2.0 Flash (Vision AI)
- **TTS**: ElevenLabs Bengali voice (eleven_v3 model)
- **Voice Input**: Web Speech API
- **Backend**: Firebase (Auth, Firestore, Storage, Realtime DB)
- **Offline Storage**: IndexedDB (50MB+ cache)
- **Payments**: Stripe (international), bKash/Nagad (planned)

### Advanced Modules (6)
1. **intentDetector.js** - Smart mode routing
2. **progressTracker.js** - Bayesian Knowledge Tracing (BKT)
3. **quizEngine.js** - Adaptive quiz generation
4. **payments.js** - Subscription system
5. **curriculumData.js** - 50+ countries, 75+ subjects
6. **database.js** - Firebase offline-first architecture

## 📈 Project Stats

- **Lines of Code**: 15,000+ (app.js: 7,595 | styles.css: 4,400+)
- **Development Time**: 18 days (Dec 11-29, 2025)
- **Team Size**: 2 (Developer + Designer)
- **Operating Cost**: ৳0.33 per 15-minute session
- **Target Market**: 18 million students (Class 6-12 in Bangladesh)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v16+ (for development server)
- Modern browser (Chrome, Edge, Safari)
- Internet connection (for initial setup)

### Quick Start

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/edumind.git
cd edumind

# Install dependencies
npm install

# Create config files (see Configuration section)
cp firebase-config.example.js firebase-config.js
cp stripe-config.example.js stripe-config.js

# Add your API keys to config files

# Run development server
npm start
# Or use Live Server extension in VS Code
```

### Configuration

Create `firebase-config.js`:
```javascript
export const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Create `stripe-config.js`:
```javascript
export const STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY';
```

Update API keys in `app.js` (lines 115-116):
```javascript
const CONFIG = {
    geminiApiKey: "YOUR_GEMINI_API_KEY",
    elevenLabsApiKey: "YOUR_ELEVENLABS_API_KEY"
};
```

## 📖 Usage

1. **Open the app** - Visit `index.html` in browser
2. **Choose teacher** - Select Sir (male) or Ma'am (female)
3. **Start learning** - Ask questions in Bengali or English
4. **Use modes**:
   - 💬 **Chat Mode**: Quick questions
   - 📚 **Curriculum Mode**: Structured learning
   - 📄 **File Mode**: Upload textbooks/PDFs
   - 🔍 **Research Mode**: Deep dive with Google Search

## 🎯 Roadmap

### Now (January 2026)
- ✅ MVP with dual 3D teachers
- ✅ 4 learning modes
- ✅ NCTB Physics & Chemistry (Class 9-10)
- ✅ Offline-first architecture

### Q1-Q2 2026
- 📱 Native mobile apps (Android/iOS)
- 📊 Parent & educator dashboard
- 📝 SSC/HSC exam preparation
- 🏫 B2B school licensing

### Q3-Q4 2026
- 🚀 Scale to 100,000 students
- 🇮🇳 India expansion (CBSE curriculum)
- 💳 bKash/Nagad payment integration
- 🧠 Local AI testing (Gemini Nano, Phi-3)

### 2027+
- 🌍 300M+ students across South Asia
- 📱 On-device AI (zero API cost = 100% FREE)
- 🤝 Government partnerships
- 🏆 "Duolingo of STEM education"

## 💰 Pricing

- **Primary Students (Class 1-5)**: 100% FREE
- **Bangladesh (Class 6-12)**: ৳299/month
- **International (India, Pakistan)**: $9/month
- **International (USA, UK)**: $15/month
- **Free Tier**: 30 min/day with ads

## 🤝 Contributing

This is a **proprietary project** created for the National AI Build-a-thon 2026.

However, we welcome feedback and suggestions! Feel free to:
- Report bugs via GitHub Issues
- Suggest features
- Share educational use cases

**Note**: This repository is for showcase and evaluation purposes. 
Source code contributions are not accepted at this time.

## 👥 Team

**MD. Abu Bokkor** - Lead Developer & AI Architect  
📧 abubokkor.cse@gmail.com | 📱 +8801774757994  
🎓 Computer Science & Engineering, Varendra University

**Maharun Nasha Queen** - UI/UX Designer  
📧 queennasha9021@gmail.com  
🎓 Computer Science & Engineering, Varendra University

**Institution**: Varendra University, Rajshahi, Bangladesh  
**Project**: National AI Build-a-thon 2026 (MillionX Bangladesh)

## 📄 License

**Copyright © 2025 MD. Abu Bokkor & Maharun Nasha Queen**  
**All Rights Reserved.**

This is **proprietary software**. Unauthorized copying, modification, distribution, 
or use of this software is strictly prohibited.

### Open-Source Components Used:
EduMind is built using open-source libraries under their respective licenses:
- Three.js (MIT License)
- Firebase SDK (Apache 2.0)
- Marked.js (MIT License)
- DOMPurify (Apache 2.0 / MPL)

See [LICENSE](LICENSE) file for complete details.

## 🙏 Acknowledgments

- **MillionX Bangladesh** - National AI Build-a-thon 2026
- **Google Gemini** - AI models and vision capabilities
- **ElevenLabs** - Bengali text-to-speech
- **Ready Player Me** - 3D avatar generation
- **Firebase** - Backend infrastructure
- **Three.js** - 3D rendering engine

## 📞 Contact & Support

- **Email**: abubokkor.cse@gmail.com
- **WhatsApp**: +8801774757994
- **GitHub Issues**: [Report bugs](https://github.com/YOUR_USERNAME/edumind/issues)
- **Documentation**: [Full docs](YOUR_DOCS_URL)

## 🌟 Star History

If EduMind helps you, please ⭐ this repository!

[![Star History Chart](https://api.star-history.com/svg?repos=YOUR_USERNAME/edumind&type=Date)](https://star-history.com/#YOUR_USERNAME/edumind&Date)

---

**Built with ❤️ during university exams by students, for students**

*"Every Bangladeshi student deserves a personal teacher. With EduMind, we're making that possible through AI - in their mother tongue, at a price every family can afford."*

---

© 2025 EduMind | [Privacy Policy](YOUR_PRIVACY_URL) | [Terms of Service](YOUR_TERMS_URL)
