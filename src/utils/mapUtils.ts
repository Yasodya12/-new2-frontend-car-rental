import axios from 'axios';

// Interfaces
interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

interface OSRMResponse {
    routes: {
        distance: number; // in meters
        duration: number; // in seconds
    }[];
}

export const searchAddress = async (query: string) => {
    try {
        const response = await axios.get<NominatimResult[]>(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 5
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching address:", error);
        return [];
    }
};

export const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
                lat,
                lon: lng,
                format: 'json'
            }
        });
        return response.data.display_name;
    } catch (error) {
        console.error("Error reversing coordinates:", error);
        return "";
    }
};

export const getRouteDistance = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
        // OSRM expects: longitude,latitude
        const start = `${startLng},${startLat}`;
        const end = `${endLng},${endLat}`;

        const response = await axios.get<OSRMResponse>(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=false`);

        if (response.data.routes && response.data.routes.length > 0) {
            const distanceMeters = response.data.routes[0].distance;
            return distanceMeters / 1000; // Convert to km
        }
        return 0;
    } catch (error) {
        console.error("Error fetching route distance:", error);
        return 0;
    }
};
