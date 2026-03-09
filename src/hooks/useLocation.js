import { useEffect, useState } from "react";
import * as Location from "expo-location";

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function getCurrentLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("Location permission status:", status);

        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        console.log("Current location:", currentLocation.coords);

        setLocation(currentLocation);
      } catch (error) {
        console.log("Location error:", error);
        setErrorMsg("Failed to get location");
      }
    }

    getCurrentLocation();
  }, []);

  return { location, errorMsg };
}
