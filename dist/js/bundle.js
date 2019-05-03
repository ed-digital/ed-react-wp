/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "\\wp-content\\themes\\@_ed\\wp\\dist\\js\\";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../../../../../../../node_modules/node-edtool/src/dev-refresh-client.js":
/*!************************************************************************!*\
  !*** C:/Users/Bryn/node_modules/node-edtool/src/dev-refresh-client.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

;(function devRefreshClient(){
  try {

    var tag = false
    var styleTag = false
    var tm = false
    var action = false
    var queue = false

    

    if (localStorage.getItem('wasDevReloaded')) {
      console.log('%cPage was reloaded automatically because of a code change.', 'color: #9c55da')
      localStorage.removeItem('wasDevReloaded')
    }
    if (window.location.host.match(/(\.dev|\.local)$|localhost/) && window.WebSocket) {

      window.addEventListener('load', function() {
        addTag()
      })

      var ws = new WebSocket('ws://127.0.0.1:' + 12704)
      ws.addEventListener('message', function(msg){
        var payload = json_parse(msg.data) || { type: 'js', action: 'reload' }

        if (payload.action === 'reload') {
          if (payload.type === 'js') {
            console.log('%cDetected js code changes! Reloading page.', 'color: #9c55da')
            localStorage.setItem('wasDevReloaded', true)

            action = {
              type: payload.type,
              fn: function () {window.location.reload()}
            }
          }

          if (payload.type === 'css') {
            console.log('%cDetected css code changes! Reloading styles.', 'color: #9c55da')

            if (!action || action.type !== 'js') {
              action = {
                type: payload.type,
                fn: function () {
                  reloadCSS()
                }
              }
            }
          }

          if (queue) return

          queue = nextFrame().then(
            function () {
              queue = false
              action.fn()  
            }
          )
        }
      })
      ws.onerror = function() {
        console.log('%cError connecting to dev reload server, you may need to refresh manually!', 'color: #da6955')
      }
    } else {
      console.warn('Project should be rebuilt in production mode')
    }

    function json_parse(str){
      try{
        return JSON.parse(str);
      } catch (err) {}
    }

    function reloadCSS(){
      tag.style = 'transform: translateX(0);'
      clearTimeout(tm)
      tm = setTimeout(function(){
        tag.style = ''
      }, 3000)
      var els = toArray(document.querySelectorAll('link[rel="stylesheet"]'))
      els.forEach(function(el) {
        var href = el.getAttribute('href')
        var isFromDist = /assets-built|dist/.test(href)
        if(isFromDist){
          var url = href.split('?')[0]
          var query = parseQuery(href)
          query.ver = query.ver ? Number(query.ver) + 1 : 1
          el.setAttribute('href', url + createQuery(query))
        }
      })
    }

    function nextFrame () {
      return new Promise(
        function (resolve) {
          window.requestAnimationFrame(resolve)
        }
      )
    }

    function addTag(){
      var head = document.head || document.getElementsByTagName('head')[0]
      var body = document.body || document.getElementsByTagName('body')[0]

      if (tag) return
      tag = document.createElement('div')
      tag.className = 'DEV_REFRESH-style-modal'
      tag.textContent = 'Styles were updated'
      body.appendChild(tag)

      if (styleTag) return
      var styles = ".DEV_REFRESH-style-modal{ padding: 20px; font-size: 16px; font-weight: bold; background: #212121; color: white; position: fixed; display: inline-block; bottom: 20px; right: 0px; transform: translateX(100%); transition: transform 0.2s; z-index: 9999999; }"

      styleTag = document.createElement('style')
      styleTag.type = 'text/css'
      if (styleTag.styleSheet) {
        styleTag.styleSheet.cssText = css
      } else {
        styleTag.appendChild(document.createTextNode(styles))
      }

      head.appendChild(styleTag)

    }

    function addTo(arr){
      return function(item) {
        return arr.push(item)
      }
    }
    function toArray(nodeList){
      var result = []
      nodeList.forEach(addTo(result))
      return result
    }
    function parseQuery(url){
      var result = {}
      var q = url.split('?')[1] || ''
      q.split('&').forEach(function(pair){
        var p = pair.split('=')
        result[p[0]] = p[1]
      })
      return result
    }
    function createQuery(obj){
      return '?' + Object.entries(obj).map(function(keyVal){
        return keyVal.join('=')
      }).join('&')
    }
  } catch(err) {
  }
})()


/***/ }),

/***/ 0:
/*!************************************************************************************************!*\
  !*** multi C:/Users/Bryn/node_modules/node-edtool/src/dev-refresh-client.js ./src/js/index.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! C:\Users\Bryn\node_modules\node-edtool\src\dev-refresh-client.js */"../../../../../../../../node_modules/node-edtool/src/dev-refresh-client.js");
!(function webpackMissingModule() { var e = new Error("Cannot find module 'C:\\Users\\Bryn\\Local Sites\\sydney-dance-company\\app\\public\\wp-content\\themes\\@_ed\\wp\\src/js/index.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());


/***/ })

/******/ });
//# sourceMappingURL=bundle.js.map