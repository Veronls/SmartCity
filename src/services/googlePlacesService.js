import { GOOGLE_PLACES_API_KEY } from "./googleConfig";

export async function fetchNearbyGooglePlaces(lat, lng) {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.photos",
      },
      body: JSON.stringify({
        includedTypes: ["restaurant", "cafe", "park", "tourist_attraction"],
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: 1500.0,
          },
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to fetch nearby places");
  }

  return (data.places || []).map((place) => ({
    id: place.id,
    placeId: place.id,
    name: place.displayName?.text || "Unnamed Place",
    address: place.formattedAddress || "No address",
    category: place.primaryType || "place",
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    photoName: place.photos?.[0]?.name || null,
  }));
}

export function buildPlacePhotoUrl(photoName, maxWidth = 400) {
  if (!photoName) return null;

  return `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_PLACES_API_KEY}&maxWidthPx=${maxWidth}`;
}
