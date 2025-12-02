import axios from 'axios';

// Create a central "client"
const api = axios.create({
    // baseURL: 'http://localhost:8080/api', //  Spring Boot URL local

    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;