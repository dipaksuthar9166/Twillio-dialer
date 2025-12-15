// src/utils/auth-helpers.js

export const API_BASE_URL = 'http://localhost:3001/api';

// यह फ़ंक्शन सुनिश्चित करता है कि 'userId' key का उपयोग किया जाए
export const getAuthHeaders = () => {
    // 🔑 FIX: Login component द्वारा stored 'userId' key को पढ़ें
    const userId = localStorage.getItem('userId'); 

    // Bearer token format में Headers सेट करें
    return userId ? { 
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json' 
    } : { 'Content-Type': 'application/json' };
};

// fetchWithRetry Utility (Authentication Headers का उपयोग करता है)
export const fetchWithRetry = async (url, options = {}, retries = 3) => {
    options.headers = { ...options.headers, ...getAuthHeaders() };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);

            if (response.status === 401 || response.status === 403) {
                // Authentication विफल होने पर Session clear करें
                localStorage.clear();
                window.location.reload(); 
                throw new Error("Authentication Failed/Session expired.");
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API error: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed for ${url}:`, error.message);
            if (i === retries - 1) {
                throw new Error(`Failed to fetch ${url} after ${retries} attempts.`);
            }
            // Simple backoff delay
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); 
        }
    }
};