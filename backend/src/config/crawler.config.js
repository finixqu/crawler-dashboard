export const crawlerConfig = {
    tiktok : {
        image: 'registry.infra.ivo.lan/r10/crawler/tiktok:52648a5',
        config: '/home/ivohaki/backdate/tiktok-backdate/config-vpn-tiktok.toml',
        configContainer: '/config-vpn-tiktok.toml',
        command: 'tiktok'
    },

    youtube : {
        image: 'registry.infra.ivo.lan/r10/crawler/youtube:c74db3ec',
        config: '/home/ivohaki/backdate/youtube-backdate/config-vpn-youtube.toml',
        configContainer: '/config-vpn-youtube.toml',
        command: 'youtube',
        networkHost: false
    },

    news : {
        image: 'registry.infra.ivo.lan/r10/crawler/universal-news:0bf7825',
        config: '/home/ivohaki/backdate/news-backdate/config-vpn-news.toml',
        configContainer: '/config-vpn-news.toml',
        command: 'news',
        networkHost: false
    },

    facebook : {
        image: 'registry.infra.ivo.lan/r10/crawler/facebook:1a31427',
        config: '/home/ivohaki/backdate/facebook_crawler/config-vpn-facebook.toml',
        configContainer: '/config-vpn-facebook.toml',
        command: 'facebook_crawler_direct',
        networkHost: true
    },

    instagram : {
        image: 'registry.infra.ivo.lan/r10/crawler/instagram:3178a55',
        config: '/home/ivohaki/backdate/ig-backdate/config-vpn-instagram.toml',
        configContainer: '/app/_private/config-vpn-instagram.toml',
        command: 'instagram',
        networkHost: true
    },

    twitter : {
        image: 'registry.infra.ivo.lan/r10/crawler/twitter:f1b006d',
        config: '/home/ivohaki/backdate/twitter-task/config-vpn-twitter.toml',
        configContainer: '/config-vpn-twitter.toml',
        command: 'basic-worker basic-worker-direct',
        networkHost: false
    },

    threads : {
        image: 'registry.infra.ivo.lan/r10/crawler/threads:1cda3ec',
        config: '/home/ivohaki/backdate/threads/config-threads.toml',
        configContainer: '/config-threads.toml',
        command: 'threads-direct',
        networkHost: true
    }
}