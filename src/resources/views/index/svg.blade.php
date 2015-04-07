<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" class="canvas__svg" data-ng-attr-height="@{{ height }}" data-ng-attr-width="@{{ width }}" data-ng-controller="SVGController">
	<defs>
		<circle id="marker" data-ng-attr-r="@{{10 / svg.scale}}" fill="red"/>
	</defs>
	<g data-ng-attr-transform="translate(@{{ svg.translateX }}, @{{ svg.translateY }}) scale(@{{ svg.scale }})" data-ng-mousedown="startPanning($event)" data-ng-mousemove="pan()" data-ng-mouseup="stopPanning()">
		<image xlink:href="" data-ng-attr-xlink:href="@{{ image.src }}" data-ng-attr-height="@{{ height }}" data-ng-attr-width="@{{ width }}" data-ng-repeat="image in images | filter: {_show: true}" data-ng-index="@{{ image._index }}"/>
		{{-- <use xlink:href="#marker" data-ng-attr-transform="translate(@{{ svg.mouseX }}, @{{ svg.mouseY }})"/> --}}
	</g>

	<image data-ng-if="imageLoading" x="0" y="0" width="50" height="50" xlink:href="{{ asset('assets/images/dias_Jelly-Fish.png') }}" data-ng-attr-transform="translate(@{{ width / 2 - 25 }}, @{{ height / 2 - 25 }})">
		<animate attributeName="y" calcMode="spline" dur="1s" repeatCount="indefinite" from="30" to="30" values="30;-30;30" keySplines="0.4 0.8 0.4 0.8;0.8 0.4 0.8 0.4" keyTimes="0;0.5;1"></animate>
	</image>
</svg>