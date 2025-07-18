import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { toggleLike } from '../utils/likeHelpers';

const PostItem = ({ post, onLike }) => {
  const [liked, setLiked] = useState(post.liked || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLike = async () => {
    setLoading(true);
    setError(null);
    try {
      const newState = await toggleLike(post.id, post.userId);
      setLiked(newState);
      if (onLike) {
        onLike(post.id, newState); // Update parent state if callback provided
      }
    } catch (error) {
      setError(error.message);
      console.error('Like error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.post}>
      <Text style={styles.dishName}>{post.dishName}</Text>
      <Text>Restaurant: {post.restaurant}</Text>
      <Text>Rating: {post.rating}/5</Text>
      <Text>By: {post.username}</Text>
      <TouchableOpacity onPress={handleLike} disabled={loading}>
        <Text>
          {loading ? 'Processing...' : liked ? '💖 Unlike' : '🤍 Like'} (
          {post.likeCount || 0})
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  post: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 10 },
  dishName: { fontSize: 18, fontWeight: 'bold' },
  error: { color: 'red', marginTop: 5 },
});

export default PostItem;