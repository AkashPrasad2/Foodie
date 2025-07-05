import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postData);
    });
    return unsubscribe;
  }, []);

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <Text style={styles.dishName}>{item.dishName}</Text>
      <Text>Restaurant: {item.restaurant}</Text>
      <Text>Rating: {item.rating}/5</Text>
      <Text>By: {item.username}</Text>
    </View>
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