import { auth, db } from './firebaseconfig';
import { doc, getDoc, setDoc, deleteDoc, increment, updateDoc } from 'firebase/firestore';

export async function toggleFollow(targetUserId) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  if (user.uid === targetUserId) return; // cannot follow self

  const followId = `${user.uid}_${targetUserId}`;
  const followRef = doc(db, 'follows', followId);

  const existing = await getDoc(followRef);

  if (existing.exists()) {
    // unfollow
    await deleteDoc(followRef);

    await updateDoc(doc(db, 'users', targetUserId), {
      followerCount: increment(-1),
    });

    await updateDoc(doc(db, 'users', user.uid), {
      followingCount: increment(-1),
    });

    return false;
  } else {
    // follow
    await setDoc(followRef, {
      followerId: user.uid,
      followingId: targetUserId,
      timestamp: new Date(),
    });

    await updateDoc(doc(db, 'users', targetUserId), {
      followerCount: increment(1),
    });

    await updateDoc(doc(db, 'users', user.uid), {
      followingCount: increment(1),
    });

    return true;
  }
}

export async function isFollowing(targetUserId) {
  const user = auth.currentUser;
  if (!user) return false;

  const followId = `${user.uid}_${targetUserId}`;
  const followRef = doc(db, 'follows', followId);
  const docSnap = await getDoc(followRef);
  return docSnap.exists();
}
