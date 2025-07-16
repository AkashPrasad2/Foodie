import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

export default function ProfileScreen({ route, navigation }) {
  const { userId } = route.params || {}; // May be undefined
  const currentUser = auth.currentUser;
  const viewingOwnProfile = !userId || userId === currentUser.uid;

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = viewingOwnProfile ? currentUser.uid : userId;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };
    fetchUserData();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {userData ? (
        <>
          <Text>Username: {userData.username}</Text>
          <Text>Email: {userData.email}</Text>
          <Text>Bio: {userData.bio}</Text>
        </>
      ) : (
        <Text>Loading...</Text>
      )}

      {viewingOwnProfile ? (
        <>
          <Button title="Liked Posts" onPress={() => navigation.navigate('LikedPosts')} />
          <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />
          <Button title="Logout" onPress={() => auth.signOut()} />
        </>
      ) : (
        <Button title="Follow" onPress={() => alert('Follow coming soon')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
});
