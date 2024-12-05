import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Firestore 연결
import RunningBlock from './RunningBlock';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Vector Icons 사용

export default function Home({ navigation, route }) {
  const [runningList, setRunningList] = useState([]);
  const [refreshing, setRefreshing] = useState(false); // 새로고침 상태

  // Firestore에서 러닝 리스트 가져오는 함수
  const loadRunningList = useCallback(async () => {
    try {
      console.log('Loading running list from Firestore...');
      const querySnapshot = await getDocs(collection(db, 'runnings'));
      const fetchedRunningList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // 문서 ID 포함
        ...doc.data(), // 문서 데이터
      }));
      setRunningList(fetchedRunningList); // 상태 업데이트
    } catch (error) {
      console.error('Failed to load running list from Firestore:', error);
    }
  }, []);

  useEffect(() => {
    // 컴포넌트가 처음 렌더링될 때 러닝 리스트 불러오기
    loadRunningList();

    // 화면이 focus될 때마다 러닝 리스트 갱신
    const unsubscribe = navigation.addListener('focus', loadRunningList);
    return () => unsubscribe();
  }, [navigation, loadRunningList]);

  // 새로고침 핸들러
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRunningList();
    setRefreshing(false);
  }, [loadRunningList]);

  const handleAddRunning = () => {
    navigation.navigate('CreateRunning'); // CreateRunning 화면으로 이동
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 러닝 리스트 출력 */}
        {runningList.map((item) => (
          <RunningBlock
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('RunningDetail', { item })}
          />
        ))}
      </ScrollView>
      {/* 러닝 추가 버튼 */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddRunning}>
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE7F6', // 연보라색 배경
    paddingHorizontal: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#7C4DFF', // 연보라 계열
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  runningblock: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: '#7C4DFF',
    borderRightColor: '#7C4DFF',
    shadowColor: '#000', // 그림자 색상
    shadowOffset: { width: 0, height: 2 }, // 그림자의 위치
    shadowOpacity: 0.2, // 그림자의 불투명도
    shadowRadius: 6, // 그림자의 퍼짐 정도
    elevation: 8, // 안드로이드에서의 그림자 효과
    marginVertical: 10, // 세로 여백 추가
  },
  runningblockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
