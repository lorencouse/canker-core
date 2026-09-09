// Stand-in for the native `canvas` package. konva's Node entry point requires
// it for server-side rendering, but every konva component here is client-only,
// so that path is never taken. See next.config.mjs.
module.exports = {};
