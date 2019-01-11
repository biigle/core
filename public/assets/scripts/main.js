biigle={},biigle.$viewModel=function(e,i){window.addEventListener("load",function(){var t=document.getElementById(e);t&&i(t)})},biigle.$require=function(e){e=Array.isArray(e)?e:e.split(".");for(var i=biigle,t=0,n=e.length;t<n;t++)i.hasOwnProperty(e[t])||(i[e[t]]={}),i=i[e[t]];return i},biigle.$declare=function(e,i){e=e.split(".");var t=e.pop();return biigle.$require(e)[t]="function"==typeof i?i():i,i},biigle.$component=function(e,i){var t=biigle.$require(e);"function"==typeof i&&(i=i());for(var n in i)i.hasOwnProperty(n)&&(t[n]=i[n]);return t},biigle.$viewModel("video-container",function(e){new Vue({el:e,components:{videoScreen:biigle.$require("components.videoScreen")},data:{},computed:{},methods:{play:function(){this.$refs.videoScreen.play()},pause:function(){this.$refs.videoScreen.pause()}}})}),biigle.$component("components.videoScreen",{template:'<div class="video-screen"></div>',props:{src:{type:String,required:!0}},data:function(){return{playing:!1,animationFrameId:null}},computed:{},methods:{createMap:function(){return new ol.Map({renderer:"canvas",interactions:ol.interaction.defaults({altShiftDragRotate:!1,doubleClickZoom:!1,keyboard:!1,shiftDragZoom:!1,pinchRotate:!1,pinchZoom:!1})})},createVideoLayer:function(){this.videoCanvas.width=this.video.videoWidth,this.videoCanvas.height=this.video.videoHeight;var e=[0,0,this.videoCanvas.width,this.videoCanvas.height],i=new ol.proj.Projection({code:"biigle-image",units:"pixels",extent:e});this.videoLayer=new ol.layer.Image({map:this.map,source:new ol.source.Canvas({canvas:this.videoCanvas,projection:this.projection,canvasExtent:e,canvasSize:[e[0],e[1]]})}),this.map.setView(new ol.View({projection:i,minResolution:.25,extent:e})),this.map.getView().fit(e)},renderVideo:function(){this.videoCanvasCtx.drawImage(this.video,0,0,this.video.videoWidth,this.video.videoHeight),this.map.render()},startRenderLoop:function(){this.renderVideo(),this.animationFrameId=window.requestAnimationFrame(this.startRenderLoop)},stopRenderLoop:function(){window.cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null},setPlaying:function(){this.playing=!0},setPaused:function(){this.playing=!1},play:function(){this.video.play()},pause:function(){this.video.pause()}},watch:{playing:function(e){console.log("playing",e),e&&!this.animationFrameId?this.startRenderLoop():e||this.stopRenderLoop()}},created:function(){this.map=this.createMap(),this.videoCanvas=document.createElement("canvas"),this.videoCanvasCtx=this.videoCanvas.getContext("2d"),this.video=document.createElement("video"),this.video.muted=!0,this.video.addEventListener("loadedmetadata",this.createVideoLayer),this.video.addEventListener("play",this.setPlaying),this.video.addEventListener("pause",this.setPaused),this.video.src=this.src},mounted:function(){this.map.setTarget(this.$el)}});