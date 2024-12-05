import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Button,
	BackHandler,
	Alert,
	TouchableOpacity,
	Image,
	StyleSheet,
	ScrollView,
	RefreshControl, Text

} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Firestore 연결
import RunningBlock from './RunningBlock';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Vector Icons 사용

export default function Home({ navigation, route }) {
	const [runningList, setRunningList] = useState([]);
	const [refreshing, setRefreshing] = useState(false); // 새로고침

	// AsyncStorage에 저장된 러닝정보객체를 담아둔 배열를 불러와서 runningList 상태에 저장하는 함수 loadRunningList
	// useCallback을 사용하여 함수를 선언 -> 컴포넌트가 처음 렌더링될 때만 함수를 생성 & 이 함수의 불필요한 재렌더링 방지
	const loadRunningList = useCallback(async () => {
		try {
			console.log('Loading running list from storage...');
			// AsyncStorage에서 runningList 키에 해당하는 값인 러닝정보객체를 불러옴
			const storedRunningList = await AsyncStorage.getItem('runningList');
			if (storedRunningList) {
				// JSON.parse를 사용하여 ayncStorage의 저장형태인 JSON 문자열을 -> js객체로 변환
				const parsedList = JSON.parse(storedRunningList);
				// 저장소에서 얻어온 러닝정보객체배열을 runningList 상태값에 저장
				setRunningList(parsedList);
			} else {
				console.log('No running list found in storage.');
			}
		} catch (error) {
			console.error('Failed to load running list from storage:', error);
		}
	}, []);

	useEffect(() => {
		// 화면이 처음 렌더링될 때 loadRunningList 함수를 실행.
		loadRunningList();

		// 화면이 focus될 때마다 loadRunningList 함수를 실행. 즉, 화면이 focus될 때마다 AsyncStorage에서 러닝정보를 불러와서 runningList 상태에 저장.
		//포커스를 받는다는 것은 화면이 보여지는 상태를 의미. 즉, 사용자가 다른 화면으로 이동했다가 다시 이 화면으로 돌아올 때 최신상태의 러닝정보를 불러오기 위함
		// focus 이벤트헨들러는 컴포넌트가 처음 렌더링될 떄는 호출되지 않음. so, 위에서 loadRunningList(); 를 호출해준 것.
		//so, loadRunningList(); => 첫 렌더링시 호출, focus 이벤트핸들러 => 다시 화면으로 돌아올 때 호출
		const unsubscribe = navigation.addListener('focus', loadRunningList);
		return () => unsubscribe();
	}, [navigation]);

	{ /* 러닝방 리스트를 날짜순으로 정렬하는 함수 */ }
	// const sortRunningListByDate = () => {
	// 	const sortedList = [...runningList].sort((a, b) => new Date(a.date.replace(/(\d+)\.(\d+)\.(\d+).*/, '$1-$2-$3')) - new Date(b.date.replace(/(\d+)\.(\d+)\.(\d+).*/, '$1-$2-$3'))); //Date 객체로 변환해서 -> 연산으로 날짜 차이 계산.
	// 	setRunningList(sortedList);
	// };

	{ /* 러닝방 리스트를 날짜+시간순으로 정렬하는 함수 */ }
	const sortRunningListByDateTime = () => {
		const sortedList = [...runningList].sort((a, b) => {
			const [aDate] = a.date.split(' ');
			const [aYear, aMonth, aDay] = aDate.split('.');
			const [aAmPm, aTime] = a.time.split(' ');
			const [aHour, aMin] = aTime.split(':');

			const [bDate] = b.date.split(' ');
			const [bYear, bMonth, bDay] = bDate.split('.');
			const [bAmPm, bTime] = b.time.split(' ');
			const [bHour, bMin] = bTime.split(':');

			// 오전/오후에 따라 시간 값 판단
			const aHourJudge = aAmPm === '오후' && aHour !== '12' ? parseInt(aHour) + 12 : parseInt(aHour);
			const bHourJudge = bAmPm === '오후' && bHour !== '12' ? parseInt(bHour) + 12 : parseInt(bHour);

			const aTimeInMillis = new Date(aYear, aMonth - 1, aDay, aHourJudge, aMin).getTime();
			const bTimeInMillis = new Date(bYear, bMonth - 1, bDay, bHourJudge, bMin).getTime();

			return aTimeInMillis - bTimeInMillis;
		});
		setRunningList(sortedList);
	};



	useEffect(() => {
		const updateRunningList = async () => {
			if (route.params?.runningData) {
				const newRunningData = route.params.runningData;

				try {
					const storedRunningList = await AsyncStorage.getItem('runningList');
					const parsedList = storedRunningList
						? JSON.parse(storedRunningList)
						: [];
					const updatedList = [...parsedList, newRunningData];

					//console.log('Updated running list:', updatedList);
					await AsyncStorage.setItem(
						'runningList',
						JSON.stringify(updatedList)
					); // AsyncStorage는 비동기적임. await 사용해서 비동기 처리해주자

					navigation.setParams({ runningData: null }); // 파라미터 초기화

					// 추가한 후에 다시 리스트를 로드
					loadRunningList();
				} catch (error) {
					console.error('Failed to update running list:', error);
				}
			}
		};

		updateRunningList();
		console.log(AsyncStorage.getItem('runningList'));
	}, [route.params?.runningData]);

	// 뒤로가기용 useEffect
	useEffect(() => {
		const backAction = () => {
			Alert.alert('Hold on!', 'Do you want to go back to the login screen?', [
				{
					text: 'Cancel',
					onPress: () => null,
					style: 'cancel',
				},
				{
					text: 'YES',
					onPress: () => navigation.navigate('Login'),
				},
			]);
			return true; // 기본 뒤로가기 동작 취소
		};

		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction
		);

		return () => backHandler.remove();
	}, [navigation]);

	const handleAddRunning = () => {
		navigation.navigate('CreateRunning'); // CreateRunning 화면으로 이동
	};

	// 새로고침시 러닝 리스트 최신화
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadRunningList();
		setRefreshing(false);
	}, [loadRunningList]);

	return (
		<View style={styles.container}>
			{/*<Button title="날짜순 정렬" onPress={sortRunningListByDate} />*/}
			<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
				<TouchableOpacity style={styles.topButton} onPress={sortRunningListByDateTime}>
					<Text style={styles.topButtonText}>곧 시작하는 러닝순</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.topButton} onPress={sortRunningListByDateTime}>
					<Text style={styles.topButtonText}>곧 시작하는 러닝순</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.topButton} onPress={sortRunningListByDateTime}>
					<Text style={styles.topButtonText}>곧 시작하는 러닝순</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.topButton} onPress={sortRunningListByDateTime}>
					<Text style={styles.topButtonText}>곧 시작하는 러닝순</Text>
				</TouchableOpacity>
				{/* 다른 버튼들 추가 */}
			</ScrollView>
			<ScrollView
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{runningList.map((item) => (
					<RunningBlock
						style={styles.runningblock}
						key={item.id}
						item={item}
						onPress={() => navigation.navigate('RunningDetail', { item })}
					/> // key prop = 랜덤값, 러닝방 클릭시 RunningDetail로 이동
				))}
			</ScrollView>
			<TouchableOpacity style={styles.addButton} onPress={handleAddRunning}>
				<Text><Icon name="plus" size={28} color="#FFFFFF" />{/* 플러스 아이콘 */}</Text>
			</TouchableOpacity>
		</View>
	);
}

	addButton: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		backgroundColor: '#7C4DFF',
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

	/// 상단 버튼 스타일
	horizontalScroll: {
		marginVertical: 5,
	},
	topButton: {
		backgroundColor: '#7C4DFF',
		padding: 10,
		borderRadius: 8,
		marginHorizontal: 5,
		alignItems: 'center',
	},
	topButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	/////

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

		// 그림자 효과 추가
		shadowColor: '#000', // 그림자 색상
		shadowOffset: { width: 0, height: 2 }, // 그림자의 위치
		shadowOpacity: 0.2, // 그림자의 불투명도
		shadowRadius: 6, // 그림자의 퍼짐 정도
		elevation: 8, // 안드로이드에서의 그림자 효과

		// 그림자 효과가 강화된 상태
		marginVertical: 10, // 세로 여백 추가
	},

	runningblockTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
});
