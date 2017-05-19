biigle.$declare("export.api.volumes",Vue.resource("/api/v1/volumes{/id}/export-area")),biigle.$require("annotations.components.settingsTabPlugins").exportArea={props:{settings:{type:Object,required:!0}},data:function(){return{opacityValue:"1",currentImage:null,isEditing:!1,exportArea:null}},computed:{opacity:function(){return parseFloat(this.opacityValue)},shown:function(){return this.opacity>0},height:function(){return this.currentImage?this.currentImage.height:0},hasExportArea:function(){return null!==this.exportArea},exportAreaApi:function(){return biigle.$require("export.api.volumes")},volumeId:function(){return biigle.$require("annotations.volumeId")},messages:function(){return biigle.$require("messages.store")},layer:function(){return new ol.layer.Vector({source:new ol.source.Vector({features:new ol.Collection}),style:[new ol.style.Style({stroke:new ol.style.Stroke({color:"white",width:4}),image:new ol.style.Circle({radius:6,fill:new ol.style.Fill({color:"#666666"}),stroke:new ol.style.Stroke({color:"white",width:2,lineDash:[2]})})}),new ol.style.Style({stroke:new ol.style.Stroke({color:"#666666",width:1,lineDash:[2]})})],zIndex:4,updateWhileAnimating:!0,updateWhileInteracting:!0})},drawInteraction:function(){return new ol.interaction.Draw({source:this.layer.getSource(),type:"Rectangle",style:this.layer.getStyle(),minPoints:2,maxPoints:2,geometryFunction:function(e,t){e=e[0],e.length>1&&(e=[e[0],[e[0][0],e[1][1]],e[1],[e[1][0],e[0][1]]]);var i=t;return i?i.setCoordinates([e]):i=new ol.geom.Rectangle([e]),i}})},modifyInteraction:function(){return new ol.interaction.Modify({features:this.layer.getSource().getFeaturesCollection(),style:this.layer.getStyle(),deleteCondition:ol.events.condition.never})}},methods:{toggleEditing:function(){this.isEditing=!this.isEditing,this.isEditing?(this.drawInteraction.setActive(!0),this.modifyInteraction.setActive(!0)):(this.drawInteraction.setActive(!1),this.modifyInteraction.setActive(!1))},deleteArea:function(){if(this.hasExportArea&&confirm("Do you really want to delete the export area?")){var e=this,t=this.layer.getSource(),i=t.getFeatures()[0];t.clear(),this.exportAreaApi.delete({id:this.volumeId}).then(function(){e.exportArea=null}).catch(function(r){t.addFeature(i),e.messages.handleErrorResponse(r)})}},updateCurrentImage:function(e,t){this.currentImage=t},maybeDrawArea:function(){if(this.clearSource(),this.exportArea&&this.height>0){var e=new ol.geom.Rectangle([[[this.exportArea[0],this.height-this.exportArea[1]],[this.exportArea[0],this.height-this.exportArea[3]],[this.exportArea[2],this.height-this.exportArea[3]],[this.exportArea[2],this.height-this.exportArea[1]]]]);this.layer.getSource().addFeature(new ol.Feature({geometry:e}))}},handleModifyend:function(e){this.updateExportArea(e.features.item(0))},clearSource:function(){this.layer.getSource().clear()},handleDrawend:function(e){var t=this.layer.getSource(),i=t.getFeatures()[0];t.clear(),this.updateExportArea(e.feature).catch(function(){t.clear(),i&&t.addFeature(i)})},updateExportArea:function(e){var t=this,i=e.getGeometry().getCoordinates()[0];i=[i[0][0],this.height-i[0][1],i[2][0],this.height-i[2][1]].map(Math.round);var r=this.exportAreaApi.save({id:this.volumeId},{coordinates:i}).then(function(){t.exportArea=i});return r.catch(this.messages.handleErrorResponse),r}},watch:{opacity:function(e,t){e<1?this.settings.set("exportAreaOpacity",e):this.settings.delete("exportAreaOpacity"),this.layer.setOpacity(e)},exportArea:function(){this.maybeDrawArea()},height:function(){this.maybeDrawArea()}},created:function(){this.settings.has("exportAreaOpacity")&&(this.opacityValue=this.settings.get("exportAreaOpacity")),this.exportArea=biigle.$require("annotations.exportArea");var e=biigle.$require("biigle.events");e.$on("images.change",this.updateCurrentImage);var t=biigle.$require("annotations.stores.map");t.addLayer(this.layer),this.drawInteraction.setActive(!1),t.addInteraction(this.drawInteraction),this.modifyInteraction.setActive(!1),t.addInteraction(this.modifyInteraction),this.drawInteraction.on("drawend",this.handleDrawend),this.modifyInteraction.on("modifyend",this.handleModifyend)}};