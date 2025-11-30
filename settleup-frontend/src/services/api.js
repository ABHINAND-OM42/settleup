import axios from 'axios';

// Create a central "client"
const api = axios.create({
    // baseURL: 'http://localhost:8080/api', // Your Spring Boot URL

    baseURL: '/api', // <--- CHANGED FROM http://localhost:8080/api
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;