import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Fetch post details
    const postRef = doc(db, 'posts', postId);
    getDoc(postRef).then((doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() });
      }
    });

    // Fetch comments in real-time
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentData);
    });
    return unsubscribe;
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty.');
      return;
    }

    try {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';

      await addDoc(collection(db, 'posts', postId, 'comments'), {
        userId: user.uid,
        username,
        content: newComment,
        timestamp: new Date(),
      });

      setNewComment('');
      Alert.alert('Success', 'Comment added!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.comment}>
      <Text style={styles.commentUser}>{item.username}</Text>
      <Text>{item.content}</Text>
    </View>
  );

  if (!post) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{post.dishName}</Text>
      <Text>Restaurant: {post.restaurant}</Text>
      <Text>Rating: {post.rating}/5</Text>
      <Text>Likes: {post.likeCount || 0}</Text>
      <Text style={styles.subtitle}>Comments</Text>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No comments yet.</Text>}
      />
      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        value={newComment}
        onChangeText={setNewComment}
      />
      <Button title="Post Comment" onPress={handleAddComment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  comment: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  commentUser: { fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});