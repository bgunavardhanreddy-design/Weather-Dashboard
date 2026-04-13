// Get your free API key from: https://openweathermap.org/api
// Replace 'YOUR_API_KEY' below with your actual API key
const API_KEY = 'YOUR_API_KEY'; // 🔴 REPLACE THIS with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastDiv = document.getElementById('forecast');
const recentSearchesDiv = document.getElementById('recentSearches');
const errorMsgDiv = document.getElementById('errorMsg');

// Store recent searches in localStorage
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
        saveRecentCity(city);
    } else {
        showError('Please enter a city name');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

currentLocationBtn.addEventListener('click', getCurrentLocationWeather);

// Fetch weather data
async function getWeatherData(city) {
    try {
        showError(''); // Clear previous errors
        
        // Fetch current weather
        const currentRes = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentRes.ok) {
            throw new Error('City not found');
        }
        
        const currentData = await currentRes.json();
        
        // Fetch 5-day forecast
        const forecastRes = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastRes.json();
        
        // Update UI
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        
        // Show sections
        currentWeatherDiv.style.display = 'block';
        forecastDiv.style.display = 'block';
        
    } catch (error) {
        showError(error.message);
        currentWeatherDiv.style.display = 'none';
        forecastDiv.style.display = 'none';
    }
}

// Display current weather
function displayCurrentWeather(data) {
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('condition').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} km/h`;
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
}

// Display 5-day forecast
function displayForecast(data) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    // Get one forecast per day (every 8th entry = 24 hours)
    const dailyForecasts = data.list.filter((item, index) => index % 8 === 0);
    
    dailyForecasts.slice(0, 5).forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="forecast-condition">${forecast.weather[0].description}</div>
        `;
        
        forecastGrid.appendChild(forecastCard);
    });
}

// Get weather for current location
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(
                    `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                );
                const data = await res.json();
                getWeatherData(data.name);
                saveRecentCity(data.name);
                cityInput.value = data.name;
            } catch (error) {
                showError('Unable to get weather for your location');
            }
        },
        () => {
            showError('Unable to retrieve your location. Please allow location access.');
        }
    );
}

// Save recent searches
function saveRecentCity(city) {
    // Remove if already exists
    recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
    // Add to beginning
    recentCities.unshift(city);
    // Keep only last 5
    recentCities = recentCities.slice(0, 5);
    // Save to localStorage
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
    // Update UI
    displayRecentSearches();
}

// Display recent searches
function displayRecentSearches() {
    if (recentCities.length > 0) {
        recentSearchesDiv.style.display = 'block';
        const recentList = document.getElementById('recentList');
        recentList.innerHTML = '';
        
        recentCities.forEach(city => {
            const recentItem = document.createElement('div');
            recentItem.className = 'recent-item';
            recentItem.textContent = city;
            recentItem.addEventListener('click', () => {
                cityInput.value = city;
                getWeatherData(city);
            });
            recentList.appendChild(recentItem);
        });
    } else {
        recentSearchesDiv.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    if (message) {
        errorMsgDiv.textContent = message;
        errorMsgDiv.style.display = 'block';
        setTimeout(() => {
            errorMsgDiv.style.display = 'none';
        }, 3000);
    } else {
        errorMsgDiv.style.display = 'none';
    }
}

// Load recent searches on page load
displayRecentSearches();

// Optional: Load default city on startup
// getWeatherData('London');