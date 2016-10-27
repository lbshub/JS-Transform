/**
 * LBS Transform (矩阵变换)
 * Date: 2016-03-22
 * ========================================================
 * Transform.watch(el) 开始监控元素属性 自动判断是2d还是3d
 * Transform.animate(el, props, opts) 在元素上使用动画
 * Transform.stop(el, bool) 停止队列中指定元素的动画  
 * Transform.stopAll(bool) 停止队列中所有元素的动画 
 * ========================================================
 * el:需变换的元素对象  
 * bool: 如果为true则动画立即完成
 * *监控的属性值*
 * el.translateX el.translateY el.translateZ[2d中无效] (值： 数字)
 * el.scaleX el.scaleY el.scaleZ[2d中无效] (值：数字)
 * el.rotateX el.rotateY el.rotateZ[2d中同el.rotate] el.rotate[3d中同el.rotateZ] (值：数字)
 * el.skewX el.skewY (值：数字)
 * el.originX (值：数字 | 百分比 | 'center' 'left' 'right')
 * el.originY (值：数字 | 百分比 | 'center' 'top' 'bottom')
 * el.originZ[2d中无效] (值：数值 如：20px)
 * ========================================================
 * *可动画的属性值*
 * translateX translateY translateZ scaleX scaleY scaleZ 
 * rotateX rotateY rotateZ rotate skewX skewY
 * ========================================================
 **/
(function(window, document) {
	'use strict';

	(function() {
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
		}
		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() {
					callback(currTime + timeToCall);
				}, timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}());

	var utils = (function() {
		var div = document.createElement('div'),
			style = div.style,
			body = document.body,
			vendors = ['webkit', 'Moz', 'ms', 'O'],
			i = 0,
			l = vendors.length,
			toHumb = function(str) {
				return str.replace(/-\D/g, function(match) {
					return match.charAt(1).toUpperCase();
				});
			},

			prefix = function(property) {
				var prop = toHumb(property);
				if (prop in style) return prop;
				for (i = 0; i < l; i++) {
					prop = toHumb(vendors[i] + '-' + property);
					if (prop in style) return prop;
				}
				return null;
			},

			support3d = function() {
				var has3d, transform;
				body.appendChild(div);
				transform = prefix('transform');
				div.style[transform] = 'translate3d(1px,1px,1px)';
				has3d = getComputedStyle(div, null)[transform];
				body.removeChild(div);
				return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
			},

			setTimeout = function(cb, el) {
				var id = window.requestAnimationFrame(cb, el);
				return id;
			},

			clearTimeout = function(id) {
				window.cancelAnimationFrame(id);
			};

		return {
			prefix: prefix,
			support3d: support3d,
			setTimeout: setTimeout,
			clearTimeout: clearTimeout
		};
	}());

	var _transform = utils.prefix('transform');
	var _support3d = utils.support3d();
	var _fix = function(value, n) {
		n = Math.pow(10, n || 15);
		return Math.round(value * n) / n;
	};
	var _watch = function(target, prop, callback) {
		Object.defineProperty(target, prop, {
			get: function() {
				return this['__' + prop];
			},
			set: function(value) {
				if (value !== this['__' + prop]) {
					this['__' + prop] = value;
					callback();
				}

			}
		});
	};
	var _observe = function(target, props, callback) {
		for (var i = 0, n = props.length; i < n; i++) {
			_watch(target, props[i], callback);
		}
	};

	// matrix(a, b, c, d, e, f)
	// translate: matrix(1, 0, 0, 1, x, y)
	// scale: matrix(sx, 0, 0, sy, 0, 0)
	// skew: matrix(1,tan(ay),tan(ax),1,0,0)
	// rotate: matrix(cosx,sinx,-sinx,cosx,0,0)
	var Matrix2D = function() {
		this.matrix2d = [1, 0, 0, 1, 0, 0];
		this.reset = function() {
			this.basis = [
				1, 0, 0,
				0, 1, 0,
				0, 0, 1
			];
			return this;
		};
		this.matrix = function(newMatrix) {
			// 矩阵乘法
			// 左乘矩阵的第 i 行的数 分别乘 右乘矩阵第 j 列对应的数 再加起来 就是乘积矩阵第 i 行第 j 列的数

			// 0 1 2   a c e  1 0 0
			// 3 4 5   b d f  0 1 0
			// 6 7 8   0 0 1  0 0 1

			var rows = this.basis;
			var cols = newMatrix;

			// 左矩阵 行
			var a11 = rows[0],
				a12 = rows[1],
				a13 = rows[2];
			var a21 = rows[3],
				a22 = rows[4],
				a23 = rows[5];
			var a31 = rows[6],
				a32 = rows[7],
				a33 = rows[8];

			// 右矩阵 列
			var b11 = cols[0],
				b12 = cols[3],
				b13 = cols[6];
			var b21 = cols[1],
				b22 = cols[4],
				b23 = cols[7];
			var b31 = cols[2],
				b32 = cols[5],
				b33 = cols[8];

			this.basis[0] = a11 * b11 + a12 * b12 + a13 * b13; //a 1行1列
			this.basis[1] = a11 * b21 + a12 * b22 + a13 * b23; //c 1行2列
			this.basis[2] = a11 * b31 + a12 * b32 + a13 * b33; //e 1行3列 

			this.basis[3] = a21 * b11 + a22 * b12 + a23 * b13; //b 2行1列
			this.basis[4] = a21 * b21 + a22 * b22 + a23 * b23; //d 2行2列
			this.basis[5] = a21 * b31 + a22 * b32 + a23 * b33; //f 2行3列

			this.basis[6] = a31 * b11 + a32 * b12 + a33 * b13; // 3行1列
			this.basis[7] = a31 * b21 + a32 * b22 + a33 * b23; // 3行2列
			this.basis[8] = a31 * b31 + a32 * b32 + a33 * b33; // 3行3列

			this.matrix2d[0] = this.basis[0]; //a
			this.matrix2d[1] = this.basis[3]; //b
			this.matrix2d[2] = this.basis[1]; //c
			this.matrix2d[3] = this.basis[4]; //d
			this.matrix2d[4] = this.basis[2]; //e
			this.matrix2d[5] = this.basis[5]; //f

			return this;
		};
		this.watch = function(translateX, translateY, scaleX, scaleY, skewX, skewY, rotate, rotateZ) {
			var mp = Math.PI / 180;
			var rx = rotate * mp || rotateZ * mp;
			var cosx = _fix(Math.cos(rx));
			var sinx = _fix(Math.sin(rx));
			var tanx = _fix(Math.tan(skewX * mp));
			var tany = _fix(Math.tan(skewY * mp));

			if (translateX || translateY) {
				this.matrix([
					1, 0, translateX,
					0, 1, translateY,
					0, 0, 1
				]);
			}

			if (scaleX || scaleY) {
				this.matrix([
					scaleX, 0, 0,
					0, scaleY, 0,
					0, 0, 1
				]);
			}

			if (skewX || skewY) {
				this.matrix([
					1, tanx, 0,
					tany, 1, 0,
					0, 0, 1
				]);
			}

			if (rotate || rotateZ) {
				this.matrix([
					cosx, -sinx, 0,
					sinx, cosx, 0,
					0, 0, 1
				]);
			}

			return this;
		};
	};

	// matrix3d(a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, a4, b4, c4, d4)
	// matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
	// translate: matrix3d(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1)
	// scale: matrix3d(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1)
	// rotateX: matrix3d(1, 0, 0, 0, 0, cosx, sinx, 0, 0, -sinx, cosx, 0, 0, 0, 0, 1)
	// rotateY: matrix3d(cosy, 0, siny, 0, 0, 1, 0, 0, -siny, 0, cosy, 0, 0, 0, 0, 1) 
	// rotateZ: matrix3d(cosz, sinz, 0, 0, -sinz, cosz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) 
	// skew: matrix3d(1, tanx, 0, 0, tany, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1) 
	var Matrix3D = function() {
		this.matrix3d = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		this.reset = function() {
			this.basis = [
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1
			];
			return this;
		};
		this.matrix = function(newMatrix) {
			// 矩阵乘法
			// 左乘矩阵的第 i 行的数 分别乘 右乘矩阵第 j 列对应的数 再加起来 就是乘积矩阵第 i 行第 j 列的数

			// 0  1  2  3   a1 a2 a3 a4   1 0 0 0 
			// 4  5  6  7   b1 b2 b3 b4   0 1 0 0
			// 8  9  10 11  c1 c2 c3 c4   0 0 1 0
			// 12 13 14 15  d1 d2 d3 d4   0 0 0 1

			var rows = this.basis;
			var cols = newMatrix;

			// 左矩阵 行
			var a11 = rows[0],
				a12 = rows[1],
				a13 = rows[2],
				a14 = rows[3];
			var a21 = rows[4],
				a22 = rows[5],
				a23 = rows[6],
				a24 = rows[7];
			var a31 = rows[8],
				a32 = rows[9],
				a33 = rows[10],
				a34 = rows[11];
			var a41 = rows[12],
				a42 = rows[13],
				a43 = rows[14],
				a44 = rows[15];

			// 右矩阵 列
			var b11 = cols[0],
				b12 = cols[4],
				b13 = cols[8],
				b14 = cols[12];
			var b21 = cols[1],
				b22 = cols[5],
				b23 = cols[9],
				b24 = cols[13];
			var b31 = cols[2],
				b32 = cols[6],
				b33 = cols[10],
				b34 = cols[14];
			var b41 = cols[3],
				b42 = cols[7],
				b43 = cols[11],
				b44 = cols[15];

			this.basis[0] = a11 * b11 + a12 * b12 + a13 * b13 + a14 * b14; //a1 1行1列
			this.basis[1] = a11 * b21 + a12 * b22 + a13 * b23 + a14 * b24; //b1 1行2列
			this.basis[2] = a11 * b31 + a12 * b32 + a13 * b33 + a14 * b34; //c1 1行3列
			this.basis[3] = a11 * b41 + a12 * b42 + a13 * b43 + a14 * b44; //d1 1行4列

			this.basis[4] = a21 * b11 + a22 * b12 + a23 * b13 + a24 * b14; //a2 2行1列
			this.basis[5] = a21 * b21 + a22 * b22 + a23 * b23 + a24 * b24; //b2 2行2列
			this.basis[6] = a21 * b31 + a22 * b32 + a23 * b33 + a24 * b34; //c2 2行3列
			this.basis[7] = a21 * b41 + a22 * b42 + a23 * b43 + a24 * b44; //d2 2行4列

			this.basis[8] = a31 * b11 + a32 * b12 + a33 * b13 + a34 * b14; //a3 3行1列
			this.basis[9] = a31 * b21 + a32 * b22 + a33 * b23 + a34 * b24; //b3 3行2列
			this.basis[10] = a31 * b31 + a32 * b32 + a33 * b33 + a34 * b34; //c3 3行3列
			this.basis[11] = a31 * b41 + a32 * b42 + a33 * b43 + a34 * b44; //d3 3行4列

			this.basis[12] = a41 * b11 + a42 * b12 + a43 * b13 + a44 * b14; //a4 4行1列
			this.basis[13] = a41 * b21 + a42 * b22 + a43 * b23 + a44 * b24; //b4 4行2列
			this.basis[14] = a41 * b31 + a42 * b32 + a43 * b33 + a44 * b34; //c4 4行3列
			this.basis[15] = a41 * b41 + a42 * b42 + a43 * b43 + a44 * b44; //d4 4行4列

			this.matrix3d[0] = this.basis[0]; //a1
			this.matrix3d[1] = this.basis[4]; //b1
			this.matrix3d[2] = this.basis[8]; //c1
			this.matrix3d[3] = this.basis[12]; //d1

			this.matrix3d[4] = this.basis[1]; //a2
			this.matrix3d[5] = this.basis[5]; //b2
			this.matrix3d[6] = this.basis[9]; //c2
			this.matrix3d[7] = this.basis[13]; //d2

			this.matrix3d[8] = this.basis[2]; //a3
			this.matrix3d[9] = this.basis[6]; //b3
			this.matrix3d[10] = this.basis[10]; //c3
			this.matrix3d[11] = this.basis[14]; //d3

			this.matrix3d[12] = this.basis[3]; //a4
			this.matrix3d[13] = this.basis[7]; //b4
			this.matrix3d[14] = this.basis[11]; //c4
			this.matrix3d[15] = this.basis[15]; //d4

			return this;
		};
		this.watch = function(translateX, translateY, translateZ, scaleX, scaleY, scaleZ, rotateX, rotateY, rotateZ, rotate, skewX, skewY) {
			var mp = Math.PI / 180;
			var rx = rotateX * mp;
			var cosx = _fix(Math.cos(rx));
			var sinx = _fix(Math.sin(rx));
			var ry = rotateY * mp;
			var cosy = _fix(Math.cos(ry));
			var siny = _fix(Math.sin(ry)); //为负修正为顺时针旋转
			var rz = rotateZ * mp || rotate * mp;
			var cosz = _fix(Math.cos(rz));
			var sinz = _fix(Math.sin(-rz));
			var tanx = _fix(Math.tan(skewX * mp));
			var tany = _fix(Math.tan(skewY * mp));

			if (translateX || translateY || translateZ) {
				this.matrix([
					1, 0, 0, translateX,
					0, 1, 0, translateY,
					0, 0, 1, translateZ,
					0, 0, 0, 1
				]);
			}

			if (scaleX || scaleY || scaleZ) {
				this.matrix([
					scaleX, 0, 0, 0,
					0, scaleY, 0, 0,
					0, 0, scaleZ, 0,
					0, 0, 0, 1
				]);
			}

			if (rotateX) {
				this.matrix([
					1, 0, 0, 0,
					0, cosx, sinx, 0,
					0, -sinx, cosx, 0,
					0, 0, 0, 1
				]);
			}

			if (rotateY) {
				this.matrix([
					cosy, 0, siny, 0,
					0, 1, 0, 0, -siny, 0, cosy, 0,
					0, 0, 0, 1
				]);
			}

			if (rotateZ || rotate) {
				this.matrix([
					cosz, sinz, 0, 0, -sinz, cosz, 0, 0,
					0, 0, 1, 0,
					0, 0, 0, 1
				]);
			}

			if (skewX || skewY) {
				this.matrix([
					1, tanx, 0, 0,
					tany, 1, 0, 0,
					0, 0, 1, 0,
					0, 0, 0, 1
				]);
			}

			return this;
		};
	};

	var Transform = {
		guid: 0,
		cache: {}
	};

	Transform.watch = function(el) {
		if (!!el.$watched) return;
		if (!el.$watched) el.$watched = true;

		var _originX = 'center',
			_originY = 'center',
			_originZ = '0px';

		if (_support3d) {
			var _3d = new Matrix3D();
			_observe(el, ['translateX', 'translateY', 'translateZ', 'scaleX', 'scaleY', 'scaleZ', 'rotateX', 'rotateY', 'rotateZ', 'rotate', 'skewX', 'skewY'], function() {
				_3d.reset().watch(el.translateX, el.translateY, el.translateZ, el.scaleX, el.scaleY, el.scaleZ, el.rotateX, el.rotateY, el.rotateZ, el.rotate, el.skewX, el.skewY);
				el.style[_transform] = 'matrix3d(' + _3d.matrix3d.join(",") + ')';
			});
		} else {
			var _2d = new Matrix2D();
			_observe(el, ['translateX', 'translateY', 'scaleX', 'scaleY', 'skewX', 'skewY', 'rotate', 'rotateZ'], function() {
				_2d.reset().watch(el.translateX, el.translateY, el.scaleX, el.scaleY, el.skewX, el.skewY, el.rotate, el.rotateZ);
				el.style[_transform] = 'matrix(' + _2d.matrix2d.join(",") + ')';
			});
		}

		_observe(el, ['originX', 'originY', 'originZ'], function() {
			if (el.originX !== undefined) _originX = el.originX;
			if (el.originY !== undefined) _originY = el.originY;
			if (el.originZ !== undefined) _originZ = el.originZ;
			el.style[_transform + 'Origin'] = _originX + ' ' + _originY + ' ' + _originZ;
		});

		// 初始化
		// el.originX = el.originY = 'center';
		// el.originZ = '0px';
		el.scaleX = el.scaleY = el.scaleZ = 1;
		el.translateX = el.translateY = el.translateZ = el.rotateX = el.rotateY = el.rotateZ = el.rotate = el.skewX = el.skewY = 0;
	};

	Transform.animate = function(el, props, opts) {
		if (!el.$watched) Transform.watch(el);
		if (!Transform.cache[el]) Transform.cache[el] = [];
		var $guid = Transform.guid++;
		var opts = opts || {};
		var duration = opts.duration || 400;
		var easefn = opts.ease || function(k) {
			return k;
		};
		var change = opts.change || function() {};
		var callback = opts.callback || function() {};
		var args = arguments;
		if (args.length === 3) {
			if (typeof args[2] === 'number') duration = args[2];
			if (typeof args[2] === 'function') callback = args[2];
		} else if (args.length > 3) {
			if (typeof args[2] === 'number') duration = args[2];
			if (typeof args[3] === 'function') easefn = args[3];
			if (typeof args[4] === 'function') callback = args[4];
		}
		if (!el['__' + $guid]) el['__' + $guid] = {};
		var p, current, _props = {};
		for (p in props) {
			if (!_props.hasOwnProperty(p)) {
				_props[p + '__start'] = el[p];
				_props[p + '__end'] = props[p];
				_props[p + '__change'] = props[p] - el[p];
			}
		}
		var $start = function(before, update, after) {
			var startTime = Date.now();
			before && before();
			! function step() {
				var nowTime = Date.now(),
					timestamp = nowTime - startTime,
					delta = easefn(timestamp / duration);
				update && update(delta);
				if (timestamp >= duration) {
					$stop();
					after && after();
					return;
				}
				el['__' + $guid].timer = utils.setTimeout(step);
			}();
		};
		var $stop = function() {
			utils.clearTimeout(el['__' + $guid].timer);
			el['__' + $guid].timer = null;
		};
		$start(function() {
			el['__' + $guid].animated = true;
			_props.$guid = $guid;
			_props.$props = props;
			_props.$callback = callback;
			Transform.cache[el].push(_props);
		}, function(delta) {
			for (var prop in props) {
				(function(prop) {
					current = _props[prop + '__start'] + delta * _props[prop + '__change'];
					el[prop] = current;
					change && change(el, prop, current);
				}(prop));
			}
		}, function() {
			for (var prop in props) {
				(function(prop) {
					el[prop] = _props[prop + '__end'];
				}(prop));
			}
			el['__' + $guid].animated = false;
			delete el['__' + $guid];
			callback && callback();
		});
	};

	Transform.stop = function(el, b) {
		if (!Transform.cache[el]) return;
		if (Transform.cache[el].length < 1) return;
		var items = Transform.cache[el],
			n = items.length,
			i = 0,
			item = null;
		for (; i < n; i++) {
			item = items[i];
			if (!!el['__' + item.$guid] && !!el['__' + item.$guid].animated) {
				utils.clearTimeout(el['__' + item.$guid].timer);
				el['__' + item.$guid].timer = null;
				if (!!b) {
					for (var prop in item.$props) el[prop] = item.$props[prop];
					item.$callback && item.$callback();
				}
				delete el['__' + item.$guid];
			}
		}
		items.length = 0;
	};

	Transform.stopAll = function(b) {
		for (var el in Transform.cache) {
			Transform.stop(el, b);
		}
	};

	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define('Transform', [], function() {
			return Transform;
		});
	} else {
		window.Transform = Transform;
	}
})(window, document);