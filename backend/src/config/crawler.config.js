export const crawlerConfig = {
    tiktok: {
        image: process.env.TIKTOK_IMAGE,
        config: process.env.TIKTOK_CONFIG_PATH,
        configContainer: '/config-vpn-tiktok.toml',
        command: 'tiktok'
    },

    youtube: {
        image: process.env.YOUTUBE_IMAGE,
        config: process.env.YOUTUBE_CONFIG_PATH,
        configContainer: '/config-vpn-youtube.toml',
        command: 'youtube',
        networkHost: false
    },

    news: {
        image: process.env.NEWS_IMAGE,
        config: process.env.NEWS_CONFIG_PATH,
        configContainer: '/config-vpn-news.toml',
        command: 'news',
        networkHost: false
    },

    facebook: {
        image: process.env.FACEBOOK_IMAGE,
        config: process.env.FACEBOOK_CONFIG_PATH,
        configContainer: '/config-vpn-facebook.toml',
        command: 'facebook_crawler_direct',
        networkHost: true
    },

    instagram: {
        image: process.env.INSTAGRAM_IMAGE,
        config: process.env.INSTAGRAM_CONFIG_PATH,
        configContainer: '/app/_private/config-vpn-instagram.toml',
        command: 'instagram',
        networkHost: true
    },

    twitter: {
        image: process.env.TWITTER_IMAGE,
        config: process.env.TWITTER_CONFIG_PATH,
        configContainer: '/config-vpn-twitter.toml',
        command: 'basic-worker basic-worker-direct',
        networkHost: false
    },

    threads: {
        image: process.env.THREADS_IMAGE,
        config: process.env.THREADS_CONFIG_PATH,
        configContainer: '/config-threads.toml',
        command: 'threads-direct',
        networkHost: true
    }
};