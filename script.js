const backendUrl = 'https://cdab491fe16c.ngrok-free.app'; // Replace with your backend URL

const cityNameEl = document.querySelector("#city-name-date");
const tempValueEl = document.querySelector("#temp-value");
const humidityEl = document.querySelector("#humidity");
const windSpeedEl = document.querySelector("#wind-speed");
const searchFormEl = document.querySelector("#search-form");
const searchInputEl = document.querySelector("#search-input");
const loaderEl = document.querySelector("#loader");
const errorContainerEl = document.querySelector("#error-container");
const forecastContainerEl = document.querySelector("#forecast-container");
const historyContainerEl = document.querySelector("#history-container");
const themeSwitcherBtn = document.querySelector("#theme-switcher");

function displayCurrentWeather(data) {
  const currentDate = new Date().toLocaleDateString();
  cityNameEl.textContent = `${data.name} (${currentDate})`;
  tempValueEl.textContent = `${Math.round(data.main.temp)}`;
  humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
  windSpeedEl.textContent = `Wind: ${data.wind.speed} Km/h`;
}

function displayForecast(forecastList) {
  for (let i = 0; i < forecastList.length; i += 8) {
    const dailyForecast = forecastList[i];
    const card = document.createElement("div");
    card.classList.add("forecast-card");
    const date = new Date(dailyForecast.dt_txt);
    const dateEl = document.createElement("h3");
    dateEl.textContent = date.toLocaleDateString();
    const iconCode = dailyForecast.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const iconEl = document.createElement("img");
    iconEl.setAttribute("src", iconUrl);
    iconEl.setAttribute("alt", dailyForecast.weather[0].description);
    iconEl.classList.add("weather-icon");
    const tempEl = document.createElement("p");
    tempEl.textContent = `Temp: ${Math.round(dailyForecast.main.temp)} °C`;
    const humidityEl = document.createElement("p");
    humidityEl.textContent = `Humidity: ${dailyForecast.main.humidity}%`;
    card.append(dateEl, iconEl, tempEl, humidityEl);
    forecastContainerEl.append(card);
  }
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory") || "[]");
  historyContainerEl.innerHTML = "";
  for (const city of history) {
    const historyBtn = document.createElement("button");
    historyBtn.textContent = city;
    historyBtn.classList.add("history-btn");
    historyBtn.setAttribute("data-city", city);
    historyContainerEl.append(historyBtn);
  }
}

function saveCityToHistory(city) {
  if (typeof city !== "string" || !city.trim()) {
    return;
  }
  const historyString = localStorage.getItem("weatherHistory") || "[]";
  let history = JSON.parse(historyString);
  history = history.filter(
    (existingCity) =>
      typeof existingCity === "string" &&
      existingCity.toLowerCase() !== city.toLowerCase()
  );
  history.unshift(city);
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  renderHistory();
}

async function fetchWeather(city) {
  try {
    loaderEl.classList.remove("hidden");
    cityNameEl.textContent = "";
    tempValueEl.textContent = "--";
    humidityEl.textContent = "Humidity: --";
    windSpeedEl.textContent = "Wind Speed: --";
    forecastContainerEl.innerHTML = "";
    errorContainerEl.classList.add("hidden");
    const response = await fetch(`${backendUrl}/api/weather/${city}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "City not found");
    }
    const { currentWeather, forecast } = await response.json();
    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    errorContainerEl.textContent =
      "City not found. Please check the name and try again.";
    errorContainerEl.classList.remove("hidden");
  } finally {
    loaderEl.classList.add("hidden");
  }
}

searchFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = searchInputEl.value.trim();
  if (city) {
    fetchWeather(city);
    searchInputEl.value = "";
  } else {
    console.log("Please enter a city name.");
  }
});

historyContainerEl.addEventListener("click", (event) => {
  if (event.target.matches(".history-btn")) {
    const city = event.target.dataset.city;
    fetchWeather(city);
  }
});

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
}

themeSwitcherBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);
  renderHistory();
});

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      fetchWeatherByCoords(latitude, longitude);
    },
    (error) => {
      console.error("Error getting user location:", error.message);
    }
  );
} else {
  console.log("Geolocation is not available on this browser.");
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    errorContainerEl.classList.add("hidden");
    cityNameEl.textContent = "";
    tempValueEl.textContent = "--";
    humidityEl.textContent = "Humidity: --";
    windSpeedEl.textContent = "Wind Speed: --";
    forecastContainerEl.innerHTML = "";
    loaderEl.classList.remove("hidden");
    const response = await fetch(`${backendUrl}/api/weather/coords?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error("Failed to fetch weather data by coordinates.");
    }
    const { currentWeather, forecast } = await response.json();
    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    errorContainerEl.textContent =
      "Could not fetch weather for your location. Please try searching for a city manually.";
    errorContainerEl.classList.remove("hidden");
  } finally {
    loaderEl.classList.add("hidden");
  }
}

