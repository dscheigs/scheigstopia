// Stand-in for Node built-ins that OpenCV.js requires only on its Node path
// (see next.config.ts). The browser never reaches that path.
const empty = {};
export default empty;
