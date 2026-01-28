import { auth, db } from "./firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SAVE PROGRESS FUNCTION ---
// Call this when user finishes a chapter
// bookId: unique name like 'fantasy-novel-1'
// chapterNum: number like 5
export async function saveProgress(bookId, chapterNum) {
    const user = auth.currentUser;
    
    if (user) {
        try {
            // We create a reference to the user's personal "folder" in the database
            const userRef = doc(db, "users", user.uid);

            // We save the data. "merge: true" means we don't delete their other book data
            await setDoc(userRef, {
                [bookId]: {
                    lastChapter: chapterNum,
                    lastRead: new Date()
                }
            }, { merge: true });

            console.log(`Success! Saved Chapter ${chapterNum} for book ${bookId}`);
        } catch (error) {
            console.error("Error saving progress:", error);
        }
    } else {
        console.log("User not logged in. Cannot save progress.");
    }
}

// --- LOAD PROGRESS FUNCTION ---
// Call this when the book page loads to see where they left off
export async function getProgress(bookId) {
    const user = auth.currentUser;
    
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Check if they have data for THIS specific book
                if (data[bookId]) {
                    return data[bookId].lastChapter;
                }
            }
        } catch (error) {
            console.error("Error loading progress:", error);
        }
    }
    return 1; // Default to Chapter 1 if they are new or not logged in
}

// --- ROLE MANAGEMENT ---

// 1. Request to become an Author
export async function requestAuthorAccess() {
    const user = auth.currentUser;
    if (!user) return alert("Please sign in first.");

    const userRef = doc(db, "users", user.uid);
    
    // Set status to 'pending'
    await setDoc(userRef, {
        role: "pending", // Waiting for your approval
        email: user.email,
        requestDate: new Date()
    }, { merge: true });
}

// 2. Check if user is allowed to write
export async function checkUserRole() {
    const user = auth.currentUser;
    if (!user) return "guest";

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        // Returns: 'reader', 'pending', 'author', or 'admin'
        return docSnap.data().role || "reader";
    }
    return "reader";
}