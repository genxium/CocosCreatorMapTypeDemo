'use strict';

var NetworkUtils = NetworkUtils || {};
window.NetworkUtils = NetworkUtils;

NetworkUtils.isFunction = function(o) {
  return typeof o == "function" || false;
};

NetworkUtils.isObject = function(o) {
  var type = typeof o === 'undefined' ? 'undefined' : _typeof(o);
  return type === 'function' || type === 'object' && !!o;
};

NetworkUtils.isArray = NetworkUtils.nativeIsArray || function(obj) {
  return NetworkUtils.toString.call(obj) === '[object Array]';
};

NetworkUtils.isString = function(o) {
  return typeof o === 'string';
};

NetworkUtils.isNotEmptyString = function(s) {
  return NetworkUtils.isString(s) && s !== '';
};

NetworkUtils.noop = function() {};

NetworkUtils.clamp = function(n, min, max) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

NetworkUtils.decode = decodeURIComponent;
NetworkUtils.encode = encodeURIComponent;

NetworkUtils.formData = function(o) {
  var kvps = [],
    regEx = /%20/g;

  for (var k in o) {
    if (!o[k]) continue;
    kvps.push(NetworkUtils.encode(k).replace(regEx, "+") + "=" + NetworkUtils.encode(o[k].toString()).replace(regEx, "+"));
  }

  return kvps.join('&');
};

NetworkUtils.ajax = function(o) {
  var xhr = cc.loader.getXMLHttpRequest();
  window.shouldTipOfWsDisconnected = true;
  o = Object.assign({
    type: "GET",
    data: null,
    dataType: 'json',
    progress: null,
    contentType: "application/x-www-form-urlencoded"
  }, o);

  if (o.progress) {
    NetworkUtils.Progress.start(o.progress);
  }

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status < 300) {
        var res;

        if (o.dataType == 'json') {
          if (xhr.responseText) {
            res = window.JSON ? window.JSON.parse(xhr.responseText) : eval(xhr.responseText);
          }
        } else {
          res = xhr.responseText;
        }

        if (!!res) o.success(res);
        if (o.progress) NetworkUtils.Progress.done();
        if (0 == xhr.status) { //服务器无响应
          if (o.error) {
            o.error(xhr, xhr.status, xhr.statusText);
          }
          if (window.handleNetworkDisconnected) {
            window.handleNetworkDisconnected();
          }
        }
      } else {
        if (o.error) {
          o.error(xhr, xhr.status, xhr.statusText);
        }
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected();
        }
      }
    }
  }; 

  var url = o.url,
    data = null;
  var isPost = o.type === "POST" || o.type === "PUT";

  if (o.data) {
    if (!isPost) {
      url += "?" + NetworkUtils.formData(o.data);
      data = null;
    } else if (isPost && _typeof(o.data) === 'object') {
      // o.data.token = cc.sys.localStorage.getItem('token');
      //data = JSON.stringify(o.data);
      data = NetworkUtils.formData(o.data);
    } else {
      data = o.data;
    }
  }


  xhr.open(o.type, url, true);

  if (isPost) {
    xhr.setRequestHeader("Content-Type", o.contentType);
  }
  xhr.ontimeout = function() {
    cc.log("Ajax request timed out.")
    // XMLHttpRequest 超时
    if ('function' === typeof o.timeout) {
      o.timeout();
    }
    if (window.handleNetworkDisconnected) {
      window.handleNetworkDisconnected();
    }
  };
  xhr.onerror = function() {
    cc.log("Ajax request got an error.")
    // XMLHttpRequest 错误。 native app in iOS，请求失败时不会调用timeout且readyState 只有= 1的情况，但是会调用onerror 
    if (o.error) {
      o.error(xhr, xhr.status, xhr.statusText);
    }
    if (window.handleNetworkDisconnected) {
      window.handleNetworkDisconnected();
    }
  };
  xhr.timeout = 3000;

  xhr.send(data);
  return xhr;
};

NetworkUtils.get = function(url, data, success, error) {
  if (NetworkUtils.isFunction(data)) {
    error = success;
    success = data;
    data = {};
  }

  NetworkUtils.ajax({
    url: url,
    type: "GET",
    data: data,
    success: success,
    error: error || NetworkUtils.noop
  });
};

NetworkUtils.post = function(url, data, success, error, timeout) {
  if (NetworkUtils.isFunction(data)) {
    error = success;
    success = data;
    data = {};
  }

  NetworkUtils.ajax({
    url: url,
    type: "POST",
    data: data,
    success: success,
    error: error || NetworkUtils.noop,
    timeout: timeout
  });
};

NetworkUtils.now = Date.now || function() {
  return new Date().getTime();
};

NetworkUtils.dragNode = function(node) {
  var isMoving = false,
    size = cc.director.getVisibleSize(),
    touchLoc = void 0,
    oldPos = void 0,
    moveToPos = void 0;
  node.on(cc.Node.EventType.TOUCH_START, function(event) {
    var touches = event.getTouches();
    touchLoc = touches[0].getLocation();
    oldPos = node.position;
  });
  node.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
    var touches = event.getTouches();
    moveToPos = touches[0].getLocation();
    isMoving = true;
  });
  node.on(cc.Node.EventType.TOUCH_END, function(event) {
    isMoving = false;
  });
  return function() {
    if (!isMoving) return;
    var x = oldPos.x + moveToPos.x - touchLoc.x;
    var xEdge = node.width * node.anchorX / 2;

    if (Math.abs(x) < xEdge) {
      node.x = x;
    } else {
      node.x = x > 0 ? xEdge : -xEdge;
      isMoving = false;
    }

    if (node.height > size.height) {
      var y = oldPos.y + moveToPos.y - touchLoc.y;
      var yEdge = (node.height - size.height) / 2;

      if (Math.abs(y) < yEdge) {
        node.y = y;
      } else {
        node.y = y > 0 ? yEdge : -yEdge;
        isMoving = false;
      }
    }
  };
};

NetworkUtils.getQueryVariable = function(key) {
  var query = window.location.search.substring(1),
    vars = query.split('&');

  for (var i = 0, l = vars.length; i < l; i++) {
    var pair = vars[i].split('=');

    if (decodeURIComponent(pair[0]) === key) {
      return decodeURIComponent(pair[1]);
    }
  }
};
