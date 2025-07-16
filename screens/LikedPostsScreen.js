import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { auth, db } from '../firebaseconfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function LikedPostsScreen() {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get all likes by current user
        const q = query(collection(db, 'likes'), where('userId', '==', user.uid));
        const likeDocs = await getDocs(q);

        // Extract postIds from likes
        const likedPostIds = likeDocs.docs.map(doc => doc.data().postId);

        // Fetch all posts in parallel
        const postFetches = likedPostIds.map(async (postId) => {
          const postSnap = await getDoc(doc(db, 'posts', postId));
          return postSnap.exists() ? { id: postId, ...postSnap.data() } : null;
        });

        const posts = await Promise.all(postFetches);
        setLikedPosts(posts.filter(Boolean));
      } catch (error) {
        console.error('Error fetching liked posts:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, []);

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <Text style={styles.dishName}>{item.dishName}</Text>
      <Text>Restaurant: {item.restaurant}</Text>
      <Text>Rating: {item.rating}/5</Text>
      <Text>By: {item.username}</Text>
      <Text>Likes: {item.likeCount || 0}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts You've Liked</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={likedPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          ListEmptyComponent={<Text>You haven't liked any posts yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  post: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 10 },
  dishName: { fontSize: 18, fontWeight: 'bold' },
});
