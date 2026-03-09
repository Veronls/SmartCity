export function getRecommendation(condition, temp) {
  const lower = condition.toLowerCase();

  if (lower.includes("rain")) {
    return {
      clothing: "Bring a rain jacket and waterproof shoes.",
      activity: "Good day to check out a cozy café or indoor spot.",
    };
  }

  if (lower.includes("cloud")) {
    return {
      clothing: "Wear a hoodie or light jacket.",
      activity: "Great weather for a short walk or casual city exploring.",
    };
  }

  if (temp <= 5) {
    return {
      clothing: "Bundle up with a heavy jacket.",
      activity: "Better for indoor plans or quick outdoor stops.",
    };
  }

  if (temp >= 20) {
    return {
      clothing: "Light clothes should be fine.",
      activity: "Perfect day for parks, walking routes, and outdoor exploring.",
    };
  }

  return {
    clothing: "A light layer should be enough.",
    activity: "Nice day for mixed indoor and outdoor activities.",
  };
}
