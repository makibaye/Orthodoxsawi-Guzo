// utils/authStorage.js
export const storeAuthData = async (authResponse) => {
  try {
    // Store the complete response
    await AsyncStorage.setItem('authData', JSON.stringify(authResponse));
    
    // Store individual items for easy access
    if (authResponse.token) {
      await AsyncStorage.setItem('token', authResponse.token);
    }
    if (authResponse.user) {
      await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));
    }
    
    console.log('✅ Auth data stored successfully');
    return true;
  } catch (error) {
    console.error('❌ Error storing auth data:', error);
    return false;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove(['authData', 'token', 'user']);
    console.log('✅ Auth data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Fallback: check authData
    const authData = await AsyncStorage.getItem('authData');
    if (authData) {
      const parsedAuthData = JSON.parse(authData);
      return parsedAuthData.user || null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return null;
  }
};