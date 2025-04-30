<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab v-on:select="handleSelectedLabel" v-on:open="openSidebarLabels" v-cloak></labels-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="labels-tab-template">
    <div class="labels-tab">
        <div class="labels-tab__trees">
            <label-trees :trees="labelTrees" :show-favourites="true" :focus-input="focusInputFindlabel" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
        </div>
        <div class="labels-tab__plugins">
            <component
                :is="plugins.exampleAnnotations"
                :volume-id="{!! $volume->id !!}"
                :label="selectedLabel"
                empty-src="{{ asset(config('thumbnails.empty_url')) }}"
                url-template="{{Storage::disk(config('largo.patch_storage_disk'))->url(':prefix/:id.'.config('largo.patch_format'))}}"
                ></component>

            @mixin('annotationsLabelsTab')
        </div>
    </div>
</script>
@endpush
