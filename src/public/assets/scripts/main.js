biigle.$viewModel("export-project-report-form",function(e){var t=biigle.$require("export.projectId");new Vue({el:e,mixins:[biigle.$require("export.mixins.reportForm")],data:{allowedOptions:{Annotations:["export_area","newest_label","separate_label_trees"],ImageLabels:["separate_label_trees"]}},methods:{submit:function(){this.request(t,biigle.$require("export.api.projectReports"))}}})}),biigle.$viewModel("export-volume-report-form",function(e){var t=biigle.$require("export.volumeId");new Vue({el:e,mixins:[biigle.$require("export.mixins.reportForm")],data:{allowedOptions:{Annotations:["export_area","newest_label","separate_label_trees","annotation_session_id"],ImageLabels:["separate_label_trees","annotation_session_id"]},options:{annotation_session_id:null}},methods:{submit:function(){this.request(t,biigle.$require("export.api.volumeReports"))}}})}),biigle.$declare("export.api.projectReports",Vue.resource("/api/v1/projects{/id}/reports")),biigle.$declare("export.api.volumeReports",Vue.resource("/api/v1/volumes{/id}/reports")),biigle.$component("export.mixins.reportForm",{mixins:[biigle.$require("core.mixins.loader")],data:{variants:{Annotations:["Basic","Extended","Area","Full","Csv"],ImageLabels:["Basic","Csv"]},allowedOptions:{},selectedType:"Annotations",selectedVariant:"Basic",success:!1,errors:{},options:{export_area:!1,newest_label:!1,separate_label_trees:!1}},computed:{availableReportTypes:function(){var e={};return biigle.$require("export.reportTypes").forEach(function(t){e[t.name]=t.id}),e},selectedReportTypeId:function(){return this.availableReportTypes[this.selectedType+"\\"+this.selectedVariant]},availableVariants:function(){return this.variants[this.selectedType]},selectedOptions:function(){var e={};return this.allowedOptions[this.selectedType].forEach(function(t){e[t]=this.options[t]},this),e.type_id=this.selectedReportTypeId,e}},methods:{request:function(e,t){this.loading||(this.success=!1,this.startLoading(),t.save({id:e},this.selectedOptions).then(this.submitted,this.handleError).finally(this.finishLoading))},submitted:function(){this.success=!0,this.errors={}},handleError:function(e){422===e.status?this.errors=e.data:biigle.$require("messages.store").handleErrorResponse(e)},selectType:function(e){this.selectedType=e,-1===this.availableVariants.indexOf(this.selectedVariant)&&(this.selectedVariant=this.availableVariants[0])},wantsType:function(e){return this.selectedType===e},hasError:function(e){return this.errors.hasOwnProperty(e)},getError:function(e){return this.errors[e]?this.errors[e].join(" "):""},wantsCombination:function(e,t){return this.selectedType===e&&this.selectedVariant===t}}});