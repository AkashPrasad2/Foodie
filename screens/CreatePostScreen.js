import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

export default function CreatePostScreen({ navigation }) {
  const [dishName, setDishName] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [rating, setRating] = useState('');
  const [description, setDescription] = useState('');

  const handleCreatePost = async () => {
    if (!dishName || !restaurant || !rating) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const user = auth.currentUser;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const username = userDocSnap.exists() ? userDocSnap.data().username : 'Anonymous';
      
      if (!user) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        username,
        dishName,
        restaurant,
        rating: parseInt(rating),
        description,
        timestamp: new Date(),
      });

      Alert.alert('Success', 'Post created!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Post</Text>
      <TextInput
        style={styles.input}
        placeholder="Dish Name"
        value={dishName}
        onChangeText={setDishName}
      />
      <TextInput
        style={styles.input}
        placeholder="Restaurant"
        value={restaurant}
        onChangeText={setRestaurant}
      />
      <TextInput
        style={styles.input}
        placeholder="Rating (1-5)"
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <Button title="Submit Post" onPress={handleCreatePost} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});