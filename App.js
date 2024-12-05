import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './components/login/Login';
import MainApp from './components/MainApp';
import Register from './components/login/Register';
import { Image } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
	return (
		<NavigationContainer>
			<Stack.Navigator
				screenOptions={{
					headerTitle: () => (
						<Image
							source={require('./assets/applogo.png')} // logo.png 이미지 경로
							style={{ width: 129, height: 50 }} // 이미지 크기 조절
						/>
					),
				}}
			>
				{/*<Stack.Screen name="Login" component={Login} />*/}
				{/*<Stack.Screen name="Register" component={Register} />*/}
				<Stack.Screen name="MainApp" component={MainApp} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
