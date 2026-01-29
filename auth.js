import { auth, db } from "./firebase-config.js";
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. GOOGLE LOGIN ---
const provider = new GoogleAuthProvider();
const googleBtns = document.querySelectorAll('.btn-social.google');

googleBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            await checkAndCreateUser(result.user);
            closeModal();
            window.showToast(`Welcome back, ${result.user.displayName}!`, "success");
        } catch (error) {
            console.error("Google Login Error:", error);
            if (error.code === 'auth/unauthorized-domain') {
                window.showToast("Domain not authorized. Add to Firebase Console.", "error");
            } else {
                window.showToast(error.message, "error");
            }
        }
    });
});


// --- 2. EMAIL/PASSWORD SIGN UP ---
const signupForm = document.querySelector('#signupForm .auth-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = signupForm.querySelector('input[type="text"]').value;
        const email = signupForm.querySelector('input[type="email"]').value;
        const password = signupForm.querySelector('input[type="password"]').value;
        const btn = signupForm.querySelector('button');

        try {
            btn.innerText = "Creating Account...";
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            // Manually add Display Name
            credential.user.displayName = name;
            await checkAndCreateUser(credential.user);

            // Send email verification
            if (credential.user && !credential.user.emailVerified) {
                // Dynamically import sendEmailVerification
                const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                await sendEmailVerification(credential.user);
                window.showToast("Verification email sent! Please check your inbox.", "info");
            }
            closeModal();
        } catch (error) {
            console.error("Signup Error:", error);
            window.showToast(error.message, "error");
        } finally {
            btn.innerText = "Create Account";
        }
    });
}

// --- 3. EMAIL/PASSWORD SIGN IN ---
const signinForm = document.querySelector('#signinForm .auth-form');
if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signinForm.querySelector('input[type="email"]').value;
        const password = signinForm.querySelector('input[type="password"]').value;
        const btn = signinForm.querySelector('button');

        try {
            btn.innerText = "Signing in...";
            const credential = await signInWithEmailAndPassword(auth, email, password);
            // Check if email is verified
            if (!credential.user.emailVerified) {
                // Dynamically import sendEmailVerification
                const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
                await sendEmailVerification(credential.user);
                window.showToast("Please verify your email address. A new verification email has been sent.", "error");
                btn.innerText = "Sign In";
                return;
            }
            await checkAndCreateUser(credential.user);
            closeModal();
            window.showToast("Welcome back!", "success");
        } catch (error) {
            console.error("Signin Error:", error);
            window.showToast("Invalid email or password.", "error");
        } finally {
            btn.innerText = "Sign In";
        }
    });
}


// --- 5. UTILITIES ---
async function checkAndCreateUser(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email || "",
            phone: user.phoneNumber || "",
            displayName: user.displayName || "Reader",
            role: "reader",
            createdAt: serverTimestamp()
        });
    }
}

function closeModal() {
    const modal = document.getElementById('authOverlay');
    if(modal) modal.classList.remove('active');
}

// Listen for Login State
onAuthStateChanged(auth, (user) => {
    const navBtn = document.getElementById('signInTrigger'); 
    
    if (user && navBtn) {
        navBtn.innerText = "Sign Out";
        navBtn.style.borderColor = "#fbbf24"; 
        navBtn.style.color = "#fbbf24";
        
        navBtn.onclick = (e) => {
            e.preventDefault();
            // Custom in-app confirmation instead of browser confirm
            if (window.showCustomConfirm) {
                window.showCustomConfirm({
                    message: "Are you sure you want to sign out?",
                    confirmText: "Sign Out",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        signOut(auth).then(() => {
                            window.showToast("Signed out successfully.", "info");
                            setTimeout(() => window.location.reload(), 1000);
                        });
                    }
                });
            } else {
                // fallback to toast if custom confirm not available
                window.showToast("Signed out successfully.", "info");
                signOut(auth).then(() => setTimeout(() => window.location.reload(), 1000));
            }
        };
    } else if (navBtn) {
        navBtn.innerText = "Sign In";
        navBtn.style.borderColor = "";
        navBtn.style.color = "";
        navBtn.onclick = (e) => {
            e.preventDefault();
            document.getElementById('authOverlay').classList.add('active');
        };
    }
});