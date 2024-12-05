import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore'; // Firestore 관련 추가
import { db } from '../firebase/firebase'; // Firestore 연결
import { getAuth } from 'firebase/auth';

export default function ProfileEdit({ navigation, route }) {
  const STORAGE_KEY = 'RUNNING_STYLE';

  // MyPage에서 전달받은 데이터
  const { profile, setProfile } = route.params;

  // 상태 관리
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [statusMessage, setStatusMessage] = useState(
    profile.statusMessage || ''
  );
  const [selectedPace, setSelectedPace] = useState(profile.pace || '');
  const [selectedPlaces, setSelectedPlaces] = useState(profile.places || []);
  const [selectedStyle, setSelectedStyle] = useState(profile.style || '');

  // 모달 상태
  const [isPaceModalVisible, setPaceModalVisible] = useState(false);
  const [isPlaceModalVisible, setPlaceModalVisible] = useState(false);
  const [isStyleModalVisible, setStyleModalVisible] = useState(false);

  // 옵션 데이터
  const paceOptions = [
    '5.0 이하 분/km',
    '5.5 분/km',
    '6.0 분/km',
    '6.0 이상 분/km',
    '잘 모름 분/km',
  ];
  const placeOptions = ['공원', '강변', '호수', '운동장', '트랙'];
  const styleOptions = [
    '대화 없이 달리기',
    '대화하며 달리기',
    '점점 빠르게 달리기',
    '중간중간 쉬며 달리기',
    '일정하게 달리기',
  ];

  // 장소 선택 핸들러
  const togglePlace = (place) => {
    if (selectedPlaces.includes(place)) {
      setSelectedPlaces(selectedPlaces.filter((p) => p !== place));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  // 저장 버튼 동작
  const handleSave = async () => {
    const updatedProfile = {
      nickname,
      statusMessage,
      pace: selectedPace,
      places: selectedPlaces,
      style: selectedStyle,
    };

    try {
      // Firebase Auth에서 현재 사용자 ID 가져오기
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      // Firestore에서 사용자 문서 참조 생성
      const userDocRef = doc(db, 'users', userId);

      // Firestore에 프로필 데이터 저장
      await setDoc(userDocRef, updatedProfile, { merge: true });

      // AsyncStorage에 저장 (기존 코드 유지)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));

      setProfile(updatedProfile); // MyPage 상태 업데이트
      alert('프로필 데이터가 저장되었습니다!');
      navigation.goBack(); // 이전 화면으로 이동
    } catch (error) {
      console.error('Failed to save profile data:', error);
      alert('프로필 데이터 저장에 실패했습니다.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>프로필 수정</Text>
      </View>

      {/* 프로필 섹션 */}
      <View style={styles.profileSection}>
        <View style={styles.profileImagePlaceholder}>
          <Image
            source={require('../../assets/profile.png')}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.genderText}>남성</Text>
        <Text style={styles.birthYearText}>2001년생</Text>
      </View>

      {/* 닉네임 입력 */}
      <View style={styles.inputSection}>
        <Text>닉네임</Text>
        <TextInput
          style={styles.input}
          placeholder="닉네임 입력"
          value={nickname}
          onChangeText={setNickname}
        />
      </View>

      {/* 상태 메시지 입력 */}
      <View style={styles.inputSection}>
        <Text>상태 메시지</Text>
        <TextInput
          style={styles.input}
          placeholder="상태 메시지 입력"
          value={statusMessage}
          onChangeText={setStatusMessage}
        />
      </View>

      {/* 러닝 스타일 */}
      <View style={styles.runningStyleSection}>
        <Text style={styles.sectionTitle}>러닝 스타일</Text>

        {/* 페이스 */}
        <TouchableOpacity
          style={styles.optionBox}
          onPress={() => setPaceModalVisible(true)}
        >
          <Text style={styles.optionText}>
            페이스: {selectedPace || '선택 없음'}
          </Text>
        </TouchableOpacity>
        <Modal isVisible={isPaceModalVisible}>
          <View style={styles.modalContent}>
            {paceOptions.map((pace) => (
              <TouchableOpacity
                key={pace}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedPace(pace);
                  setPaceModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{pace}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>

        {/* 장소 */}
        <TouchableOpacity
          style={styles.optionBox}
          onPress={() => setPlaceModalVisible(true)}
        >
          <Text style={styles.optionText}>
            장소:{' '}
            {selectedPlaces.length > 0
              ? selectedPlaces.join(', ')
              : '선택 없음'}
          </Text>
        </TouchableOpacity>
        <Modal isVisible={isPlaceModalVisible}>
          <View style={styles.modalContent}>
            {placeOptions.map((place) => (
              <TouchableOpacity
                key={place}
                style={styles.modalOption}
                onPress={() => togglePlace(place)}
              >
                <Text
                  style={[
                    styles.modalText,
                    selectedPlaces.includes(place) && styles.selectedModalText,
                  ]}
                >
                  {place}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setPlaceModalVisible(false)}
            >
              <Text style={styles.closeModalText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* 스타일 */}
        <TouchableOpacity
          style={styles.optionBox}
          onPress={() => setStyleModalVisible(true)}
        >
          <Text style={styles.optionText}>
            스타일: {selectedStyle || '선택 없음'}
          </Text>
        </TouchableOpacity>
        <Modal isVisible={isStyleModalVisible}>
          <View style={styles.modalContent}>
            {styleOptions.map((style) => (
              <TouchableOpacity
                key={style}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedStyle(style);
                  setStyleModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{style}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 24,
    color: '#6200ea',
  },
  addPhotoText1: {
    fontSize: 48,
    color: '#6200ea',
  },
  genderText: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 4,
  },
  birthYearText: {
    fontSize: 16,
    color: 'gray',
  },
  inputSection: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  runningStyleSection: {
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionBox: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalText: {
    fontSize: 16,
    color: '#000',
  },
  selectedModalText: {
    fontWeight: 'bold',
    color: '#6200ea',
  },
  closeModalButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 16,
    color: '#6200ea',
  },
  saveButton: {
    backgroundColor: '#6200ea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
