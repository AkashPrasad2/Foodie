import { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebaseconfig';

export async function toggleLike(postId, postAuthorId) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to like posts.');
  }
  if (user.uid === postAuthorId) {
    throw new Error("You can't like your own post.");
  }

  const likeId = `${user.uid}_${postId}`;
  const likeRef = doc(db, 'likes', likeId);
  const postRef = doc(db, 'posts', postId);

  console.log(`Toggling like: user=${user.uid}, post=${postId}, likeId=${likeId}`);

  const likeDoc = await getDoc(likeRef);
  console.log(`Like exists: ${likeDoc.exists()}`);

  try {
    if (likeDoc.exists()) {
      // Unlike
      await deleteDoc(likeRef);
      console.log(`Deleted like: ${likeId}`);
      await updateDoc(postRef, {
        likeCount: increment(-1),
      });
      console.log(`Decremented likeCount for post: ${postId}`);
      return false; 
    } else {
      // Like
      await setDoc(likeRef, {
        userId: user.uid,
        postId,
        timestamp: new Date(),
      });
      console.log(`Created like: ${likeId}`);
      await updateDoc(postRef, {
        likeCount: increment(1),
      });
      console.log(`Incremented likeCount for post: ${postId}`);
      return true; 
    }
  } catch (error) {
    console.error(`Toggle like failed: ${error.message}`);
    throw error;
  }
}

export async function isPostLiked(postId) {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in for isPostLiked check');
    return false;
  }

  const likeId = `${user.uid}_${postId}`;
  const likeRef = doc(db, 'likes', likeId);
  const likeDoc = await getDoc(likeRef);

  console.log(`Checked like: ${likeId}, exists: ${likeDoc.exists()}`);
  return likeDoc.exists();
}