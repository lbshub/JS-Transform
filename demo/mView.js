/**
 * LBS mView
 * Date: 2016-03-23
 * ========================================================
 **/
(function(window, document) {
	'use strict';

	var Tween = {
		easeOutSine: function(k) {
			return Math.sin(k * (Math.PI / 2));
		},
		easeInOutSine: function(k) {
			return (-.5 * (Math.cos(Math.PI * k) - 1));
		}
	};

	var mView = function(el, opts) {
		this.wrapper = typeof el === 'string' ? document.querySelector(el) : el;
		this.scroller = this.wrapper.children[0];
		this.elements = this.scroller.children;
		this.length = this.elements.length;
		this.viewW = document.documentElement.clientWidth;
		this.viewH = document.documentElement.clientHeight;
		this.index = 0;
		this._init();
	};
	mView.prototype = {
		_init: function() {
			this._setup();
			this._bind();
		},
		_setup: function() {
			this.wrapper.style.width = this.viewW + 'px';
			this.wrapper.style.height = this.viewH + 'px';
			this.scroller.style.width = this.length * this.viewW + 'px';
			this.scroller.style.height = this.viewH + 'px';
			for (var i = 0; i < this.length; i++) {
				this.elements[i].style.width = this.viewW + 'px';
				this.elements[i].style.height = this.viewH + 'px';
			}
			this._watch();
		},
		_watch: function() {
			Transform.watch(this.scroller);
			for (var i = 0, el = null; i < this.length; i++) {
				el = this.elements[i].querySelector('img');
				Transform.watch(el);
			}
		},
		_bind: function() {
			var _this = this;
			var finger = new mFinger(this.wrapper, {
				start: function(e) {
					_this._start(e);
				},
				doubleTap: function(e) {
					var px = e.changedTouches[0].pageX;
					var py = e.changedTouches[0].pageY;
					_this._doubleTap(px, py);
				},
				pressMove: function(e) {
					var dx = e.$deltaX;
					var dy = e.$deltaY;
					_this._pressMove(dx, dy);
				},
				swipe: function(e) {
					var dir = e.$direction;
					var dx = e.$deltaX;
					var dy = e.$deltaY;
					_this._swipe(dir, dx, dy);
				},
				pinch: function(e) {
					_this._pinch(e.$scale);
				},
				end: function(e) {
					_this._end(e);
				}
			});
		},
		_start: function(e) {
			this.el = this.elements[this.index].querySelector('img');
			this.isPressMove = false;
			this.isDoubleTap = false;
			this.initScale = this.el.scaleX;
			if (this.el.scaleX > 1) {
				Transform.stop(this.el);
				var rect = this.el.getBoundingClientRect();
				var LR = (this.viewW - rect.width) / 2;
				var TB = (this.viewH - rect.height) / 2;
				if (LR > 0) LR = 0;
				if (TB > 0) TB = 0;
				this.initL = -LR; //放大后贴近左边的坐标值
				this.initR = LR; //放大后贴近右边的坐标值
				this.initT = -TB;
				this.initB = TB;
			}
		},
		_doubleTap: function(px, py) {
			this.isDoubleTap = true;
			var el = this.el;
			if (el.scaleX > 1) {
				Transform.animate(el, {
					scaleX: 1,
					scaleY: 1,
					translateX: 0,
					translateY: 0
				}, 300, Tween.easeInOutSine);
			} else {
				var rect = el.getBoundingClientRect();
				var x = rect.width / 2 - (px - rect.left)
				var y = rect.height / 2 - (py - rect.top);
				if (this.viewW - rect.width * 2 > 0) x = 0;
				if (this.viewH - rect.height * 2 > 0) y = 0;
				Transform.animate(el, {
					scaleX: 2,
					scaleY: 2,
					translateX: x,
					translateY: y
				}, 300, Tween.easeInOutSine);
			}
		},
		_pressMove: function(dx, dy) {
			this.isPressMove = true;
			var scroller = this.scroller;
			var el = this.el;
			if (el.scaleX === 1) {
				var maxX = -(this.length - 1) * this.viewW;
				var minX = 0;
				if (scroller.translateX > minX || scroller.translateX < maxX) dx /= 4;
				scroller.translateX += dx;
			} else if (el.scaleX > 1) {
				if (el.translateX > this.initL || el.translateX < this.initR) dx /= 4;
				if (el.translateY > this.initT || el.translateY < this.initB) dy /= 4;
				if (this.initR === 0) dx = 0;
				if (this.initB === 0) dy = 0;
				el.translateX += dx;
				el.translateY += dy;
			}
		},
		_swipe: function(dir, dx, dy) {
			var el = this.el;
			if (el.scaleX === 1) {
				if (dir === 'left') {
					this.index++;
					this.index > this.length - 1 && (this.index = this.length - 1);
				}
				if (dir === 'right') {
					this.index--;
					this.index < 0 && (this.index = 0);
				}
				this._slide(250, Tween.easeOutSine);
			} else if (el.scaleX > 1) {
				if (dx > 0) {
					var x = el.translateX + 150;
					x > this.initL && (x = this.initL);
					Transform.animate(el, {
						translateX: x
					}, 300, Tween.easeOutSine);
				} else if (dx < 0) {
					var x = el.translateX - 150;
					x < this.initR && (x = this.initR);
					Transform.animate(el, {
						translateX: x
					}, 300, Tween.easeOutSine);
				}
				if (dy > 0) {
					var y = el.translateY + 150;
					y > this.initT && (y = this.initT);
					Transform.animate(el, {
						translateY: y
					}, 300, Tween.easeOutSine);
				} else if (dy < 0) {
					var y = el.translateY - 150;
					y < this.initB && (y = this.initB);
					Transform.animate(el, {
						translateY: y
					}, 300, Tween.easeOutSine);
				}
			}
		},
		_pinch: function(scale) {
			this.el.scaleX = this.el.scaleY = this.initScale * scale;
		},
		_end: function(e) {
			var el = this.el;
			if (el.scaleX < 1) {
				Transform.animate(el, {
					scaleX: 1,
					scaleY: 1,
					translateX: 0,
					translateY: 0
				}, 300);
			} else if (el.scaleX > 2) {
				Transform.animate(el, {
					scaleX: 2,
					scaleY: 2,
					translateX: 0,
					translateY: 0
				}, 300);
			}
			if (el.scaleX === 1) {
				if (this.isPressMove) this._slide(300);
			} else if (el.scaleX > 1) {
				if (this.isDoubleTap) return;
				if (this.isPressMove) {
					if (el.translateX > this.initL) {
						Transform.animate(el, {
							translateX: this.initL
						}, 300);
					} else if (el.translateX < this.initR) {
						Transform.animate(el, {
							translateX: this.initR
						}, 300);
					}
					if (el.translateY > this.initT) {
						Transform.animate(el, {
							translateY: this.initT
						}, 300);
					} else if (el.translateY < this.initB) {
						Transform.animate(el, {
							translateY: this.initB
						}, 300);
					}
				}
			}
		},
		_slide: function(time, ease) {
			Transform.animate(this.scroller, {
				translateX: -this.index * this.viewW
			}, time || 400, ease);
		}
	};
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define('mView', [], function() {
			return mView;
		});
	} else {
		window.mView = mView;
	}
})(window, document);