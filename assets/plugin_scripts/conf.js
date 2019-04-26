"use strict";
if (CC_DEBUG) {
  var backendAddress = {
    PROTOCOL: 'http',
    HOST: '192.168.31.139',
    PORT: "9992",
    WS_PATH_PREFIX: "/cuisineconn",
  };
} else {
  /* development */
  //var backendAddress = {
  //  PROTOCOL: 'https',
  //  HOST: 'merdan.lokcol.com',
  //  PORT: "443",
  //  WS_PATH_PREFIX: "/cuisineconn",
  //}
  /* production */
  var backendAddress = {
    PROTOCOL: 'https',
    HOST: 'foodieclans.lokcol.com',
    PORT: "443",
    WS_PATH_PREFIX: "/cuisineconn",
  }
}
window.mainServerBackendAddress = backendAddress;
window.backendAddress = backendAddress;
