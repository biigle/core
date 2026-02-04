<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab
        :labelbot-state="labelbotState"
        :show-example-annotations="showExampleAnnotations"
        v-on:select="handleSelectedLabel"
        v-on:open="openSidebarLabels"
        v-on:update-labelbot-state="updateLabelbotState"
        v-cloak
        ></labels-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="labels-tab-template">
    <div class="labels-tab">
        @include('partials.labelbot-button')
        <div class="labels-tab__trees">
            <label-trees
                ref="labelTrees"
                :trees="labelTrees"
                :sorting-project-ids="projectIds"
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
        </div>
    </div>
</script>
@endpush
