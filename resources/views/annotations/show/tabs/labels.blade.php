<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab
        :label-trees="labelTrees"
        :project-ids="projectIds"
        :labelbot-state="labelbotState"
        :show-example-annotations="showExampleAnnotations"
        :volume-id="volumeId"
        :guidelines="annotationGuidelines"
        :must-use-guideline="mustUseAnnotationGuideline"
        :guideline="annotationGuideline"
        v-on:select="handleSelectedLabel"
        v-on:select-guideline="handleSelectedAnnotationGuideline"
        v-on:open="openSidebarLabels"
        v-on:update-labelbot-state="updateLabelbotState"
        v-cloak
        ></labels-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="labels-tab-template">
    <div class="labels-tab">
        @include('partials.labelbot-button')
        <annotation-guideline-selector
            :model-value="guideline"
            :guidelines="guidelines"
            :must-use-guideline="mustUseGuideline"
            :volume-id="volumeId"
            v-on:update:model-value="handleSelectedGuideline"
            ></annotation-guideline-selector>
        <div class="labels-tab__trees">
            <label-trees
                ref="labelTrees"
                :trees="labelTrees"
                :sorting-project-ids="projectIds"
                :labels-in-guideline="labelsInGuideline"
                :show-favourites="true"
                :focus-input="focusInputFindlabel"
                v-on:select="handleSelectedLabel"
                v-on:deselect="handleDeselectedLabel"
                v-on:clear="handleDeselectedLabel"
            ></label-trees>
        </div>
        <div class="labels-tab__plugins">
            <example-annotations
                v-if="showExampleAnnotations"
                :volume-id="{!! $volume->id !!}"
                :label="selectedLabel"
                empty-src="{{ asset(config('thumbnails.empty_url')) }}"
                url-template="{{Storage::disk(config('largo.patch_storage_disk'))->url(':prefix/:id.'.config('largo.patch_format'))}}"
                ></example-annotations>

            @mixin('annotationsLabelsTab')
        </div>
    </div>
</script>
@endpush
