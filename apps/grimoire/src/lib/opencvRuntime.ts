// OpenCV.js exports a Promise. A bundler's namespace for it can carry that
// Promise's `then`, which makes `await import('@techstark/opencv-js')` throw
// "called on incompatible receiver". Importing it statically here and handing
// it out inside a plain object keeps the namespace free of `then`.
import * as opencv from '@techstark/opencv-js';

export const opencvRuntime = { opencv: opencv as unknown };
