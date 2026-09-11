const MODEL_API_URL = process.env.MODEL_API_URL;

async function getForecast(sw_lat, sw_lon, ne_lat, ne_lon, date) {
    const url =
        `${MODEL_API_URL}/forecast` +
        `?sw_lat=${sw_lat}` +
        `&sw_lon=${sw_lon}` +
        `&ne_lat=${ne_lat}` +
        `&ne_lon=${ne_lon}` +
        `&date=${date}` +
        `&evaluate=yes`;

    console.log("Calling model API:", url);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Model API failed: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}

module.exports = {
    getForecast
};