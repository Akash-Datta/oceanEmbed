function getGridFromLatLng(lat, lon) {
    const GRID_SIZE = 0.25;

    const swLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
    const swLon = Math.floor(lon / GRID_SIZE) * GRID_SIZE;

    const neLat = swLat + GRID_SIZE;
    const neLon = swLon + GRID_SIZE;

    const gridId = `box_${swLat.toFixed(2)}_${swLon.toFixed(2)}`;

    return {
        gridId,
        sw_lat: swLat,
        sw_lon: swLon,
        ne_lat: neLat,
        ne_lon: neLon
    };
}

module.exports = {
    getGridFromLatLng
};