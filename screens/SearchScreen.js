import React, { useState } from 'react';
import {View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig';

export default function SearchScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (text) => {
    setSearch(text);

    if (text.trim().length === 0) {
      setResults([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', text),
        where('username', '<=', text + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setResults(users);
    } catch (err) {
      console.error('Search error:', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
      style={styles.userItem}
    >
      <Text style={styles.username}>@{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Users</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by username"
        value={search}
        onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No matching users found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 10, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  userItem: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    marginBottom: 8,
  },
  username: { fontSize: 16 },
});
