import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';
import { toggleLike, isPostLiked } from '../utils/likeHelpers';

// Post Item component 
const PostItem = ({ post, onLike }) => {
  const [liked, setLiked] = useState(post.liked || false);

  const handleLike = async () => {
    try {
      const newState = await toggleLike(post.id, post.userId);
      setLiked(newState);
      onLike(post.id, newState); // Update parent state for like count
    } catch (error) {
      console.error('Like error:', error.message);
    }
  };

  return (
    <View style={styles.post}>
      <Text style={styles.dishName}>{post.dishName}</Text>
      <Text>Restaurant: {post.restaurant}</Text>
      <Text>Rating: {post.rating}/5</Text>
      <Text>By: {post.username}</Text>
      <TouchableOpacity onPress={handleLike}>
        <Text>{liked ? '💖 Unlike' : '🤍 Like'} ({post.likeCount || 0})</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Fetch posts from Firestore
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch liked status for all posts in one go
      const likedStatuses = await Promise.all(
        postData.map(async (post) => ({
          id: post.id,
          liked: await isPostLiked(post.id),
        }))
      );

      // Merge liked status into post data
      const updatedPosts = postData.map((post) => {
        const likedStatus = likedStatuses.find((status) => status.id === post.id);
        return { ...post, liked: likedStatus.liked };
      });

      setPosts(updatedPosts);
    });

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

  const renderPost = ({ item }) => (
    <PostItem post={item} onLike={handleLikeUpdate} />
  );

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
      <Button title="Logout" onPress={() => auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  post: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 10 },
  dishName: { fontSize: 18, fontWeight: 'bold' },
});