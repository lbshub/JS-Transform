# JS-Transform 
简单的(css3 transform) 矩阵变换动画封装

-----------------------------------------
### Transform.watch(el)
开始监控el元素的变换属性，自动判断matrix或者matrix3d支持

#### 监控的属性
* el.translateX  el.translateY  el.translateZ[2d中无效]
* el.scaleX  el.scaleY  el.scaleZ[2d中无效]
* el.rotateX  el.rotateY  el.rotateZ[2d中同el.rotate]  el.rotate[3d中同el.rotateZ]
* el.skewX  el.skewY  
* el.originX   el.originY el.originZ[2d中无效]

```js
var el  = document.querySelector('.test');
Transform.watch(el);

el.translateX = 500;
el.scaleX = 5;
el.skewX = 50;
el.rotateX = 90;

```
-----------------------------------------
### Transform.animate(el, props, opts)
在元素上使用动画 如未开启属性监控则自动调用Transform.watch(el)

#### 使用

```js

var el  = document.querySelector('.test');
var easing = function(k) {
	return Math.sqrt(1 - Math.pow(k - 1, 2));
};

// 1
Transform.animate(el, {translateX: 500, translateY: 500}); //持续时间默认 400ms

// 2
Transform.animate(el, {rotateZ: 3000}, 1500); //持续时间 1500ms

// 3
Transform.animate(el, {rotateZ: 3000}, function() {
	console.log('旋转完成');
});

// 4
Transform.animate(el, {rotateZ: 3000}, 1500, easing, function() {
	console.log('旋转完成');
});

// 5
Transform.animate(el, {
	translateX: 200
}, {
	duration: 500,
	ease: easing,
	change: function(el, prop, currentValue) {
		console.log('当前的[' + prop + ']值： ' + currentValue);
	},
	callback: function() {
		console.log('动画完成');
	}
});

```

### Transform.stop(el, bool)
停止队列中指定元素的动画 如果bool为true则动画立即完成并执行回调

### Transform.stopAll(bool)
停止队列中所有元素的动画  如果bool为true则动画立即完成并执行回调