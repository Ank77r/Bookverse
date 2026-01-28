// --- IMPORT FIREBASE ---
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- GLOBAL TOAST NOTIFICATION SYSTEM ---
window.showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    
    // Create Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon Selection
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    // Add to DOM
    container.appendChild(toast);
    
    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
};

// ... (Rest of your existing script.js code below) ...

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. STARDUST VORTEX LOADER (Original Code) ---
    const loaderCanvas = document.getElementById('loader-canvas');
    const loaderCtx = loaderCanvas.getContext('2d');
    const preloader = document.getElementById('preloader');
    const centerContent = document.getElementById('loader-center');
    const statusText = document.getElementById('status-text');

    if (loaderCanvas && preloader) {
        loaderCanvas.width = window.innerWidth;
        loaderCanvas.height = window.innerHeight;
        let loaderParticles = [];
        let loadState = 'gathering'; 
        class LoaderParticle {
            constructor() {
                this.angle = Math.random() * Math.PI * 2;
                this.radius = Math.random() * (loaderCanvas.width * 0.8) + 100;
                this.size = Math.random() * 2 + 0.5;
                this.speed = Math.random() * 0.02 + 0.01;
                this.inwardSpeed = Math.random() * 2 + 1;
                this.color = `rgba(251, 191, 36, ${Math.random()})`;
            }
            update() {
                if (loadState === 'gathering') {
                    this.angle += this.speed;
                    this.radius -= this.inwardSpeed;
                    if (this.radius < 10) {
                        this.radius = Math.random() * (loaderCanvas.width * 0.5) + (loaderCanvas.width * 0.3);
                        this.color = `rgba(251, 191, 36, ${Math.random()})`;
                    }
                } else if (loadState === 'exploding') {
                    this.radius += this.inwardSpeed * 15;
                    this.size *= 0.95;
                }
                this.x = loaderCanvas.width / 2 + Math.cos(this.angle) * this.radius;
                this.y = loaderCanvas.height / 2 + Math.sin(this.angle) * this.radius;
            }
            draw() {
                loaderCtx.fillStyle = this.color;
                loaderCtx.beginPath();
                loaderCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                loaderCtx.fill();
            }
        }
        function initLoader() { loaderParticles = []; for (let i = 0; i < 150; i++) loaderParticles.push(new LoaderParticle()); }
        function animateLoader() {
            loaderCtx.fillStyle = 'rgba(2, 6, 23, 0.2)'; loaderCtx.fillRect(0, 0, loaderCanvas.width, loaderCanvas.height);
            for (let i = 0; i < loaderParticles.length; i++) { loaderParticles[i].update(); loaderParticles[i].draw(); }
            if (preloader.style.display !== 'none') requestAnimationFrame(animateLoader);
        }
        initLoader(); animateLoader();
        setTimeout(() => {
            loadState = 'exploding';
            if(statusText) statusText.innerText = "Ready";
            if(centerContent) centerContent.style.opacity = '0';
            setTimeout(() => {
                document.body.classList.remove('loading'); preloader.classList.add('fade-out');
                setTimeout(() => { preloader.style.display = 'none'; initCounters(); }, 1000);
            }, 600);
        }, 2500); 
    }

    // --- 2. ANIMATIONS & UI ---
    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        const observerOptions = { threshold: 0.1 };
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; const startTime = performance.now();
                    const updateCount = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 4);
                        const currentVal = Math.floor(ease * target);
                        counter.innerText = currentVal.toLocaleString();
                        if (progress < 1) requestAnimationFrame(updateCount);
                        else {
                            if(target >= 1000000) counter.innerText = (target / 1000000) + "M+";
                            else if(target >= 1000) counter.innerText = (target / 1000) + "K+";
                            else counter.innerText = target;
                        }
                    };
                    requestAnimationFrame(updateCount);
                    observer.unobserve(counter);
                }
            });
        }, observerOptions);
        counters.forEach(counter => counterObserver.observe(counter));
    }

    const bgCanvas = document.getElementById('particle-canvas');
    if (bgCanvas) {
        const bgCtx = bgCanvas.getContext('2d');
        bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
        let bgParticles = [];
        class BGParticle {
            constructor() {
                this.x = Math.random() * bgCanvas.width; this.y = Math.random() * bgCanvas.height;
                this.size = Math.random() * 2 + 0.5; this.speedX = Math.random() * 1 - 0.5; this.speedY = Math.random() * 1 - 0.5;
                this.color = 'rgba(251, 191, 36, 0.3)';
            }
            update() {
                this.x += this.speedX; this.y += this.speedY;
                if (this.x > bgCanvas.width) this.x = 0; if (this.x < 0) this.x = bgCanvas.width;
                if (this.y > bgCanvas.height) this.y = 0; if (this.y < 0) this.y = bgCanvas.height;
            }
            draw() { bgCtx.fillStyle = this.color; bgCtx.beginPath(); bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2); bgCtx.fill(); }
        }
        function initBG() { bgParticles = []; for (let i = 0; i < 60; i++) bgParticles.push(new BGParticle()); }
        function animateBG() { bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height); for (let i = 0; i < bgParticles.length; i++) { bgParticles[i].update(); bgParticles[i].draw(); } requestAnimationFrame(animateBG); }
        initBG(); animateBG();
        window.addEventListener('resize', () => { loaderCanvas.width = window.innerWidth; loaderCanvas.height = window.innerHeight; bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; initBG(); });
    }

    const searchTrigger = document.getElementById('searchTrigger');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchSpinner = document.getElementById('searchSpinner');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const authTrigger = document.getElementById('signInTrigger') || document.querySelector('.btn-outline'); 
    const authOverlay = document.getElementById('authOverlay');
    const closeAuth = document.getElementById('closeAuth');
    const authTabs = document.querySelectorAll('.auth-tab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const phoneForm = document.getElementById('phoneForm');
    const backToAuthBtn = document.getElementById('backToAuth');
    const phoneBtns = document.querySelectorAll('.btn-social.phone');

    if(searchTrigger && searchOverlay) {
        searchTrigger.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            setTimeout(() => searchInput.focus(), 100);
        });
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('active');
                hideSearchDropdown();
            }
        });
    }

    // --- PREMIUM SEARCH FUNCTIONALITY ---
    let searchResults = [];
    let searchSelectedIndex = -1;
    let searchTimeout = null;

    function showSearchDropdown() {
        if (searchDropdown) searchDropdown.classList.add('active');
    }
    function hideSearchDropdown() {
        if (searchDropdown) searchDropdown.classList.remove('active');
        searchSelectedIndex = -1;
    }
    function renderSearchResults(results) {
        if (!searchDropdown) return;
        if (!results.length) {
            searchDropdown.innerHTML = '<div class="search-result-item" style="color:var(--text-muted);cursor:default;">No results found.</div>';
            showSearchDropdown();
            return;
        }
        searchDropdown.innerHTML = results.map((book, i) => `
            <div class="search-result-item${i === searchSelectedIndex ? ' selected' : ''}" data-index="${i}">
                <img class="search-result-cover" src="${book.cover}" alt="${book.title}">
                <div class="search-result-meta">
                    <div class="search-result-title">${book.title}</div>
                    <div class="search-result-author">${book.author || ''}</div>
                </div>
            </div>
        `).join('');
        showSearchDropdown();
    }
    function doSearch(query) {
        if (!query || !allBooks.length) {
            searchResults = [];
            renderSearchResults([]);
            return;
        }
        const q = query.trim().toLowerCase();
        searchResults = allBooks.filter(book =>
            book.title.toLowerCase().includes(q) ||
            (book.author && book.author.toLowerCase().includes(q))
        ).slice(0, 8);
        renderSearchResults(searchResults);
    }
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const val = e.target.value;
            if (searchTimeout) clearTimeout(searchTimeout);
            searchSpinner.parentElement.classList.toggle('loading', !!val);
            if (!val) {
                hideSearchDropdown();
                searchSpinner.parentElement.classList.remove('loading');
                return;
            }
            searchTimeout = setTimeout(() => {
                doSearch(val);
                searchSpinner.parentElement.classList.remove('loading');
            }, 250);
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value) doSearch(searchInput.value);
        });
        searchInput.addEventListener('keydown', e => {
            if (!searchResults.length) return;
            if (e.key === 'ArrowDown') {
                searchSelectedIndex = (searchSelectedIndex + 1) % searchResults.length;
                renderSearchResults(searchResults);
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                searchSelectedIndex = (searchSelectedIndex - 1 + searchResults.length) % searchResults.length;
                renderSearchResults(searchResults);
                e.preventDefault();
            } else if (e.key === 'Enter') {
                if (searchSelectedIndex >= 0 && searchResults[searchSelectedIndex]) {
                    window.location.href = `Fantasy-Novel/index.html?book=${searchResults[searchSelectedIndex].id}`;
                }
            } else if (e.key === 'Escape') {
                hideSearchDropdown();
            }
        });
    }
    if (searchDropdown) {
        searchDropdown.addEventListener('mousedown', e => {
            const item = e.target.closest('.search-result-item');
            if (item && item.dataset.index) {
                const idx = parseInt(item.dataset.index);
                if (searchResults[idx]) {
                    window.location.href = `Fantasy-Novel/index.html?book=${searchResults[idx].id}`;
                }
            }
        });
    }
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            hideSearchDropdown();
            searchInput.focus();
        });
    }

    if(authTrigger) {
        authTrigger.addEventListener('click', (e) => { e.preventDefault(); authOverlay.classList.add('active'); });
        if(closeAuth) closeAuth.addEventListener('click', () => { authOverlay.classList.remove('active'); });
        authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) authOverlay.classList.remove('active'); });
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Ensure Phone Form is hidden
                if(phoneForm) phoneForm.style.display = 'none';
                
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const target = tab.getAttribute('data-tab');
                if(target === 'signin') {
                    signinForm.classList.add('active');
                    signupForm.classList.remove('active');
                } else {
                    signupForm.classList.add('active');
                    signinForm.classList.remove('active');
                }
            });
        });

        // Switch to PHONE View
        phoneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                signinForm.classList.remove('active');
                signupForm.classList.remove('active');
                if(phoneForm) phoneForm.style.display = 'block';
            });
        });

        // Back to Main Auth
        if(backToAuthBtn) {
            backToAuthBtn.addEventListener('click', () => {
                if(phoneForm) phoneForm.style.display = 'none';
                signinForm.classList.add('active');
                document.querySelector('.auth-tab[data-tab="signin"]').classList.add('active');
                document.querySelector('.auth-tab[data-tab="signup"]').classList.remove('active');
            });
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchOverlay.classList.contains('active')) searchOverlay.classList.remove('active');
            if (authOverlay.classList.contains('active')) authOverlay.classList.remove('active');
        }
    });

    const themeBtn = document.getElementById('themeToggle');
    const html = document.documentElement;
    const themes = ['dark', 'light', 'sepia'];
    let currentThemeIndex = themes.indexOf(localStorage.getItem('theme')) || 0;
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    html.setAttribute('data-theme', themes[currentThemeIndex]);
    updateThemeIcon(themes[currentThemeIndex]);
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            const newTheme = themes[currentThemeIndex];
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i');
        if(icon) {
            icon.className = ''; 
            if (theme === 'dark') icon.className = 'fas fa-moon';
            else if (theme === 'light') icon.className = 'fas fa-sun';
            else if (theme === 'sepia') icon.className = 'fas fa-coffee';
        }
    }

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; const glow = document.querySelector('.cursor-glow'); if(glow) { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; } });
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => { if (window.scrollY > 30) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled'); });
    const revealElements = document.querySelectorAll('.reveal-up');
    const revealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 });
    revealElements.forEach(el => revealObserver.observe(el));
    const tiltCards = document.querySelectorAll('.tilt-card');
    if (window.matchMedia("(min-width: 900px)").matches) {
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                card.style.transform = `perspective(1000px) rotateX(${y / -20}deg) rotateY(${x / 20}deg) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'; });
        });
    }
});

// --- 3. DYNAMIC BOOK & HERO LOADER ---
let allBooks = [];
let heroIndex = 0;

async function loadBooks() {
    const grid = document.getElementById('home-book-grid');
    if(!grid) return;
    grid.innerHTML = ""; 

    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        
        if(querySnapshot.empty) {
            grid.innerHTML = "<p style='color:var(--text-muted); width:100%; text-align:center;'>No stories found.</p>";
            return;
        }

        allBooks = []; // Reset array
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const cover = data.coverUrl || "https://via.placeholder.com/600x400?text=Book+Cover";
            
            // Push to array for Hero Carousel
            allBooks.push({
                id: doc.id,
                title: data.title,
                cover: cover,
                chapters: data.chapters ? data.chapters.length : 0
            });

            // Featured Grid Item
            const card = document.createElement('a');
            card.href = `Fantasy-Novel/index.html?book=${doc.id}`;
            card.className = "bento-item tilt-card";
            card.style.height = "380px"; 
            
            card.innerHTML = `
                <div class="bento-bg" style="background-image: url('${cover}');"></div>
                <div class="bento-overlay"></div>
                <div class="bento-content">
                    <span class="genre-tag fantasy">READ NOW</span>
                    <h3>${data.title}</h3>
                    <p class="bento-desc">${data.chapters ? data.chapters.length : 0} Chapters</p>
                    <div class="card-meta"><span>View Story</span><span><i class="fas fa-arrow-right text-gold"></i></span></div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Initialize Hero Carousel if we have enough books
        if(allBooks.length > 0) {
            initHeroCarousel();
        }

    } catch (e) {
        console.error("Error loading books:", e);
    }
}

// --- 4. HERO CAROUSEL (SHUFFLE EFFECT) ---
function initHeroCarousel() {
    // Need at least 1 book. If only 1, duplicate it so we can still shuffle
    if(allBooks.length === 1) allBooks.push(allBooks[0]);

    // Initial Setup
    updateStackData();

    // Run Shuffle every 5 seconds
    setInterval(() => {
        performShuffle();
    }, 5000);
}

function updateStackData() {
    const frontImg = document.getElementById('hero-img');
    const frontLink = document.getElementById('stack-front');
    const backCard = document.getElementById('stack-back');
    const badge = document.getElementById('hero-badge');

    if(!frontImg) return;

    // Get Indices
    const currentBook = allBooks[heroIndex];
    const nextIndex = (heroIndex + 1) % allBooks.length;
    const nextBook = allBooks[nextIndex];

    // Set Front Card Data
    frontImg.src = currentBook.cover;
    frontLink.href = `Fantasy-Novel/index.html?book=${currentBook.id}`;
    if(badge) badge.innerText = `Trending #${heroIndex + 1}`;

    // Set Back Card Data (Pre-load the next image)
    backCard.style.backgroundImage = `url('${nextBook.cover}')`;
}

function performShuffle() {
    const backCard = document.getElementById('stack-back');
    const frontImg = document.getElementById('hero-img');
    const frontLink = document.getElementById('stack-front');
    const badge = document.getElementById('hero-badge');

    if (!backCard) return;

    // 1. Add Animation Class to Back Card (It flies to front)
    backCard.classList.add('shuffling');

    // 2. Wait for animation to finish (1.2s defined in CSS)
    setTimeout(() => {
        // --- THE MAGIC SWAP ---
        
        // A. Update Logic Index
        heroIndex = (heroIndex + 1) % allBooks.length;
        const currentBook = allBooks[heroIndex];
        const nextIndex = (heroIndex + 1) % allBooks.length;
        const nextBook = allBooks[nextIndex];

        // B. Instantly update the Front Card to match the card that just landed
        frontImg.src = currentBook.cover;
        frontLink.href = `Fantasy-Novel/index.html?book=${currentBook.id}`;
        if(badge) badge.innerText = `Trending #${heroIndex + 1}`;

        // C. Remove Animation (Back card instantly snaps back to start position)
        // Since Front card now shows the same image, user won't see the snap
        backCard.classList.remove('shuffling');

        // D. Update Back card with the NEW next book
        backCard.style.backgroundImage = `url('${nextBook.cover}')`;

    }, 1200); // Must match CSS animation duration
}

// Start everything
loadBooks();