module.exports = {
    title: "Jam's blog",
    base: '/blog/',
    description: 'This is a blog example built by VuePress',
    // theme: '@vuepress/theme-blog', // OR shortcut: @vuepress/blog
    themeConfig: {
        dateFormat: 'YYYY-MM-DD',
        /**
         * Ref: https://vuepress-theme-blog.ulivz.com/#modifyblogpluginoptions
         */
        modifyBlogPluginOptions(blogPluginOptions) {
            return blogPluginOptions;
        },
        /**
         * Ref: https://vuepress-theme-blog.ulivz.com/#nav
         */
        nav: [
            {
                text: 'Blog',
                link: '/'
            },
            {
                text: 'Tags',
                link: '/tag/'
            }
        ],
        /**
         * Ref: https://vuepress-theme-blog.ulivz.com/#footer
         */
        footer: {
            contact: [
                {
                    type: 'github',
                    link: 'https://github.com/guojam'
                }
            ],
            copyright: [
                {
                    text: 'Privacy Policy',
                    link: 'https://policies.google.com/privacy?hl=en-US'
                },
                {
                    text: 'MIT Licensed | Copyright © 2020-present Vue.js',
                    link: ''
                }
            ]
        }
    }
};
