import axios from 'axios';

// İleride bu URL'i .env dosyasından da çekebiliriz
const API_URL = 'http://localhost:8080/api/logs';

export const logService = {
    // İstatistikleri getir
    getStats: async () => {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    },

    // Logları getir (Arama veya Listeleme)
    getLogs: async (page, size, term) => {
        const params = { page, size };
        let url = API_URL;

        if (term && term.trim() !== "") {
            url = `${API_URL}/search`;
            params.term = term;
        }

        const response = await axios.get(url, { params });
        return response.data; // { data: [...], totalCount: 123 }
    },

    // Tekil log detayı getir
    getLogById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    }
};