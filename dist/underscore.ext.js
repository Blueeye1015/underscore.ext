/**
 * underscore.ext
 */
void function (undefined) {
	'use strict'

////////////////////  core  ////////////////////
var root = this
var _ext = {};

//config
_ext.config = {
	debug: _.str.include(location.href, 'debug=1') || _.str.include(location.hash, 'debug=1'),
	selAction: ''
};
_ext.config._ini = function () {
	//todo: window.onhashchange to update _.config.debug
	this.get = function (key) {
		return _.isString(key) && key ? sessionStorage.getItem(key) || localStorage.getItem(key) || '' : false;  //to be improved
	};
	this.set = function (key, value, bSession) {
		if (_.isString(key)) {
			(bSession ? sessionStorage : localStorage).setItem(key, '' + value);
		} else {
			return false;
		}
	};
	this.del = function (key) {
		if (_.isString(key) && key) {
			sessionStorage.removeItem(key);
			localStorage.removeItem(key);
		} else {
			return false;
		}
	};
};

////////////////////  exports  ////////////////////
void function (root, _ext) {
	'use strict'

	_ext.exports = function (key) {  //key: '...' or [...]
		var _ns = this;
		key = _.isArray(key) ? _.compact(key) : _.str.trim(key);
		//console.log(key);
		function fnCheckKey(key) {
			if (_[key]) {
				_ns.root.log('[Warning] _ already has key: ' + key);
				return false;
			} else {
				return true;
			}
		}
		function fnExportModule(key) {
			if (_.isArray(key)) {
				_.each(key, function (n) {fnExportModule(n); });
			} else if (_.isString(key)) {
				if (key === 'root') {
					_.each(_ns.root, function (n, i) {
						fnCheckKey(i);
						_[i] = n;
					});
				} else if (key === 'template') {
					_.extend(_.template, _ns.template);
				} else {
					fnCheckKey(key);
					_[key] = _ns[key];
				}
				if (_[key] && _.isFunction(_[key]._ini)) _[key]._ini();
			}
		}
		if (_ns.root.includeKey(_ns, key)) {
			fnExportModule(key);
		} else {
			_ns.root.log('[Error] Invalid key(s) to export: ' + key);
			return false;
		}
	};
	_ext.ini = function (oConfig) {
		var result = false;
		if (!root.$) {
			_.log('[Error] $ not found!');
		} else if (!root._) {
			_.log('[Error] _ not found!');
		} else if (!root._.str) {
			_.log('[Error] _.str not found!');
		} else {
			//get config info from gm script
			if (root._extConfigData) {
				_.extend(this.config, root._extConfigData);
				delete root._extConfigData;
			}
			//get config info from arguments
			if (_.isObject(oConfig)) {
				_.extend(this.config, oConfig);
			}
			//bind to _ and ini
			this.exports(this.config.module || [
				'config',
				'ua',
				'dom',
				'url',
				'event',
				'task',
				'action',
				'ga',
				'sns',
				'ajax',
				'template',
				'system'
			]);
			result = true;
		}
		return result;
	};

	//exports
//	_ext.url = url
}(root, _ext)

////////////////////  url  ////////////////////
void function (root, _ext) {
	'use strict'

	//ns
	var url = {}

	//page type
	url.isInFrame = window.self !== window.top;

	//basic info
	url.str = location.href;
	url.host = location.hostname.toLowerCase();  //without port number
	url.path = location.pathname;
	url.query = location.search.slice(1).replace(/&+$/, '');


	//url param processing
	url._param = null;
	url.parseQuery = function(sQuery) {
		var data = {};
		if (sQuery && _.isString(sQuery)) {
			var aQ = sQuery.split('&'), aP, sN, sV;
			_.each(aQ, function(n) {
				aP = n.split('=');
				sN = aP[0];
				sV = aP[1] || '';
				if (sN /** && sV **/) {  //add this comment to keep empty key
					data[decodeURIComponent(sN).toLowerCase()] = decodeURIComponent(sV);
				}
			});
		}
		return data;
	};
	url.getParam = function (s) {  //API: var sCode = UE.url.getParam('prdcode');
		if (!this._param) {
			url._param = this.parseQuery(this.query);
		}
		return _.isString(s) ? this._param[s.toLowerCase()] : false;
	};
	url.appendParam = function (url, param) {  //append param to (sUrl || current url)
		var s = '';
		url = _.isString(url) ? url : '';
		url = _.url.removeHashFromUrl(url);
		if (_.isObject(param)) {
			param = $.param(param);
		} else if (_.isString(param)) {
			//fix param string
			if (_.str.startsWith(param, '&') || _.str.startsWith(param, '?')) {param = param.slice(1); }
		} else {
			param = null;
		}
		//append
		s = param ? url + (_.str.include(url, '?') ? '&' : '?') + param : s;
		return s || false;
	};

	//parse url
	var _cacheParsedUrl = {};
	var _urlParts = ['protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash'];
	url.parseUrl = function (s, sPart) {
		if (!_.isString(s) || !_.str.isFullUrl(s)) return false;
		if (sPart && (!_.isString(sPart) || !_.include(_urlParts, sPart))) return false;
		var url = _.str.trim(s);
		var result = _cacheParsedUrl[url];
		if (!result) {
			//ini
			result = {};
			_.each(_urlParts, function (n) {
				result[n] = '';
			});
			//hash
			var iHashPos = url.indexOf('#');
			if (iHashPos > -1) {
				result.hash = url.slice(iHashPos);
				url = url.slice(0, iHashPos);
			}
			//search
			var iQuestionPos = url.indexOf('?');
			if (iQuestionPos > -1) {
				result.search = url.slice(iQuestionPos);
				url = url.slice(0, iQuestionPos);
			}
			//protocol
			var iDblSlashPos = url.indexOf('//');
			if (iDblSlashPos > -1) {
				result.protocol = url.slice(0, iDblSlashPos).replace(':', '');
				url = url.slice(iDblSlashPos + 2);
			}
			//pathname
			var iSlashPos = url.indexOf('/');
			if (iSlashPos > -1) {
				result.pathname = url.slice(iSlashPos);
				url = url.slice(0, iSlashPos);
			} else {
				result.pathname = '/';
			}
			//host & port
			var iColonPos = url.indexOf(':');
			if (iColonPos > -1) {
				result.port = url.slice(iColonPos + 1);
				result.host = url.slice(0, iColonPos);
			} else {
				result.host = url;
			}
			//clone host
			result.hostname = result.host;
			//cache
			_cacheParsedUrl[url] = result;
		}
		return sPart ? result[sPart] : result;
	};
	url.composeUrl = function (o) {
		if (!_.isPlainObject(o)) return false;
		var host = o.host || o.hostname;
		var fnCheckValue = function (sKey) {return _.isString(sKey) && _.str.trim(sKey);};
		if (!fnCheckValue(host)) return false;
		var result = [];
		result.push(fnCheckValue(o.protocol) ? _.str.trim(o.protocol) + '://' : '//');
		result.push(_.str.trim(host));
		//port
		var port = _.str.toNumber(o.port);
		result.push(port ? ':' + port : '');
		//pathname
		result.push(fnCheckValue(o.pathname) ? _.str.trim(o.pathname) : '/');
		//search
		var search = _.str.trim(o.search);
		if (fnCheckValue(search) || _.isNumber(search)) {
			search = _.str.startsWith(search, '?') ? search : '?' + search;
		} else if (_.isPlainObject(search)) {
			search = '?' + $.param(search);
		} else {
			search = '';
		}
		result.push(search);
		//hash
		var hash = _.str.trim(o.hash);
		if (hash && _.isString(hash)) {
			hash = _.str.startsWith(hash, '#') ? hash : '#' + hash;
		} else if (_.isPlainObject(hash)) {
			hash = '#' + $.param(hash);
		} else {
			hash = '';
		}
		result.push(hash);
		//output
		return result.join('');
	};

	//hash processing
	url.removeHashFromUrl = function (s) {
		return _.isString(s) && s.split('#')[0];
	};
	url.getHashFromUrl = function (s) {
		return _.url.parseUrl(s, 'hash');
	};
	url.getHashFromHref = function (s) {
		var result = false;
		if (_.isString(s)) {
			var iHashPos = s.indexOf('#');
			result = (iHashPos > -1) ? s.slice(iHashPos + 1) : '';
		}
		return result;
	};
	url.getHashFromLink = function (e) {
		var result = false;
		if (_.isElement(e) && e.tagName.toLowerCase() === 'a') {
			result = e.getAttribute('href', 2);
			result = _.str.isHash(result) ? result : this.getHashFromHref(result);
		}
		return result;
	};

	//resource loading
	url.open = function (s) {return _.isString(s) ? window.open(s) : false;};
	url.go = function (s) {return _.isString(s) ? (location.href = s) : false;};
	url.refresh = url.reload = function () {location.reload();};
	url.preloadImg = function (s) {
		var img = _.isString(s) ? new Image() : false;
		if (img) {
			var id = _.uniqueId('preloadImg');
			img.src = s;
			window[id] = img;  //avoid gc
			//todo: remove id from global
		}
		return img;
	};

	//check url
	url.isHash = _.str.isHash;
	url.stripHash = _.str.stripHash;
	url.isFullUrl = _.str.isFullUrl;
	url.isAbsolutePath = _.str.isAbsolutePath;

	//exports
	_ext.url = url
}(root, _ext)
////////////////////  output  ////////////////////
	if (root._) {
		_.ext = _.ext || {};
		_.extend(_.ext, _ext);
	//	_ext.exports('root');  //in order to get _.log ready asap
		_ext.exports('url')
	}

}();