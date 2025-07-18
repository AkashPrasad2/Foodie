import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';
import { toggleFollow, isFollowing } from '../utils/followHelpers';
import { isPostLiked } from '../utils/likeHelpers';
import PostItem from '../components/PostItem';

export default function ProfileScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const currentUser = auth.currentUser;
  const viewingOwnProfile = !userId || userId === currentUser?.uid;

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setError('Please log in.');
        setLoading(false);
        return;
      }

      try {
        const uid = viewingOwnProfile ? currentUser.uid : userId;
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          setUserData({
            ...userDoc.data(),
            followerCount: userDoc.data().followerCount || 0,
            followingCount: userDoc.data().followingCount || 0,
          });

          // Fetch user's posts
          const q = query(collection(db, 'posts'), where('userId', '==', uid));
          const snapshot = await getDocs(q);
          const postData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Fetch liked status for posts
          const likedStatuses = await Promise.all(
            postData.map(async (post) => ({
              id: post.id,
              liked: await isPostLiked(post.id),
            }))
          );

          const updatedPosts = postData.map((post) => ({
            ...post,
            liked: likedStatuses.find((status) => status.id === post.id)?.liked || false,
          }));

          setPosts(updatedPosts);

          // Check follow status
          if (!viewingOwnProfile) {
            const following = await isFollowing(uid);
            setIsFollowingUser(following);
          }
        } else {
          setError('User not found.');
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
        console.error('Profile fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) {
      alert('Please log in to follow users.');
      return;
    }
    try {
      const newState = await toggleFollow(userId);
      setIsFollowingUser(newState);
      setUserData((prev) => ({
        ...prev,
        followerCount: newState ? prev.followerCount + 1 : prev.followerCount - 1,
      }));
    } catch (error) {
      alert(error.message);
      console.error('Follow error:', error.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {userData ? (
        <>
          <Text style={styles.username}>@{userData.username}</Text>
          <Text>Email: {userData.email}</Text>
          <Text>Bio: {userData.bio || 'No bio yet'}</Text>
          <Text>Followers: {userData.followerCount}</Text>
          <Text>Following: {userData.followingCount}</Text>
          {!viewingOwnProfile && (
            <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
              <Text style={styles.followButtonText}>
                {isFollowingUser ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Posts</Text>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostItem post={item} />}
            ListEmptyComponent={<Text>No posts yet.</Text>}
          />
        </>
      ) : (
        <Text>User data not found.</Text>
      )}

      {viewingOwnProfile ? (
        <>
          <Button title="Liked Posts" onPress={() => navigation.navigate('LikedPosts')} />
          <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
          <Button title="Logout" onPress={() => auth.signOut()} />
        </>
      ) : (
        <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, marginTop: 10, marginBottom: 10 },
  username: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  followButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  followButtonText: { color: '#fff', fontSize: 16 },
});