import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';
import { isPostLiked } from '../utils/likeHelpers';
import PostItem from '../components/PostItem';

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const postData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

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
          setLoading(false);
        } catch (err) {
          setError(err.message);
          console.error('Fetch posts error:', err.message);
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Snapshot error:', err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update like count and liked status in state
  const handleLikeUpdate = (postId, newLikedState) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: newLikedState,
              likeCount: newLikedState ? (post.likeCount || 0) + 1 : (post.likeCount || 0) - 1,
            }
          : post
      )
    );
  };

  const renderPost = ({ item }) => <PostItem post={item} onLike={handleLikeUpdate} />;

  if (loading) return <Text>Loading posts...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Foodie Feed</Text>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No posts yet.</Text>}
      />
      <Button title="Create Post" onPress={() => navigation.navigate('CreatePost')} />
      <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      <Button title="Search" onPress={() => navigation.navigate('Search')} />
      <Button title="Logout" onPress={() => auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
});