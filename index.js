require('dotenv').config();
const express = require('express');
const cors = require('cors');
const request = require('superagent');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.static('public'));

const { GEOCODE_API_KEY, WEATHER_API_KEY, HIKING_API_KEY } = process.env;

async function getLatLong(cityName) {
    const response = await request.get(`https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`);

    const city = response.body[0];

    return {
        formatted_query: city.display_name,
        latitude: city.lat,
        longitude: city.lon
    };
}

app.get('/location', async(req, res) => {
    try {
        const userInput = req.query.search;

        const mungedData = await getLatLong(userInput);
        res.json(mungedData);
    } catch (e) {
        res .status(500).json({ error: e.message });
    }
});

async function getWeather(lat, lon) {
    const response = await request.get(`https://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`);

    const cityForecast = response.body.data;

    const forecastArray = cityForecast.map((weatherItem) => {
        return {
            forecast: weatherItem.weather.description,
            time: new Date(weatherItem.ts * 1000)
        };
    });
    return forecastArray.slice(0, 7);
}

app.get('/weather', async(req, res) => {
    try {
        const userLat = req.query.latitude;
        const userLon = req.query.longitude;

        const mungedData = await getWeather(userLat, userLon);
        res.json(mungedData);
    } catch (e) {
        res .status(500).json({ error: e.message });
    }
});

async function getHikingTrails(lat, lon) {
    const response = await request.get(`https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=200&key=${HIKING_API_KEY}`);

    const hikes = response.body.trails;

    const trails = hikes.map(hike => {
        return {
            trail_url: hike.url,
            name: hike.name,
            location: hike.location,
            condition_date: new Date(hike.conditionDate).toDateString(),
            condition_time: new Date(hike.conditionDate).toTimeString(),
            conditions: hike.conditionStatus,
            stars: hike.stars,
            star_votes: hike.starVotes,
            summary: hike.summary
        };
    });
    return trails;
}

app.get('/trails', async(req, res) => {
    try {
        const userLat = req.query.latitude;
        const userLon = req.query.longitude;

        const mungedData = await getHikingTrails(userLat, userLon);
        res.json(mungedData);
    } catch (e) {
        res .status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
