import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveLastWeather(data) {
  await AsyncStorage.setItem("last_weather", JSON.stringify(data));
}

export async function getLastWeather() {
  const data = await AsyncStorage.getItem("last_weather");
  return data ? JSON.parse(data) : null;
}

export async function savePreferredCategory(category) {
  await AsyncStorage.setItem("preferred_category", category);
}

export async function getPreferredCategory() {
  return await AsyncStorage.getItem("preferred_category");
}
