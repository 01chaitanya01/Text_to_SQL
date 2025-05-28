import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const connectDB = async (dbConfig) => {
    return axios.post(`${API_URL}/connect`, dbConfig);
};

export const executeQuery = async (query) => {
    return axios.post(`${API_URL}/query`, { query });
};
