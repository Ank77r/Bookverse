
import { db, auth } from "./firebase-config.js";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    getDoc,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COMMENTS_COLLECTION = "comments";


// --- 1. POST A COMMENT OR REPLY ---
// parentId: if provided, this is a reply to another comment
export async function postComment(bookId, chapterIndex, text, parentId = null) {
    const user = auth.currentUser;
    if (!user) throw new Error("You must be logged in to comment.");
    if (!text.trim()) throw new Error("Comment cannot be empty.");
    try {
        await addDoc(collection(db, COMMENTS_COLLECTION), {
            bookId: bookId,
            chapterIndex: chapterIndex,
            text: text,
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            createdAt: serverTimestamp(),
            parentId: parentId || null,
            likes: [], // Array of userIds who liked
        });
        console.log(`Comment${parentId ? ' reply' : ''} posted to Book: ${bookId}, Chapter: ${chapterIndex}`);
    } catch (error) {
        console.error("Error posting comment:", error);
        throw error;
    }
}

// --- 2. LISTEN FOR COMMENTS (with unlimited nested replies) ---
export function subscribeToComments(bookId, chapterIndex, callback) {
    // Listen for all comments for this book/chapter
    const q = query(
        collection(db, COMMENTS_COLLECTION),
        where("bookId", "==", bookId),
        where("chapterIndex", "==", chapterIndex)
    );
    return onSnapshot(q, (snapshot) => {
        const comments = [];
        snapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        
        // Build nested structure recursively
        function buildNested(parentId = null) {
            return comments
                .filter(c => (c.parentId || null) === parentId)
                .map(c => ({
                    ...c,
                    replies: buildNested(c.id)
                }))
                .sort((a, b) => {
                    const timeA = a.createdAt ? a.createdAt.seconds : Date.now()/1000;
                    const timeB = b.createdAt ? b.createdAt.seconds : Date.now()/1000;
                    return timeB - timeA;
                });
        }
        
        const topLevel = buildNested(null);
        callback(topLevel);
    });
}

// --- 3. LIKE/UNLIKE A COMMENT ---
export async function toggleLikeComment(commentId) {
    const user = auth.currentUser;
    if (!user) throw new Error("You must be logged in to like comments.");
    const ref = doc(db, COMMENTS_COLLECTION, commentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Comment not found.");
    const data = snap.data();
    const liked = (data.likes || []).includes(user.uid);
    await updateDoc(ref, {
        likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
    return !liked;
}