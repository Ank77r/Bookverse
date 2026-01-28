# BookVerse 🌌

**BookVerse** is a next-generation web platform for reading novels, designed with an immersive user interface, fluid animations, and a robust backend powered by Firebase. It bridges the gap between traditional e-readers and modern web experiences with features like "Reader Voices" (social comments), cloud progress syncing, and a dynamic "Stardust" aesthetic.

## ✨ Key Features

### 🎨 Immersive UI/UX
- **Stardust Vortex Loader**: A custom HTML5 Canvas preloader with particle physics.
- **Hero Stack Carousel**: A unique, gesture-driven card shuffle animation for trending books.
- **Bento Grid System**: Responsive, tilt-effect cards for browsing the library.
- **Thematic Reading**: Toggle between **Dark**, **Light**, and **Sepia** modes for eye comfort.

### 📖 Advanced Reader
- **Phantom Toolbar**: Controls fade away as you read to provide a distraction-free experience.
- **Cloud Sync**: Reading progress is automatically saved to your account and synced across devices.
- **Customization**: Adjustable font sizes and themes directly within the reader.
- **Chapter Navigation**: Collapsible sidebar with Roman numeral chapter tracking.

### 💬 Social & Community
- **Reader Voices**: A deep commenting system allowing users to discuss specific chapters.
  - **Nested Replies**: Unlimited depth for threading conversations.
  - **Likes**: Heart your favorite comments.
- **Role Management**: System supports Readers, Authors (pending approval), and Admins.

### 🔐 Security & Tech
- **Authentication**: Secure login via Google or Email/Password.
- **Real-time Database**: Powered by Firestore for instant updates on comments and content.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), CSS3 (Variables, Grid, Flexbox), HTML5.
- **Backend**: Firebase (Authentication, Firestore).
- **Styling**: Custom CSS with glassmorphism effects and responsive design.
- **Icons**: FontAwesome 6.

## 📂 Project Structure

```text
Novels/
├── auth.js                 # Authentication logic (Google/Email login)
├── comments.js             # Firestore logic for the commenting system
├── firebase-config.js      # Firebase SDK initialization
├── script.js               # Main landing page logic & animations
├── style.css               # Global styles & landing page CSS
├── user-data.js            # User progress & role management
├── WEBSITE_REQUIREMENTS.txt # Project roadmap/requirements
│
└── Fantasy-Novel/          # The Reader Application
    ├── index.html          # (Entry point for reading a book)
    ├── script.js           # Reader logic (Chapters, Progress, UI)
    └── styles.css          # Reader-specific styles
```

## 🚀 Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/bookverse.git
   cd bookverse
   ```

2. **Firebase Configuration**
   - Create a project at [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Google & Email/Password).
   - Enable **Firestore Database**.
   - Copy your web app configuration keys.
   - Open `firebase-config.js` and replace the `firebaseConfig` object with your keys.

3. **Database Setup (Firestore)**
   Create the following collections in your Firestore database:
   - **`books`**: Documents containing book data.
     - Fields: `title` (string), `coverUrl` (string), `chapters` (array of objects `{title, content}`).
   - **`users`**: (Created automatically upon signup).
   - **`comments`**: (Created automatically when comments are posted).

4. **Run Locally**
   Because this project uses ES Modules (`import`/`export`), you must serve it via a local server (opening `index.html` directly won't work due to CORS).
   - **VS Code**: Install the "Live Server" extension and click "Go Live".
   - **Python**: Run `python -m http.server 8000`.

## 🔮 Roadmap

Based on `WEBSITE_REQUIREMENTS.txt`:
- [ ] **Edit Profile**: Allow users to change display names via a settings modal.
- [ ] **Estimated Reading Time**: Calculate read time based on word count (~200 wpm).
- [ ] **Author Dashboard**: Interface for authors to upload chapters directly.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available for educational purposes.