// --- IMPORT FIREBASE ---
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CUSTOM CONFIRM DIALOG SYSTEM ---
window.showCustomConfirm = function({ message, confirmText = "OK", cancelText = "Cancel", onConfirm, onCancel }) {
    const overlay = document.getElementById('custom-confirm-overlay');
    const msg = document.getElementById('customConfirmMessage');
    const okBtn = document.getElementById('customConfirmOk');
    const cancelBtn = document.getElementById('customConfirmCancel');
    if (!overlay || !msg || !okBtn || !cancelBtn) return;
    msg.textContent = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    overlay.classList.add('active');
    function cleanup() {
        overlay.classList.remove('active');
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        document.onkeydown = null;
    }
    okBtn.onclick = () => { cleanup(); if (onConfirm) onConfirm(); };
    cancelBtn.onclick = () => { cleanup(); if (onCancel) onCancel(); };
    document.onkeydown = (e) => {
        if (e.key === 'Escape') { cleanup(); if (onCancel) onCancel(); }
    };
};

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
        <button class="toast-close" title="Close" aria-label="Close"><i class="fas fa-times"></i></button>
    `;
    // Add to DOM
    container.appendChild(toast);
    // Close button logic
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => toast.remove());
        };
    }
    // Remove after 3.5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => toast.remove());
        }
    }, 3500);
};

// --- DOM READY INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
        // --- PROFILE MENU LOGIC ---
        import('./firebase-config.js').then(({ auth }) => {
            import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js').then(({ onAuthStateChanged, signOut }) => {
                const profileMenuContainer = document.getElementById('profileMenuContainer');
                const profileBtn = document.getElementById('profileBtn');
                const profileAvatar = document.getElementById('profileAvatar');
                const profileDropdown = document.getElementById('profileDropdown');
                const profileDropdownName = document.getElementById('profileDropdownName');
                const profileDropdownEmail = document.getElementById('profileDropdownEmail');
                const profileDropdownProfile = document.getElementById('profileDropdownProfile');
                const profileDropdownLogout = document.getElementById('profileDropdownLogout');
                const profileDropdownSwitch = document.getElementById('profileDropdownSwitch');
                const profileDropdownNotifications = document.getElementById('profileDropdownNotifications');

                let userData = null;

                function showProfileMenu(show) {
                    if (!profileMenuContainer) return;
                    if (show) profileMenuContainer.classList.add('open');
                    else profileMenuContainer.classList.remove('open');
                }

                // Toggle dropdown
                if (profileBtn) {
                    profileBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (profileMenuContainer.classList.contains('open')) showProfileMenu(false);
                        else showProfileMenu(true);
                    });
                }
                document.addEventListener('click', (e) => {
                    if (!profileMenuContainer.contains(e.target)) showProfileMenu(false);
                });

                // Auth state
                onAuthStateChanged(auth, (user) => {
                    userData = user;
                    if (user) {
                        // Show avatar or initials
                        if (user.photoURL) {
                            profileAvatar.classList.remove('guest');
                            profileAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
                        } else if (user.displayName) {
                            const initials = user.displayName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                            profileAvatar.classList.remove('guest');
                            profileAvatar.textContent = initials;
                        } else {
                            profileAvatar.classList.remove('guest');
                            profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
                        }
                        profileDropdownName.textContent = user.displayName || 'User';
                        profileDropdownEmail.textContent = user.email || '';
                    } else {
                        profileAvatar.classList.add('guest');
                        profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
                        profileDropdownName.textContent = 'Guest';
                        profileDropdownEmail.textContent = '';
                    }
                });

                // Profile click
                if (profileDropdownProfile) {
                    profileDropdownProfile.addEventListener('click', () => {
                        if (userData) {
                            window.location.href = 'profile.html';
                        } else {
                            showProfileMenu(false);
                            document.getElementById('authOverlay').classList.add('active');
                        }
                    });
                }
                // Notifications click
                if (profileDropdownNotifications) {
                    profileDropdownNotifications.addEventListener('click', () => {
                        showProfileMenu(false);
                        window.showToast('Notifications coming soon!', 'info');
                    });
                }
                // Switch account
                if (profileDropdownSwitch) {
                    profileDropdownSwitch.addEventListener('click', () => {
                        showProfileMenu(false);
                        document.getElementById('authOverlay').classList.add('active');
                    });
                }
                // Logout
                if (profileDropdownLogout) {
                    profileDropdownLogout.addEventListener('click', async () => {
                        await signOut(auth);
                        showProfileMenu(false);
                        window.showToast('Signed out successfully.', 'success');
                    });
                }
                // If guest, clicking avatar opens sign in
                if (profileAvatar) {
                    profileAvatar.addEventListener('click', () => {
                        if (!userData) {
                            showProfileMenu(false);
                            document.getElementById('authOverlay').classList.add('active');
                        }
                    });
                }
            });
        });
    
    // --- 1. STARDUST VORTEX LOADER ---
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

    // --- UI TOGGLES (SEARCH / AUTH / THEME) ---
    const searchTrigger = document.getElementById('searchTrigger');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    
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
        searchTrigger.addEventListener('click', () => { searchOverlay.classList.add('active'); setTimeout(() => searchInput.focus(), 100); });
        searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) searchOverlay.classList.remove('active'); });
    }

    if(authTrigger) {
        authTrigger.addEventListener('click', (e) => { e.preventDefault(); authOverlay.classList.add('active'); });
        if(closeAuth) closeAuth.addEventListener('click', () => { authOverlay.classList.remove('active'); });
        authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) authOverlay.classList.remove('active'); });
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
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

    // --- BOOK PREVIEW MODAL CLOSE LOGIC ---
    const bookPreviewOverlay = document.getElementById('bookPreviewOverlay');
    const closePreviewBtn = document.getElementById('closePreview');

    if(closePreviewBtn && bookPreviewOverlay) {
        closePreviewBtn.addEventListener('click', () => {
            bookPreviewOverlay.classList.remove('active');
        });
        bookPreviewOverlay.addEventListener('click', (e) => {
            if(e.target === bookPreviewOverlay) bookPreviewOverlay.classList.remove('active');
        });
    }

    // GLOBAL ESCAPE KEY HANDLER
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchOverlay.classList.contains('active')) searchOverlay.classList.remove('active');
            if (authOverlay.classList.contains('active')) authOverlay.classList.remove('active');
            if (bookPreviewOverlay && bookPreviewOverlay.classList.contains('active')) bookPreviewOverlay.classList.remove('active');
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

    // Initialize Search
    initSearch();
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
            
            // Collect Data
            const bookObj = {
                id: doc.id,
                title: data.title || "Untitled Story",
                author: data.author || "Unknown Author",
                cover: cover,
                chapters: data.chapters ? data.chapters.length : 0,
                blurb: data.description || "Enter a world of imagination. No description has been added for this story yet.",
                genre: data.genre || "Fantasy",
                rating: data.rating || "New"
            };

            allBooks.push(bookObj);

            // Featured Grid Item
            const card = document.createElement('a');
            card.href = "javascript:void(0)"; // Prevent default
            card.className = "bento-item tilt-card";
            card.style.height = "380px"; 
            
            // Click Event to Open Modal
            card.onclick = () => openBookPreview(bookObj);

            card.innerHTML = `
                <div class="bento-bg" style="background-image: url('${cover}');"></div>
                <div class="bento-overlay"></div>
                <div class="bento-content">
                    <span class="genre-tag fantasy">${bookObj.genre}</span>
                    <h3>${bookObj.title}</h3>
                    <p class="bento-desc">${bookObj.chapters} Chapters</p>
                    <div class="card-meta"><span>Read Preview</span><span><i class="fas fa-arrow-right text-gold"></i></span></div>
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

// --- 4. OPEN BOOK PREVIEW MODAL (ENHANCED SAAS LOGIC) ---
function openBookPreview(book) {
    const overlay = document.getElementById('bookPreviewOverlay');
    
    // Elements to populate
    const backdrop = document.getElementById('previewBackdropVisual');
    const pCover = document.getElementById('previewCover');
    const pTitle = document.getElementById('previewTitle');
    const pAuthor = document.getElementById('previewAuthor');
    const pAuthorImg = document.getElementById('previewAuthorImg');
    const pGenre = document.getElementById('previewGenre');
    const pRating = document.getElementById('previewRating');
    const pBlurb = document.getElementById('previewBlurb');
    const badgeCount = document.getElementById('chapterCountBadge');
    const startBtn = document.getElementById('startReadingBtn');
    
    if(!overlay) return;

    // 1. POPULATE DATA
    pCover.src = book.cover;
    // Set dynamic blurred backdrop
    if(backdrop) backdrop.style.backgroundImage = `url('${book.cover}')`;
    
    pTitle.textContent = book.title;
    pAuthor.textContent = book.author;
    if(pAuthorImg) pAuthorImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=random&color=fff`;
    
    if(pGenre) pGenre.innerHTML = `<i class="fas fa-circle-notch"></i> ${book.genre}`;
    if(pRating) pRating.textContent = book.rating;
    
    if(pBlurb) pBlurb.textContent = book.blurb;
    if(badgeCount) badgeCount.innerText = book.chapters;

    // 2. RESET TABS TO "OVERVIEW"
    const tabs = document.querySelectorAll('.tab-item');
    const panes = document.querySelectorAll('.tab-pane');
    const indicator = document.querySelector('.tab-indicator');
    
    // Reset active classes
    tabs.forEach(t => t.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    
    // Set first tab active
    if(tabs.length > 0) {
        tabs[0].classList.add('active');
        panes[0].classList.add('active');
        // Initial indicator position
        updateTabIndicator(tabs[0], indicator);
    }

    // 3. TAB CLICK LOGIC (Reactive)
    tabs.forEach(tab => {
        tab.onclick = () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            // Activate clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Slide the underline indicator
            updateTabIndicator(tab, indicator);
        };
    });

    // 4. SET BUTTON ACTION
    if(startBtn) {
        startBtn.onclick = () => {
            // Add a micro-interaction before navigating
            startBtn.style.transform = "scale(0.95)";
            setTimeout(() => {
                 window.location.href = `Fantasy-Novel/index.html?book=${book.id}`;
            }, 150);
        };
    }

    // 5. SHOW MODAL
    overlay.classList.add('active');
}

// Helper to slide the tab indicator
function updateTabIndicator(activeTab, indicator) {
    if(!activeTab || !indicator) return;
    // Wait for layout to ensure width is calculated
    requestAnimationFrame(() => {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
    });
}

// --- 5. SEARCH FUNCTIONALITY (REINSTATED) ---
// --- 5. SEARCH FUNCTIONALITY (WITH KEYBOARD NAVIGATION) ---
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchOverlay = document.getElementById('searchOverlay');
    const clearBtn = document.getElementById('searchClearBtn');
    const searchContainer = document.querySelector('.search-bar-premium');

    let selectedIndex = -1; // Track keyboard selection

    if (!searchInput || !searchDropdown) return;

    // A. Event Listener for Typing
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Reset selection on new input
        selectedIndex = -1; 

        // UI: Show loading spinner briefly
        if(searchContainer) {
            searchContainer.classList.add('loading');
            setTimeout(() => searchContainer.classList.remove('loading'), 300);
        }

        if (query.length === 0) {
            searchDropdown.innerHTML = '';
            searchDropdown.classList.remove('active');
            return;
        }

        const results = allBooks.filter(book => {
            const titleMatch = book.title.toLowerCase().includes(query);
            const authorMatch = book.author.toLowerCase().includes(query);
            const genreMatch = book.genre.toLowerCase().includes(query);
            return titleMatch || authorMatch || genreMatch;
        });

        renderSearchResults(results);
    });

    // B. Keyboard Navigation Listener (Arrow Keys & Enter)
    searchInput.addEventListener('keydown', (e) => {
        // Get all currently visible result items
        const items = searchDropdown.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault(); // Stop cursor moving in input
            selectedIndex++;
            if (selectedIndex >= items.length) selectedIndex = 0; // Loop to top
            updateSelection(items);
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex--;
            if (selectedIndex < 0) selectedIndex = items.length - 1; // Loop to bottom
            updateSelection(items);
        } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1 && items[selectedIndex]) {
                items[selectedIndex].click(); // Trigger the click event
            }
        }
    });

    // Helper: Update Visual Classes
    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                // Ensure the item is visible in the scroll area
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // C. Clear Button Logic
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchDropdown.classList.remove('active');
            searchInput.focus();
            selectedIndex = -1;
        });
    }

    // D. Render Helper
    function renderSearchResults(results) {
        searchDropdown.innerHTML = ''; 
        selectedIndex = -1; // Reset index on new render

        if (results.length === 0) {
            // Note: We use a different class here so keyboard nav doesn't select "No results"
            searchDropdown.innerHTML = `
                <div class="search-no-result" style="padding: 14px 22px; color: var(--text-muted); display: flex; align-items: center; gap: 10px;">
                    <i class="far fa-sad-tear"></i> <span>No stories found.</span>
                </div>`;
            searchDropdown.classList.add('active');
            return;
        }

        results.forEach((book, index) => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            // Add mouse hover support to update index
            item.onmouseenter = () => {
                const allItems = searchDropdown.querySelectorAll('.search-result-item');
                allItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedIndex = index; // Sync mouse with keyboard
            };

            item.innerHTML = `
                <img src="${book.cover}" class="search-result-cover" alt="cover">
                <div class="search-result-meta">
                    <div class="search-result-title">${book.title}</div>
                    <div class="search-result-author">by ${book.author}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
                openBookPreview(book);
            });

            searchDropdown.appendChild(item);
        });

        searchDropdown.classList.add('active');
    }
}


// --- 6. HERO CAROUSEL (SHUFFLE EFFECT) ---
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
    
    // Hero card opens Modal
    frontLink.href = "javascript:void(0)";
    frontLink.onclick = (e) => {
        e.preventDefault();
        openBookPreview(currentBook);
    };

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

    // 1. Add Animation Class to Back Card
    backCard.classList.add('shuffling');

    // 2. Wait for animation to finish
    setTimeout(() => {
        // A. Update Logic Index
        heroIndex = (heroIndex + 1) % allBooks.length;
        const currentBook = allBooks[heroIndex];
        const nextIndex = (heroIndex + 1) % allBooks.length;
        const nextBook = allBooks[nextIndex];

        // B. Instantly update the Front Card
        frontImg.src = currentBook.cover;
        
        frontLink.onclick = (e) => {
            e.preventDefault();
            openBookPreview(currentBook);
        };

        if(badge) badge.innerText = `Trending #${heroIndex + 1}`;

        // C. Remove Animation
        backCard.classList.remove('shuffling');

        // D. Update Back card
        backCard.style.backgroundImage = `url('${nextBook.cover}')`;

    }, 1200); 
}

// Start everything
loadBooks();