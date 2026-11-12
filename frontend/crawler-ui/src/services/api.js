import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,

    headers: {
        'Content-Type': 'application/json'
    }
})

let refreshPromise = null

api.interceptors.response.use(
    //function
    response => response,

    async error => {
        const originalRequest = error.config

        const status = error.response?.status

        const excludedUrls = [
            '/auth/login',
            '/auth/refresh',
            '/auth/me',
            '/auth/logout'
        ]

        const isAuthRequest = excludedUrls.some(url =>
            originalRequest?.url?.includes(url)
        )

        if (
            status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthRequest
        ) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
            if (!refreshPromise) {
                refreshPromise = api.post('/auth/refresh')
                    .finally(() => {
                        refreshPromise = null
                    })
            }

            await refreshPromise

            return api(originalRequest)

        } catch (refreshError) {
            if (window.location.pathname !== '/login') {
                window.location.assign('/login')
            }

            return Promise.reject(refreshError)
        }
    }
)

export default api