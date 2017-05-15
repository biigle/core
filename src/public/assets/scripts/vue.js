biigle.$viewModel("annotations-navbar",function(t){new Vue({el:t,data:{filenameMap:{},currentImageId:null},computed:{currentImageFilename:function(){return this.filenameMap[this.currentImageId]||t.innerHTML}},methods:{updateId:function(t){this.currentImageId=t}},watch:{currentImageFilename:function(t){document.title="Annotate "+t}},created:function(){var t=biigle.$require("biigle.events"),e=biigle.$require("annotations.imagesIds"),n=biigle.$require("annotations.imagesFilenames"),i=this.filenameMap;e.forEach(function(t,e){i[t]=n[e]}),t.$on("images.change",this.updateId)}})}),biigle.$viewModel("annotator-container",function(t){var e=biigle.$require("biigle.events"),n=biigle.$require("annotations.imagesIds"),i=biigle.$require("annotations.stores.images"),o=biigle.$require("annotations.stores.annotations"),a=biigle.$require("volumes.urlParams"),r=biigle.$require("messages.store"),s=biigle.$require("annotations.stores.utils");new Vue({el:t,mixins:[biigle.$require("core.mixins.loader")],components:{sidebar:biigle.$require("annotations.components.sidebar"),sidebarTab:biigle.$require("core.components.sidebarTab"),labelsTab:biigle.$require("annotations.components.labelsTab"),colorAdjustmentTab:biigle.$require("annotations.components.colorAdjustmentTab"),annotationsTab:biigle.$require("annotations.components.annotationsTab"),annotationCanvas:biigle.$require("annotations.components.annotationCanvas")},data:{imageIndex:null,image:null,annotations:[],annotationFilter:null,lastCreatedAnnotation:null,lastCreatedAnnotationTimeout:null,mapCenter:void 0,mapResolution:void 0,selectedLabel:null},computed:{imageId:function(){return n[this.imageIndex]},selectedAnnotations:function(){return this.annotations.filter(function(t){return t.selected})},hasAnnotationFilter:function(){return"function"==typeof this.annotationFilter},filteredAnnotations:function(){return this.hasAnnotationFilter?this.annotations.filter(this.annotationFilter):this.annotations},supportsColorAdjustment:function(){return i.supportsColorAdjustment}},methods:{getImageAndAnnotationsPromises:function(){return[i.fetchAndDrawImage(this.imageId),o.fetchAnnotations(this.imageId)]},setCurrentImageAndAnnotations:function(t){this.image=t[0],this.annotations=t[1]},updateUrlSlug:function(){a.setSlug(this.imageId)},getNextIndex:function(t){return(t+1)%n.length},getPreviousIndex:function(t){return(t+n.length-1)%n.length},nextImage:function(){this.loading||(this.imageIndex=this.getNextIndex(this.imageIndex))},previousImage:function(){this.loading||(this.imageIndex=this.getPreviousIndex(this.imageIndex))},handleMapMoveend:function(t){this.mapCenter=t.center,this.mapResolution=t.resolution,a.set({r:Math.round(100*t.resolution),x:Math.round(t.center[0]),y:Math.round(t.center[1])})},handleSelectAnnotation:function(t,e){return e&&e.shiftKey?void(t.selected=!0):void this.annotations.forEach(function(e){e.selected=t.id===e.id})},handleSelectAnnotations:function(t,e){t.forEach(function(t){t.selected=!0}),e.forEach(function(t){t.selected=!1}),this.$refs.annotationsTab.scrollIntoView(this.selectedAnnotations)},handleDeselectAnnotation:function(t,e){return e&&e.shiftKey?void(t.selected=!1):void this.annotations.forEach(function(t){t.selected=!1})},handleFocusAnnotation:function(t){this.$refs.canvas.focusAnnotation(t)},handleDetachAnnotationLabel:function(t,e){o.detachLabel(t,e).catch(r.handleErrorResponse)},handleDeleteAnnotation:function(t){this.lastCreatedAnnotation&&this.lastCreatedAnnotation.id===t.id&&(this.lastCreatedAnnotation=null),o.delete(t).catch(r.handleErrorResponse)},handleDeleteAnnotations:function(t){t.forEach(this.handleDeleteAnnotation)},handleUpdateAnnotations:function(t){Vue.Promise.all(t.map(o.update)).catch(r.handleErrorResponse)},maybeSelectAndFocusAnnotation:function(){var t=a.get("annotation");if(t){t=parseInt(t);for(var e=this.annotations,n=e.length-1;n>=0;n--)if(e[n].id===t)return this.handleFocusAnnotation(e[n]),void(e[n].selected=!0)}},handleFilter:function(t){this.annotationFilter=t},handleSelectedLabel:function(t){this.selectedLabel=t},handleNewAnnotation:function(t,e){t.label_id=this.selectedLabel.id,t.confidence=1,o.create(this.imageId,t).then(this.setLastCreatedAnnotation).catch(function(t){e(),r.handleErrorResponse(t)})},handleAttachLabel:function(t,e){var n={label_id:e.id,confidence:1};o.attachLabel(t,n).catch(r.handleErrorResponse)},emitImageChanged:function(){e.$emit("images.change",this.imageId)},cachePreviousAndNext:function(){var t=n[this.getPreviousIndex(this.imageIndex)],e=n[this.getNextIndex(this.imageIndex)];Vue.Promise.all([o.fetchAnnotations(e),i.fetchImage(e)]).then(function(){o.fetchAnnotations(t),i.fetchImage(t)})},setLastCreatedAnnotation:function(t){this.lastCreatedAnnotationTimeout&&window.clearTimeout(this.lastCreatedAnnotationTimeout);var e=this;this.lastCreatedAnnotation=t,this.lastCreatedAnnotationTimeout=window.setTimeout(function(){e.lastCreatedAnnotation=null},1e4)},updateColorAdjustment:function(t){var e=this.$refs.canvas;s.debounce(function(){i.updateColorAdjustment(t),e.render()},100,"annotations.color-adjustment.update")}},watch:{imageIndex:function(t){this.startLoading(),Vue.Promise.all(this.getImageAndAnnotationsPromises()).then(this.setCurrentImageAndAnnotations).then(this.updateUrlSlug).then(this.maybeSelectAndFocusAnnotation).then(this.emitImageChanged).then(this.finishLoading).then(this.cachePreviousAndNext)}},created:function(){this.startLoading(),this.imageIndex=n.indexOf(biigle.$require("annotations.imageId")),void 0!==a.get("r")&&(this.mapResolution=parseInt(a.get("r"),10)/100),void 0!==a.get("x")&&void 0!==a.get("y")&&(this.mapCenter=[parseInt(a.get("x"),10),parseInt(a.get("y"),10)]),e.$on("annotations.select",this.handleSelectAnnotation),e.$on("annotations.deselect",this.handleDeselectAnnotation),e.$on("annotations.focus",this.handleFocusAnnotation),e.$on("annotations.detachLabel",this.handleDetachAnnotationLabel),e.$on("annotations.delete",this.handleDeleteAnnotation)}})}),biigle.$component("annotations.components.annotationCanvas",function(){var t,e,n,i,o,a,r,s={},l=new ol.layer.Image,c=new ol.Collection,u=new ol.source.Vector({features:c}),h=new ol.layer.Vector({source:u,zIndex:100,updateWhileAnimating:!0,updateWhileInteracting:!0});return{components:{loaderBlock:biigle.$require("core.components.loaderBlock"),minimap:biigle.$require("annotations.components.minimap"),labelIndicator:biigle.$require("annotations.components.labelIndicator"),controlButton:biigle.$require("annotations.components.controlButton")},props:{editable:{type:Boolean,default:!1},image:{type:Object,default:null},annotations:{type:Array,default:function(){return[]}},selectedAnnotations:{type:Array,default:function(){return[]}},loading:{type:Boolean,default:!1},center:{type:Array,default:void 0},resolution:{type:Number,default:void 0},selectedLabel:{default:null},lastCreatedAnnotation:{default:null}},data:function(){biigle.$require("annotations.stores.styles");return{initialized:!1,viewFitOptions:{padding:[50,50,50,50],minResolution:1},interactionMode:"default"}},computed:{extent:function(){return this.image?[0,0,this.image.width,this.image.height]:[0,0,0,0]},projection:function(){return new ol.proj.Projection({code:"biigle-image",units:"pixels",extent:this.extent})},selectedFeatures:function(){return n?n.getFeatures():[]},isDrawing:function(){return this.interactionMode.startsWith("draw")},isDrawingPoint:function(){return"drawPoint"===this.interactionMode},isDrawingRectangle:function(){return"drawRectangle"===this.interactionMode},isDrawingCircle:function(){return"drawCircle"===this.interactionMode},isDrawingLineString:function(){return"drawLineString"===this.interactionMode},isDrawingPolygon:function(){return"drawPolygon"===this.interactionMode},isTranslating:function(){return"translate"===this.interactionMode},hasNoSelectedLabel:function(){return!this.selectedLabel},hasSelectedAnnotations:function(){return this.selectedAnnotations.length>0},isAttaching:function(){return"attach"===this.interactionMode},hasLastCreatedAnnotation:function(){return null!==this.lastCreatedAnnotation}},methods:{getGeometry:function(t){for(var e=t.points,n=[],i=this.image.height,o=0;o<e.length;o+=2)n.push([e[o],i-(e[o+1]||0)]);switch(t.shape){case"Point":return new ol.geom.Point(n[0]);case"Rectangle":return new ol.geom.Rectangle([n]);case"Polygon":return new ol.geom.Polygon([n]);case"LineString":return new ol.geom.LineString(n);case"Circle":return new ol.geom.Circle(n[0],n[1][0]);default:return void console.error("Unknown annotation shape: "+t.shape)}},createFeature:function(t){var e=new ol.Feature({geometry:this.getGeometry(t)});return e.setId(t.id),e.set("annotation",t),t.labels&&t.labels.length>0&&e.set("color",t.labels[0].label.color),e},handleFeatureModifyStart:function(t){t.features.forEach(function(t){s[t.getId()]=t.getRevision()})},handleFeatureModifyEnd:function(t){var e=this,n=t.features.getArray().filter(function(t){return s[t.getId()]!==t.getRevision()}).map(function(t){return{id:t.getId(),image_id:t.get("annotation").image_id,points:e.getPoints(t.getGeometry())}});n.length>0&&this.$emit("update",n)},focusAnnotation:function(e){var n=u.getFeatureById(e.id);if(n){var i=t.getView(),o=ol.animation.pan({source:i.getCenter()}),a=ol.animation.zoom({resolution:i.getResolution()});t.beforeRender(o,a),i.fit(n.getGeometry(),t.getSize(),this.viewFitOptions)}},handleFeatureSelect:function(t){var e=function(t){return t.get("annotation")};this.$emit("select",t.selected.map(e),t.deselected.map(e))},handlePreviousImage:function(){this.$emit("previous")},handleNextImage:function(){this.$emit("next")},resetInteractionMode:function(){this.interactionMode="default"},draw:function(t){this["isDrawing"+t]?this.resetInteractionMode():this.interactionMode="draw"+t},drawPoint:function(){this.draw("Point")},drawRectangle:function(){this.draw("Rectangle")},drawCircle:function(){this.draw("Circle")},drawLineString:function(){this.draw("LineString")},drawPolygon:function(){this.draw("Polygon")},getPoints:function(t){var e;switch(t.getType()){case"Circle":e=[t.getCenter(),[t.getRadius()]];break;case"Polygon":case"Rectangle":e=t.getCoordinates()[0];break;case"Point":e=[t.getCoordinates()];break;default:e=t.getCoordinates()}e=Array.prototype.concat.apply([],e);for(var n=this.image.height,i=1;i<e.length;i+=2)e[i]=n-e[i];return e},handleNewFeature:function(t){var e=t.feature.getGeometry();t.feature.set("color",this.selectedLabel.color);var n=function(){u.removeFeature(t.feature)};this.$emit("new",{shape:e.getType(),points:this.getPoints(e)},n)},deleteSelectedAnnotations:function(){this.hasSelectedAnnotations&&confirm("Are you sure you want to delete all selected annotations?")&&this.$emit("delete",this.selectedAnnotations)},deleteLastCreatedAnnotation:function(){this.hasLastCreatedAnnotation&&this.$emit("delete",[this.lastCreatedAnnotation])},toggleTranslating:function(){this.isTranslating?this.resetInteractionMode():this.interactionMode="translate"},toggleAttaching:function(){this.isAttaching?this.resetInteractionMode():this.hasNoSelectedLabel||(this.interactionMode="attach")},handleAttachLabel:function(t){this.$emit("attach",t.feature.get("annotation"),this.selectedLabel)},handleNewInteractionMode:function(s){if(i&&t.removeInteraction(i),this.isDrawing)this.hasNoSelectedLabel?(biigle.$require("biigle.events").$emit("sidebar.open","labels"),biigle.$require("messages.store").info("Please select a label first."),this.resetInteractionMode()):(n.setActive(!1),o.setActive(!1),a.setActive(!1),r.setActive(!1),i=new ol.interaction.Draw({source:u,type:s.slice(4),style:e.editing}),i.on("drawend",this.handleNewFeature),t.addInteraction(i));else switch(s){case"translate":n.setActive(!0),o.setActive(!1),a.setActive(!0),r.setActive(!1);break;case"attach":n.setActive(!1),o.setActive(!1),a.setActive(!1),r.setActive(!0);break;default:n.setActive(!0),o.setActive(!0),a.setActive(!1),r.setActive(!1)}},render:function(){t&&t.render()}},watch:{image:function(t,e){e&&e.width===t.width&&e.height===t.height||l.setSource(new ol.source.Canvas({canvas:t.canvas,projection:this.projection,canvasExtent:this.extent,canvasSize:[t.width,t.height]}))},annotations:function(t){var e={};t.forEach(function(t){e[t.id]=null});var n={},i=u.getFeatures(),o=i.filter(function(t){return n[t.getId()]=null,!e.hasOwnProperty(t.getId())});o.length===i.length?u.clear(!0):(o.forEach(function(t){u.removeFeature(t)}),t=t.filter(function(t){return!n.hasOwnProperty(t.id)})),u.addFeatures(t.map(this.createFeature))},selectedAnnotations:function(t){var e=u,n=this.selectedFeatures;n.clear(),t.forEach(function(t){n.push(e.getFeatureById(t.id))})},extent:function(e,n){if(e[2]!==n[2]||e[3]!==n[3]){var i=ol.extent.getCenter(e);this.initialized||(i=this.center||i,this.initialized=!0),t.setView(new ol.View({projection:this.projection,center:i,resolution:this.resolution,zoomFactor:1.5,minResolution:.25,extent:e})),void 0===this.resolution&&t.getView().fit(e,t.getSize())}},selectedLabel:function(t){t||(this.isDrawing||this.isAttaching)&&this.resetInteractionMode()}},created:function(){var i=this;if(e=biigle.$require("annotations.stores.styles"),t=biigle.$require("annotations.stores.map"),t.addLayer(l),h.setStyle(e.features),t.addLayer(h),biigle.$require("biigle.events").$on("sidebar.toggle",function(){i.$nextTick(function(){t.updateSize()})}),t.on("moveend",function(e){var n=t.getView();i.$emit("moveend",{center:n.getCenter(),resolution:n.getResolution()})}),n=new ol.interaction.Select({style:e.highlight,layers:[h],multi:!0}),n.on("select",this.handleFeatureSelect),t.addInteraction(n),this.editable){o=new ol.interaction.Modify({features:n.getFeatures(),deleteCondition:function(t){return ol.events.condition.shiftKeyOnly(t)&&ol.events.condition.singleClick(t)}}),o.on("modifystart",this.handleFeatureModifyStart),o.on("modifyend",this.handleFeatureModifyEnd),t.addInteraction(o);var s=biigle.$require("annotations.ol.ExtendedTranslateInteraction");a=new s({features:n.getFeatures(),map:t}),a.setActive(!1),a.on("translatestart",this.handleFeatureModifyStart),a.on("translateend",this.handleFeatureModifyEnd),t.addInteraction(a);var u=biigle.$require("annotations.ol.AttachLabelInteraction");r=new u({features:c,map:t}),r.setActive(!1),r.on("attach",this.handleAttachLabel),t.addInteraction(r)}var d=biigle.$require("labelTrees.stores.keyboard");d.on(32,this.handleNextImage),d.on(39,this.handleNextImage),d.on(37,this.handlePreviousImage),d.on(27,this.resetInteractionMode),this.editable&&(d.on(46,this.deleteSelectedAnnotations),d.on(8,this.deleteLastCreatedAnnotation),d.on("a",this.drawPoint),d.on("s",this.drawRectangle),d.on("d",this.drawCircle),d.on("f",this.drawLineString),d.on("g",this.drawPolygon),d.on("m",this.toggleTranslating),d.on("l",this.toggleAttaching),this.$watch("interactionMode",this.handleNewInteractionMode))},mounted:function(){t.setTarget(this.$el)}}}),biigle.$component("annotations.components.annotationsFilter",{components:{typeahead:biigle.$require("core.components.typeahead")},props:{annotations:{type:Array,required:!0}},data:function(){return{availableFilters:["label","user","shape","session"],selectedFilter:null,selectedData:null,active:!1}},computed:{placeholder:function(){return this.selectedFilter?this.selectedFilter+" name":"filter annotations"},labelData:function(){var t={},e=[];this.annotations.forEach(function(e){e.labels.forEach(function(e){t[e.label.id]=e.label})});for(var n in t)t.hasOwnProperty(n)&&e.push(t[n]);return e},userData:function(){var t={},e=[];this.annotations.forEach(function(e){e.labels.forEach(function(e){t[e.user.id]=e.user})});for(var n in t)t.hasOwnProperty(n)&&(t[n].name=t[n].firstname+" "+t[n].lastname,e.push(t[n]));return e},shapeData:function(){var t=biigle.$require("annotations.shapes"),e=[];for(var n in t)t.hasOwnProperty(n)&&e.push({id:parseInt(n,10),name:t[n]});return e},sessionData:function(){return biigle.$require("annotations.sessions").map(function(t){return t.starts_at=new Date(t.starts_at),t.ends_at=new Date(t.ends_at),t})},data:function(){return this.selectedFilter?this[this.selectedFilter+"Data"]||[]:[]},selectedDataName:function(){return this.selectedData?this.selectedData.name:""}},methods:{labelFilterFunction:function(t){return function(e){return e.labels.filter(function(e){return e.label.id===t.id}).length>0}},userFilterFunction:function(t){return function(e){return e.labels.filter(function(e){return e.user.id===t.id}).length>0}},shapeFilterFunction:function(t){return function(e){return e.shape_id===t.id}},sessionFilterFunction:function(t){var e={};return t.users.forEach(function(t){e[t.id]=null}),function(n){for(var i=n.labels.length-1;i>=0;i--)if(e.hasOwnProperty(n.labels[i].user.id)){var o=new Date(n.created_at);return o>=t.starts_at&&o<t.ends_at}return!1}},selectData:function(t){this.selectedData=t,this.activateFilter()},activateFilter:function(){this.selectedFilter&&this.selectedData&&(this.active=!0,this.$emit("filter",this[this.selectedFilter+"FilterFunction"](this.selectedData)))},deactivateFilter:function(){this.active=!1,this.selectedData=null,this.$emit("filter",null)}}}),biigle.$component("annotations.components.annotationsTab",{components:{labelItem:biigle.$require("annotations.components.annotationsTabItem"),annotationsFilter:biigle.$require("annotations.components.annotationsFilter")},props:{annotations:{type:Array,required:!0},filteredAnnotations:{type:Array,required:!0}},computed:{items:function(){var t=[],e={};return this.filteredAnnotations.forEach(function(n){n.labels.forEach(function(i){var o={annotation:n,annotationLabel:i};e.hasOwnProperty(i.label.id)?e[i.label.id].push(o):(e[i.label.id]=[o],t.push(i.label))})}),t.map(function(t){return{label:t,annotations:e[t.id]}})}},methods:{reallyScrollIntoView:function(t){var e,n=this.$refs.scrollList,i=n.scrollTop,o=n.offsetHeight,a=1/0,r=0;t.forEach(function(t){for(var i=n.querySelectorAll('[data-annotation-id="'+t.id+'"]'),o=i.length-1;o>=0;o--)e=i[o],a=Math.min(e.offsetTop,a),r=Math.max(e.offsetTop+e.offsetHeight,r)},this),i>a?n.scrollTop=a:i+o<r&&(o>=r-a?n.scrollTop=r-n.offsetHeight:n.scrollTop=a)},scrollIntoView:function(t){0!==t.length&&this.$nextTick(function(){this.reallyScrollIntoView(t)})},keepElementPosition:function(t){var e=this.$refs.scrollList,n=t.offsetTop-e.scrollTop;this.$nextTick(function(){this.$nextTick(function(){var i=t.offsetTop-e.scrollTop;e.scrollTop+=i-n})})},bubbleFilter:function(t){this.$emit("filter",t)}}}),biigle.$component("annotations.components.annotationsTabItem",{components:{annotationItem:biigle.$require("annotations.components.annotationsTabSubItem")},props:{item:{type:Object,required:!0}},data:function(){return{isOpen:!1}},computed:{label:function(){return this.item.label},annotationItems:function(){return this.item.annotations},count:function(){return this.annotationItems.length},hasSelectedAnnotation:function(){for(var t=this.annotationItems,e=t.length-1;e>=0;e--)if(t[e].annotation.selected===!0)return!0;return!1},isSelected:function(){return this.isOpen||this.hasSelectedAnnotation},classObject:function(){return{selected:this.isSelected}},colorStyle:function(){return{"background-color":"#"+this.label.color}},title:function(){return"List all annotations with label "+this.label.name},countTitle:function(){return"There are "+this.count+" annotations with this label"}},methods:{toggleOpen:function(){this.isOpen=!this.isOpen},bubbleSelect:function(t){this.$emit("select",t)}}}),biigle.$component("annotations.components.annotationsTabSubItem",{props:{item:{type:Object,required:!0},userId:{type:Number,required:!0}},computed:{annotation:function(){return this.item.annotation},label:function(){return this.item.annotationLabel},isSelected:function(){return this.annotation.selected},classObject:function(){return{selected:this.isSelected}},shapeClass:function(){return"icon-"+this.annotation.shape.toLowerCase()},username:function(){return this.label.user?this.label.user.firstname+" "+this.label.user.lastname:"(user deleted)"},canBeDetached:function(){return this.label.user&&this.label.user.id===this.userId},events:function(){return biigle.$require("biigle.events")}},methods:{toggleSelect:function(t){this.$emit("select",this.$el),this.isSelected?this.events.$emit("annotations.deselect",this.annotation,t):this.events.$emit("annotations.select",this.annotation,t)},focus:function(){this.events.$emit("annotations.focus",this.annotation)},detach:function(){this.annotation.labels.length>1?this.events.$emit("annotations.detachLabel",this.annotation,this.label):confirm("Detaching the last label will delete the annotation. Proceed?")&&this.events.$emit("annotations.delete",this.annotation)}}}),biigle.$component("annotations.components.colorAdjustmentTab",{data:function(){return{isBrightnessRgbActive:!1,colorAdjustment:{brightnessContrast:[0,0],brightnessRGB:[0,0,0],hueSaturation:[0,0],vibrance:[0]}}},methods:{resetType:function(t,e){void 0!==e?this.colorAdjustment[t].splice(e,1,0):this.colorAdjustment[t]=this.colorAdjustment[t].map(function(){return 0})},reset:function(){for(var t in this.colorAdjustment)this.colorAdjustment.hasOwnProperty(t)&&this.resetType(t)},toggleBrightnessRgb:function(){this.isBrightnessRgbActive?this.resetType("brightnessRGB"):this.resetType("brightnessContrast",0),this.isBrightnessRgbActive=!this.isBrightnessRgbActive}},watch:{colorAdjustment:{handler:function(){this.$emit("change",this.colorAdjustment)},deep:!0}}}),biigle.$component("annotations.components.controlButton",{template:'<button class="control-button btn btn-sm" :title="title" :class="buttonClass" @click="handleClick"><span :class="iconClass" aria-hidden="true"></span></button>',props:{title:{type:String,default:""},icon:{type:String,required:!0},active:{type:Boolean,default:!1}},computed:{buttonClass:function(){return{active:this.active}},iconClass:function(){return this.icon.startsWith("glyphicon-")?"glyphicon "+this.icon:"icon icon-white "+this.icon}},methods:{handleClick:function(){this.$emit("click")}}}),biigle.$component("annotations.components.labelIndicator",{props:{label:{required:!0}},computed:{hasLabel:function(){return!!this.label}}}),biigle.$component("annotations.components.labelsTab",{components:{labelTrees:biigle.$require("labelTrees.components.labelTrees")},data:function(){return{labelTrees:biigle.$require("annotations.labelTrees")}},methods:{handleSelectedLabel:function(t){this.$emit("select",t)},handleDeselectedLabel:function(t){this.$emit("select",null)}}}),biigle.$component("annotations.components.minimap",function(){var t=new ol.Map({controls:[],interactions:[]}),e=new ol.source.Vector,n=new ol.Feature;e.addFeature(n);var i,o;return{props:{extent:{type:Array,required:!0},projection:{type:Object,required:!0}},methods:{refreshViewport:function(){n.setGeometry(ol.geom.Polygon.fromExtent(i.calculateExtent(o)))},dragViewport:function(t){i.setCenter(t.coordinate)}},computed:{intendedWidth:function(){return this.$el.clientWidth},intendedHeight:function(){return this.$el.clientHeight}},created:function(){var n=biigle.$require("annotations.stores.map");o=n.getSize(),i=n.getView(),t.addLayer(n.getLayers().item(0)),t.addLayer(new ol.layer.Vector({source:e,style:biigle.$require("annotations.stores.styles").viewport})),n.on("postcompose",this.refreshViewport),n.on("change:size",function(){o=n.getSize()}),n.on("change:view",function(){i=n.getView()}),t.on("pointerdrag",this.dragViewport),t.on("click",this.dragViewport)},watch:{extent:function(e){var n=Math.max(e[2]/this.intendedWidth,e[3]/this.intendedHeight);t.setView(new ol.View({projection:this.projection,center:ol.extent.getCenter(e),resolution:n})),this.$el.style.width=Math.round(e[2]/n)+"px",this.$el.style.height=Math.round(e[3]/n)+"px",t.updateSize()}},mounted:function(){t.setTarget(this.$el)}}}),biigle.$component("annotations.components.sidebar",{mixins:[biigle.$require("core.components.sidebar")],created:function(){var t=this;biigle.$require("biigle.events").$on("sidebar.open",function(e){t.$emit("open",e)})}}),biigle.$declare("annotations.ol.AttachLabelInteraction",function(){function t(t){ol.interaction.Pointer.call(this,{handleUpEvent:this.handleUpEvent,handleDownEvent:this.handleDownEvent,handleMoveEvent:this.handleMoveEvent}),this.on("change:active",this.toggleActive),this.features=void 0!==t.features?t.features:null,this.currentFeature=void 0,this.map=t.map}return ol.inherits(t,ol.interaction.Pointer),t.prototype.toggleActive=function(t){if(t.oldValue){var e=this.map.getTargetElement();e&&(e.style.cursor="")}},t.prototype.handleDownEvent=function(t){return this.currentFeature=this.featuresAtPixel(t.pixel,t.map),!!this.currentFeature},t.prototype.handleUpEvent=function(t){this.currentFeature&&this.currentFeature.get("annotation")&&this.dispatchEvent({type:"attach",feature:this.currentFeature}),this.currentFeature=void 0},t.prototype.handleMoveEvent=function(t){var e=t.map.getTargetElement(),n=this.featuresAtPixel(t.pixel,t.map);n?e.style.cursor="pointer":e.style.cursor=""},t.prototype.featuresAtPixel=function(t,e){var n=null,i=e.forEachFeatureAtPixel(t,function(t){return t},this);return this.handlesFeature(i)&&(n=i),n},t.prototype.handlesFeature=function(t){return!!this.features&&this.features.getArray().indexOf(t)!==-1},t}),biigle.$declare("annotations.ol.ExtendedTranslateInteraction",function(){function t(t){ol.interaction.Translate.call(this,t),this.features=void 0!==t.features?t.features:null,this.on("change:active",this.toggleListeners);var e=this;this.translateUp=function(){return e.translate(0,1)},this.translateDown=function(){return e.translate(0,-1)},this.translateLeft=function(){return e.translate(-1,0)},this.translateRight=function(){return e.translate(1,0)},this.keyboard=biigle.$require("labelTrees.stores.keyboard"),this.utils=biigle.$require("annotations.stores.utils"),this.map=t.map,this.translating=!1}return ol.inherits(t,ol.interaction.Translate),t.prototype.toggleListeners=function(t){if(t.oldValue){this.keyboard.off(37,this.translateLeft),this.keyboard.off(38,this.translateUp),this.keyboard.off(39,this.translateRight),this.keyboard.off(40,this.translateDown);var e=this.map.getTargetElement();e&&(e.style.cursor="")}else this.keyboard.on(37,this.translateLeft,10),this.keyboard.on(38,this.translateUp,10),this.keyboard.on(39,this.translateRight,10),this.keyboard.on(40,this.translateDown,10)},t.prototype.translate=function(t,e){if(this.features&&this.features.getLength()>0){this.translating||(this.dispatchEvent({type:"translatestart",features:this.features}),this.translating=!0),this.features.forEach(function(n){var i=n.getGeometry();i.translate(t,e),n.setGeometry(i)});var n=this,i=function(){n.translating=!1,n.dispatchEvent({type:"translateend",features:n.features})};return this.utils.debounce(i,500,"ol.interactions.Translate.translateend"),!1}return!0},t}),biigle.$declare("annotations.ol.ZoomToNativeControl",function(){function t(t){var e=t||{},n=e.label?e.label:"1",i=document.createElement("button"),o=this;i.innerHTML=n,i.title="Zoom to original resolution",i.addEventListener("click",function(){o.zoomToNative.call(o)});var a=document.createElement("div");a.className="zoom-to-native ol-unselectable ol-control",a.appendChild(i),ol.control.Control.call(this,{element:a,target:e.target}),this.duration_=void 0!==e.duration?e.duration:250}return ol.inherits(t,ol.control.Control),t.prototype.zoomToNative=function(){var t=this.getMap(),e=t.getView();if(e){var n=e.getResolution();n&&(this.duration_>0&&t.beforeRender(ol.animation.zoom({resolution:n,duration:this.duration_,easing:ol.easing.easeOut})),e.setResolution(e.constrainResolution(1)))}},t}),biigle.$declare("annotations.stores.annotations",function(){var t=(biigle.$require("biigle.events"),biigle.$require("api.images")),e=biigle.$require("api.annotations");return new Vue({data:{cache:{}},computed:{imageFileUri:function(){return biigle.$require("annotations.imageFileUri")},shapeMap:function(){return biigle.$require("annotations.shapes")},inverseShapeMap:function(){var t={};for(var e in this.shapeMap)t[this.shapeMap[e]]=parseInt(e,10);return t}},methods:{parseResponse:function(t){return t.data},resolveShape:function(t){return t.shape=this.shapeMap[t.shape_id],t},resolveAllShapes:function(t){return t.forEach(this.resolveShape,this),t},setSelected:function(t){return t.selected=!1,t},setAllSelected:function(t){return t.forEach(this.setSelected),t},fetchAnnotations:function(e){return this.cache.hasOwnProperty(e)||(this.cache[e]=t.getAnnotations({id:e}).then(this.parseResponse).then(this.resolveAllShapes)),this.cache[e].then(this.setAllSelected)},create:function(e,n){n.shape_id=this.inverseShapeMap[n.shape],delete n.shape;var i=this;return t.saveAnnotations({id:e},n).then(this.parseResponse).then(this.resolveShape).then(this.setSelected).then(function(t){return i.cache[e].then(function(e){e.push(t)}),t})},update:function(t){var n=this,i=e.update({id:t.id},{points:t.points});return i.then(function(){n.cache[t.image_id].then(function(e){for(var n=e.length-1;n>=0;n--)if(e[n].id===t.id)return void(e[n].points=t.points)})}),i},attachLabel:function(t,n){var i=e.attachLabel({id:t.id},n);return i.then(function(e){t.labels.push(e.data)}),i},detachLabel:function(t,n){var i=e.detachLabel({annotation_label_id:n.id});return i.then(function(){for(var e=t.labels.length-1;e>=0;e--)if(t.labels[e].id===n.id)return void t.labels.splice(e,1)}),i},delete:function(t){var n=e.delete({id:t.id}),i=this.cache[t.image_id];return n.then(function(){i.then(function(e){for(var n=e.length-1;n>=0;n--)if(e[n].id===t.id)return void e.splice(n,1)})}),n}}})}),biigle.$declare("annotations.stores.images",function(){var t,e=(biigle.$require("biigle.events"),document.createElement("canvas"));try{t=fx.canvas();var n=null,i=null}catch(t){console.log("WebGL not supported. Color adjustment disabled.")}return window.onbeforeunload=function(){n&&(n.destroy(),t.width=1,t.height=1)},new Vue({data:{cache:{},cachedIds:[],maxCacheSize:10,supportsColorAdjustment:!1,currentlyDrawnImage:null,colorAdjustment:{brightnessContrast:[0,0],brightnessRGB:[0,0,0],hueSaturation:[0,0],vibrance:[0]}},computed:{imageFileUri:function(){return biigle.$require("annotations.imageFileUri")},supportedTextureSize:function(){return t?t._.gl.getParameter(t._.gl.MAX_TEXTURE_SIZE):0},isRemoteVolume:function(){return biigle.$require("annotations.volumeIsRemote")},hasColorAdjustment:function(){for(var t in this.colorAdjustment)if(this.colorAdjustment.hasOwnProperty(t)&&this.isAdjustmentActive(t))return!0;return!1}},methods:{isAdjustmentActive:function(t){return 0!==this.colorAdjustment[t].reduce(function(t,e){return t+e})},checkSupportsColorAdjustment:function(e){if(!t||this.isRemoteVolume)return!1;if(this.currentlyDrawnImage&&this.currentlyDrawnImage.width===e.width&&this.currentlyDrawnImage.height===e.height)return this.supportsColorAdjustment;var n=this.supportedTextureSize;return n<e.width||n<e.height?(console.log("Insufficient WebGL texture size. Required: "+e.width+"x"+e.height+", available: "+n+"x"+n+". Color adjustment disabled."),void(this.supportsColorAdjustment=!1)):(t.width=e.width,t.height=e.height,e.width!==t._.gl.drawingBufferWidth||e.height!==t._.gl.drawingBufferHeight?(console.log("Your browser does not allow a WebGL drawing buffer with the size of the original image. Color adjustment disabled."),void(this.supportsColorAdjustment=!1)):void(this.supportsColorAdjustment=!0))},createImage:function(t){var n=document.createElement("img"),i=new Vue.Promise(function(i,o){n.onload=function(){i({source:this,width:this.width,height:this.height,canvas:e})},n.onerror=function(){o("Failed to load image "+t+"!")}});return n.src=this.imageFileUri.replace("{id}",t),i},drawSimpleImage:function(t){return t.canvas.width=t.width,t.canvas.height=t.height,t.canvas.getContext("2d").drawImage(t.source,0,0),t},drawColorAdjustedImage:function(e){i!==e.source.src&&(n?n.loadContentsOf(e.source):n=t.texture(e.source),i=e.source.src),t.draw(n);for(var o in this.colorAdjustment)this.colorAdjustment.hasOwnProperty(o)&&this.isAdjustmentActive(o)&&t[o].apply(t,this.colorAdjustment[o]);
return t.update(),e.canvas.width=e.width,e.canvas.height=e.height,e.canvas.getContext("2d").drawImage(t,0,0),e},drawImage:function(t){return this.checkSupportsColorAdjustment(t),this.currentlyDrawnImage=t,this.supportsColorAdjustment&&this.hasColorAdjustment?this.drawColorAdjustedImage(t):this.drawSimpleImage(t)},fetchImage:function(t){return this.cache.hasOwnProperty(t)||(this.cache[t]=this.createImage(t),this.cachedIds.push(t)),this.cache[t]},fetchAndDrawImage:function(t){return this.fetchImage(t).then(this.drawImage)},updateColorAdjustment:function(t){if(this.supportsColorAdjustment){var e,n,i=this.colorAdjustment,o=this.hasColorAdjustment;for(e in t)if(t.hasOwnProperty(e))for(n=t[e].length-1;n>=0;n--)i[e].splice(n,1,t[e][n]);this.hasColorAdjustment?this.drawColorAdjustedImage(this.currentlyDrawnImage):o&&this.drawSimpleImage(this.currentlyDrawnImage)}}},watch:{cachedIds:function(t){if(t.length>this.maxCacheSize){var e=t.shift();this.cache[e];delete this.cache[e]}}}})}),biigle.$declare("annotations.stores.map",function(){var t=new ol.Map({renderer:"canvas",controls:[new ol.control.Zoom,new ol.control.ZoomToExtent({tipLabel:"Zoom to show whole image",label:""})],interactions:ol.interaction.defaults({altShiftDragRotate:!1,doubleClickZoom:!1,keyboard:!1,shiftDragZoom:!1,pinchRotate:!1,pinchZoom:!1})}),e=biigle.$require("annotations.ol.ZoomToNativeControl");return t.addControl(new e({label:""})),t}),biigle.$declare("annotations.stores.styles",function(){var t={white:[255,255,255,1],blue:[0,153,255,1],orange:"#ff5e00"},e=6,n=3,i=new ol.style.Stroke({color:t.white,width:5}),o=new ol.style.Stroke({color:t.white,width:6}),a=new ol.style.Stroke({color:t.blue,width:n}),r=new ol.style.Stroke({color:t.orange,width:n}),s=new ol.style.Fill({color:t.blue}),l=new ol.style.Fill({color:t.orange}),c=new ol.style.Stroke({color:t.white,width:2}),u=new ol.style.Stroke({color:t.white,width:n}),h=new ol.style.Stroke({color:t.white,width:2,lineDash:[3]}),d=new ol.style.Stroke({color:t.blue,width:n,lineDash:[5]});new ol.style.Fill({color:t.blue}),new ol.style.Fill({color:t.orange});return{colors:t,features:function(n){var o=n.get("color");return o=o?"#"+o:t.blue,[new ol.style.Style({stroke:i,image:new ol.style.Circle({radius:e,fill:new ol.style.Fill({color:o}),stroke:c})}),new ol.style.Style({stroke:new ol.style.Stroke({color:o,width:3})})]},highlight:[new ol.style.Style({stroke:o,image:new ol.style.Circle({radius:e,fill:l,stroke:u}),zIndex:200}),new ol.style.Style({stroke:r,zIndex:200})],editing:[new ol.style.Style({stroke:i,image:new ol.style.Circle({radius:e,fill:s,stroke:h})}),new ol.style.Style({stroke:d})],viewport:[new ol.style.Style({stroke:a}),new ol.style.Style({stroke:new ol.style.Stroke({color:t.white,width:1})})]}}),biigle.$declare("annotations.stores.utils",function(){var t={},e={};return{debounce:function(e,n,i){t.hasOwnProperty(i)&&window.clearTimeout(t[i]),t[i]=window.setTimeout(e,n)},delay:function(t,n,i){e.hasOwnProperty(i)||(e[i]=window.setTimeout(function(){t(),delete e[i]},n))}}});