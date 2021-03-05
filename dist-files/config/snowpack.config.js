/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  // exclude: [

  // ],
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
  plugins: [
    /* ... */
  ],
  routes: [
    /* Enable an SPA Fallback in development: */
    // {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
    /* Example: Bundle your final build: */
    // "bundle": true,
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    // open: 'none',
    // port: 8081,
  },
  buildOptions: {
    /* ... */
  },
};
