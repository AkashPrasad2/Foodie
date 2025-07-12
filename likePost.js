import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from './firebaseconfig';

export async function toggleLike(postId) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const likeDocId = `${user.uid}_${postId}`;
  const likeRef = doc(db, 'likes', likeDocId);
  const postRef = doc(db, 'posts', postId);

  const existing = await getDoc(likeRef);

  if (existing.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(postRef, {
      likeCount: increment(-1),
    });
    return false;
  } else {
    await setDoc(likeRef, {
      userId: user.uid,
      postId,
      timestamp: new Date(),
    });
    await updateDoc(postRef, {
      likeCount: increment(1),
    });
    return true;
  }
}
