import { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebaseconfig';

export async function toggleFollow(followingId) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to follow users.');
  }
  if (user.uid === followingId) {
    throw new Error("You can't follow yourself.");
  }

  const followId = `${user.uid}_${followingId}`;
  const followRef = doc(db, 'follows', followId);
  const followerRef = doc(db, 'users', user.uid); // Current user's document
  const followingRef = doc(db, 'users', followingId); // Target user's document

  console.log(`Toggling follow: follower=${user.uid}, following=${followingId}, followId=${followId}`);

  const followDoc = await getDoc(followRef);
  console.log(`Follow exists: ${followDoc.exists()}`);

  try {
    if (followDoc.exists()) {
      // Unfollow
      await deleteDoc(followRef);
      console.log(`Deleted follow: ${followId}`);
      await updateDoc(followerRef, {
        followingCount: increment(-1),
      });
      await updateDoc(followingRef, {
        followerCount: increment(-1),
      });
      console.log(`Decremented counts for users: ${user.uid}, ${followingId}`);
      return false;
    } else {
      // Follow
      await setDoc(followRef, {
        followerId: user.uid,
        followingId,
        timestamp: new Date(),
      });
      console.log(`Created follow: ${followId}`);
      await updateDoc(followerRef, {
        followingCount: increment(1),
      });
      await updateDoc(followingRef, {
        followerCount: increment(1),
      });
      console.log(`Incremented counts for users: ${user.uid}, ${followingId}`);
      return true;
    }
  } catch (error) {
    console.error(`Toggle follow failed: ${error.message}`);
    throw error;
  }
}

export async function isFollowing(followingId) {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user logged in for isFollowing check');
    return false;
  }

  const followId = `${user.uid}_${followingId}`;
  const followRef = doc(db, 'follows', followId);
  const followDoc = await getDoc(followRef);

  console.log(`Checked follow: ${followId}, exists: ${followDoc.exists()}`);
  return followDoc.exists();
}