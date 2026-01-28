// --- IMPORTS ---
import { auth, db } from "../firebase-config.js"; 
import { saveProgress as saveToCloud, getProgress as getFromCloud } from "../user-data.js";
import { postComment, subscribeToComments } from "../comments.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- DYNAMIC BOOK ID LOGIC ---
const urlParams = new URLSearchParams(window.location.search);
const urlBookId = urlParams.get('book');
const BOOK_ID = urlBookId ? urlBookId : "fantasy-novel-01";

console.log("Loading Book ID:", BOOK_ID);

// --- STATE ---
let bookData = { chapters: [] };
let currentIndex = 0;
let unsubscribeComments = null;

// --- DOM ELEMENTS ---
const el = {
    scroll: document.getElementById('scroll-container'),
    title: document.getElementById('chapter-title'),
    num: document.getElementById('chapter-num'),
    content: document.getElementById('chapter-content'),
    sidebar: document.querySelector('.sidebar'),
    sidebarList: document.getElementById('chapter-list'),
    toggleBtn: document.getElementById('toggle-sidebar'),
    prev: document.getElementById('prev-btn'),
    next: document.getElementById('next-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    fontSlider: document.getElementById('font-size-slider'),
    toast: document.getElementById('toast'),
    commentList: document.getElementById('comments-list'),
    commentBox: document.getElementById('comment-box'),
    toolbar: document.querySelector('.toolbar'),
    mainStage: document.querySelector('.main-stage')
};

document.addEventListener('DOMContentLoaded', async () => {
    injectProgressBar(); // Inject the reading progress bar
    await loadData();
    setupInteractions();
    setupVoiceComposer();
    initializeProgress();
});

function setupVoiceComposer() {
    const submitBtn = document.getElementById('post-comment-btn');
    const textarea = document.getElementById('comment-box');
    
    submitBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const text = textarea.value;
        
        if (!auth.currentUser) return showToast("Please sign in to share your voice!");
        if (!text.trim()) return showToast("Your voice cannot be empty");
        
        try {
            submitBtn.innerText = "Sharing...";
            submitBtn.disabled = true;
            await postComment(BOOK_ID, currentIndex, text);
            textarea.value = "";
            showToast("Your voice has been shared!");
        } catch (err) { 
            showToast(err.message); 
        } finally {
            submitBtn.innerText = "Share Voice";
            submitBtn.disabled = false;
        }
    });
}

// --- 1. DATA & LOAD ---
async function loadData() {
    try {
        console.log("Connecting to Cloud Library...");
        const docRef = doc(db, "books", BOOK_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            bookData.chapters = data.chapters || [];
            
            // Update Page Title
            document.title = `${data.title} | Read`;
            document.querySelector('.brand-text').innerText = data.title;
            
            console.log("Book loaded successfully!");
        } else {
            console.error("Book not found!");
            el.title.innerText = "Book Not Found";
            el.content.innerHTML = "<p>The book you are looking for does not exist.</p>";
        }
        renderSidebar();
    } catch (e) {
        console.error("Error loading book:", e);
    }
}

// --- 2. PROGRESS SYSTEM ---
function initializeProgress() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const cloudChapter = await getFromCloud(BOOK_ID);
                // Adjust for 0-based index vs 1-based save
                const cloudIndex = (cloudChapter && cloudChapter > 0) ? cloudChapter - 1 : 0;
                currentIndex = cloudIndex;
                if(cloudIndex > 0) showToast(`Resuming Chapter ${cloudIndex + 1}`);
            } catch (err) {
                loadLocalProgress();
            }
        } else {
            loadLocalProgress();
        }
        
        if(bookData.chapters.length > 0) {
            loadChapter(currentIndex);
        }
    });
}

function loadLocalProgress() {
    const saved = localStorage.getItem(`progress_${BOOK_ID}`);
    if (saved) currentIndex = parseInt(saved);
}

function handleSave(index) {
    localStorage.setItem(`progress_${BOOK_ID}`, index);
    if (auth.currentUser) saveToCloud(BOOK_ID, index + 1);
}

// --- 3. RENDERING ---
function renderSidebar() {
    el.sidebarList.innerHTML = '';
    
    if (bookData.chapters.length === 0) {
        el.sidebarList.innerHTML = '<li style="padding:20px; text-align:center;">No chapters found.</li>';
        return;
    }

    bookData.chapters.forEach((chap, i) => {
        const li = document.createElement('li');
        
        const numSpan = document.createElement('span');
        numSpan.className = 'num-icon';
        numSpan.innerText = romanize(i + 1);

        const titleSpan = document.createElement('span');
        titleSpan.className = 'chapter-title-text';
        titleSpan.innerText = chap.title;

        li.appendChild(numSpan);
        li.appendChild(titleSpan);
        
        li.onclick = () => {
            loadChapter(i);
            // On mobile, close sidebar automatically
            if(window.innerWidth < 800) el.sidebar.classList.add('collapsed');
        };
        el.sidebarList.appendChild(li);
    });
}

function loadChapter(index) {
    if (!bookData.chapters[index]) return;

    currentIndex = index;
    handleSave(index);

    // Sidebar Update
    Array.from(el.sidebarList.children).forEach((li, i) => {
        li.classList.toggle('active', i === index);
    });

    // Content Update
    el.scroll.scrollTop = 0;
    el.num.innerText = `CHAPTER ${romanize(index + 1)}`;
    el.title.innerText = bookData.chapters[index].title;
    
    // --- TEXT FORMATTING UPGRADE ---
    let rawContent = bookData.chapters[index].content;
    // 1. Ensure string
    if (Array.isArray(rawContent)) rawContent = rawContent.join('\n');
    else if (!rawContent) rawContent = "";

    // 2. Wrap paragraphs if simple text
    if (!rawContent.includes('<p>')) {
        el.content.innerHTML = rawContent.split('\n')
            .filter(line => line.trim() !== "")
            .map(line => `<p>${line}</p>`)
            .join('');
    } else {
        el.content.innerHTML = rawContent;
    }

    // Buttons
    el.prev.style.visibility = index === 0 ? 'hidden' : 'visible';
    
    if (index === bookData.chapters.length - 1) {
        el.next.innerText = "Finish Book";
        el.next.onclick = () => showToast("You have completed this book!");
    } else {
        el.next.innerText = "Next Chapter";
        el.next.onclick = () => loadChapter(currentIndex + 1);
    }

    // Reload Comments
    loadCommentsForChapter(index);
}

// --- 4. COMMENTS LOGIC ---
import { toggleLikeComment } from "../comments.js";

function loadCommentsForChapter(index) {
    if (unsubscribeComments) {
        unsubscribeComments();
        unsubscribeComments = null;
    }
    el.commentList.innerHTML = `<div class="voices-empty">Loading voices...</div>`;
    unsubscribeComments = subscribeToComments(BOOK_ID, index, (comments) => {
        el.commentList.innerHTML = "";
        if (comments.length === 0) {
            el.commentList.innerHTML = `<div class="voices-empty">No voices yet. Start the conversation.</div>`;
            return;
        }
        comments.forEach(c => {
            el.commentList.appendChild(renderVoiceItem(c));
        });
    });
}

function renderVoiceItem(comment, isReply = false, depth = 0) {
    const voiceItem = document.createElement('div');
    const depthClass = depth > 0 ? `reply depth-${Math.min(depth, 5)}` : '';
    voiceItem.className = `voice-item ${depthClass}`.trim();
    
    let dateStr = "Just now";
    if (comment.createdAt) {
        dateStr = new Date(comment.createdAt.seconds * 1000).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        });
    }

    // Check if user liked
    const userLiked = (comment.likes || []).includes(auth.currentUser?.uid);
    const likeIcon = userLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const likeCount = (comment.likes || []).length;
    const likeClass = userLiked ? 'liked' : '';

    voiceItem.innerHTML = `
        <div class="voice-header">
            <span class="voice-author">${comment.userName}</span>
            <span class="voice-timestamp">${dateStr}</span>
        </div>
        <div class="voice-content">${comment.text}</div>
        <div class="voice-actions">
            <button class="voice-action ${likeClass}" data-comment-id="${comment.id}" title="Like this voice">
                <i class="${likeIcon}"></i>
                <span class="like-count">${likeCount}</span>
            </button>
            <button class="voice-action reply-btn" title="Reply">
                <i class="fa-regular fa-comment"></i>
                Reply
            </button>
        </div>
    `;

    // Like button handler
    const likeBtn = voiceItem.querySelector('[data-comment-id]');
    likeBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await toggleLikeComment(comment.id);
        } catch (err) {
            showToast(err.message);
        }
    });

    // Reply button handler
    const replyBtn = voiceItem.querySelector('.reply-btn');
    replyBtn?.addEventListener('click', () => {
        toggleReplyForm(voiceItem, comment.id);
    });

    // Render nested replies (unlimited depth)
    if (comment.replies && comment.replies.length > 0) {
        const repliesDiv = document.createElement('div');
        repliesDiv.className = 'voice-replies';
        comment.replies.forEach(reply => {
            repliesDiv.appendChild(renderVoiceItem(reply, true, depth + 1));
        });
        voiceItem.appendChild(repliesDiv);
    }

    return voiceItem;
}

function toggleReplyForm(voiceItem, parentCommentId) {
    let form = voiceItem.querySelector('.reply-input-box');
    if (!form) {
        form = document.createElement('div');
        form.className = 'reply-input-box';
        form.innerHTML = `
            <textarea placeholder="What's your response?" rows="2"></textarea>
            <div class="reply-actions">
                <button type="button" class="reply-submit">Share Reply</button>
                <button type="button" class="reply-cancel">Cancel</button>
            </div>
        `;
        voiceItem.appendChild(form);

        const submitBtn = form.querySelector('.reply-submit');
        const cancelBtn = form.querySelector('.reply-cancel');
        const textarea = form.querySelector('textarea');

        submitBtn.addEventListener('click', async () => {
            const replyText = textarea.value;
            if (!auth.currentUser) return showToast("Please sign in to reply.");
            if (!replyText.trim()) return showToast("Reply cannot be empty.");

            try {
                submitBtn.innerText = "Sharing...";
                submitBtn.disabled = true;
                await postComment(BOOK_ID, currentIndex, replyText, parentCommentId);
                textarea.value = "";
                form.classList.remove('active');
                showToast("Your reply has been shared!");
            } catch (err) {
                showToast(err.message);
            } finally {
                submitBtn.innerText = "Share Reply";
                submitBtn.disabled = false;
            }
        });

        cancelBtn.addEventListener('click', () => {
            form.classList.remove('active');
            textarea.value = "";
        });
    }
    form.classList.toggle('active');
}

// --- 5. UI INTERACTIONS (PHANTOM MODE & PROGRESS) ---
function setupInteractions() {
    // Sidebar
    el.toggleBtn.onclick = () => {
        el.sidebar.classList.toggle('collapsed');
        // Update icon based on state
        const icon = el.toggleBtn.querySelector('i');
        icon.className = el.sidebar.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-stream';
    };

    // Settings
    el.settingsBtn.onclick = (e) => {
        e.stopPropagation();
        el.settingsPanel.classList.toggle('active');
        el.settingsBtn.classList.toggle('active');
    };

    document.addEventListener('click', (e) => {
        if (!el.settingsPanel.contains(e.target) && e.target !== el.settingsBtn) {
            el.settingsPanel.classList.remove('active');
            el.settingsBtn.classList.remove('active');
        }
    });

    el.fontSlider.oninput = (e) => {
        document.documentElement.style.setProperty('--reader-font-size', `${e.target.value}px`);
    };

    el.prev.onclick = () => { if (currentIndex > 0) loadChapter(currentIndex - 1); };
    el.next.onclick = () => { if (currentIndex < bookData.chapters.length - 1) loadChapter(currentIndex + 1); };
    
    document.querySelectorAll('.theme-dot').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.theme-dot').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.documentElement.setAttribute('data-theme', btn.dataset.theme);
        };
    });

    // --- PHANTOM TOOLBAR & READING PROGRESS ---
    let lastScrollY = 0;
    const progressBar = document.getElementById('reading-progress');

    el.scroll.addEventListener('scroll', () => {
        const currentScrollY = el.scroll.scrollTop;
        const maxScroll = el.scroll.scrollHeight - el.scroll.clientHeight;
        
        // 1. Update Progress Bar
        if(progressBar && maxScroll > 0) {
            const percentage = (currentScrollY / maxScroll) * 100;
            progressBar.style.width = `${percentage}%`;
        }

        // 2. Phantom Mode Logic (Hide toolbar on scroll down)
        // Only trigger if we've scrolled down a bit to prevent flickering at top
        if (currentScrollY > lastScrollY && currentScrollY > 60) {
            if(el.toolbar) el.toolbar.classList.add('hidden');
            el.settingsPanel.classList.remove('active'); // Close settings if open
        } else {
            if(el.toolbar) el.toolbar.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
    });
}

// --- UTILS ---
function injectProgressBar() {
    // Dynamically add the progress bar to the main stage if not present
    if (!document.getElementById('reading-progress')) {
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-container';
        barContainer.innerHTML = '<div class="progress-bar" id="reading-progress"></div>';
        el.mainStage.appendChild(barContainer);
    }
}

function romanize(num) {
    const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '', i;
    for ( i in lookup ) { while ( num >= lookup[i] ) { roman += i; num -= lookup[i]; } }
    return roman;
}

function showToast(msg) {
    if(!el.toast) return;
    el.toast.innerText = msg;
    el.toast.classList.add('show');
    setTimeout(() => el.toast.classList.remove('show'), 3000);
}