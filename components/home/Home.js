import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Text,
  Modal, // Modal 컴포넌트 추가
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Firestore 연결
import RunningBlock from './RunningBlock';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Vector Icons 사용
import { isToday, isTomorrow, isWithinInterval, addDays } from 'date-fns';

export default function Home({ navigation, route }) {
  const [runningList, setRunningList] = useState([]);
  const [refreshing, setRefreshing] = useState(false); // 새로고침 상태
  const [modalVisible, setModalVisible] = useState(false); // Modal 표시 여부 상태
  const [selectedDateFilter, setSelectedDateFilter] = useState(null); // 선택된 날짜 필터 상태
  const [filteredRunningList, setFilteredRunningList] = useState([]); // 필터링된 러닝 리스트 상태

  // Firestore에서 러닝 리스트 가져오는 함수
  const loadRunningList = useCallback(async () => {
    try {
      console.log('Loading running list from Firestore...');
      const querySnapshot = await getDocs(collection(db, 'runnings'));
      const fetchedRunningList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // 문서 ID 포함
        ...doc.data(), // 문서 데이터
      }));
      console.log('Fetched running list:', fetchedRunningList); // 러닝 리스트 출력
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

  // 날짜 필터링 Modal을 표시해주는 함수
  const showDateFilterModal = () => {
    setModalVisible(true);
  };

  // 날짜 필터링 버튼 클릭시 함수
  const handleDateFilterChange = (filter) => {
    setSelectedDateFilter(filter);
    setModalVisible(false); // Modal 닫아줌
  };

  // 날짜 필터링 함수
  useEffect(() => {
    const today = new Date();
    let filteredList = [];

    const filterDate = (dateString) => {
      const [year, month, day] = dateString.split(' ')[0].split('.');
      return new Date(year, month - 1, day);
    };

    if (selectedDateFilter === '오늘') {
      filteredList = runningList.filter(item => isToday(filterDate(item.date)));
    } else if (selectedDateFilter === '내일') {
      filteredList = runningList.filter(item => isTomorrow(filterDate(item.date)));
    } else if (selectedDateFilter === '일주일') {
      filteredList = runningList.filter(item =>
        isWithinInterval(filterDate(item.date), { start: today, end: addDays(today, 7) }) // 7일간의 범위
      );
    } else {
      filteredList = runningList;
    }

    setFilteredRunningList(filteredList);
  }, [selectedDateFilter, runningList]);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 날짜 필터 버튼 */}
        <TouchableOpacity style={styles.dateFilterButton} onPress={showDateFilterModal}>
          <Text style={styles.dateFilterButtonText}>
            {selectedDateFilter ? selectedDateFilter : '날짜'}
          </Text>
          <Icon name="chevron-down" size={20} color="#333" />
        </TouchableOpacity>

        {/* 날짜 필터 Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>날짜</Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleDateFilterChange('오늘')}>
                <Text style={styles.modalButtonText}>오늘</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleDateFilterChange('내일')}>
                <Text style={styles.modalButtonText}>내일</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleDateFilterChange('일주일')}>
                <Text style={styles.modalButtonText}>일주일</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleDateFilterChange(null)}>
                <Text style={styles.modalButtonText}>전체</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 러닝 리스트 출력 (필터링 적용) */}
        {filteredRunningList.map((item) => (
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
  // 날짜 필터 버튼 스타일
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  dateFilterButtonText: {
    fontSize: 16,
    marginRight: 5,
  },

  // Modal 스타일
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtonText: {
    fontSize: 16,
  },
});