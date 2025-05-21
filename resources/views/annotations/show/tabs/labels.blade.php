<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab
        :show-example-annotations="showExampleAnnotations"
        v-on:select="handleSelectedLabel"
        v-on:open="openSidebarLabels"
        v-on:change-labelbot-toggle="changeLabelbotToggle" 
        :labelbot-is-on="labelbotIsOn" 
        v-cloak
        ></labels-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="labels-tab-template">
    <div class="labels-tab">
            <div class="labelBOT-button">
                <power-toggle :disabled="labelbotIsDisabled" title-disabled="There must be at least one label in one of the label trees" :active="labelbotIsOn" title-off="Activate LabelBOT" title-on="Deactivate LabelBOT" v-on:on="handleLabelbotOn" v-on:off="handleLabelbotOff">LabelBOT</power-toggle>
            </div>
        <div class="labels-tab__trees">
            <label-trees :trees="labelTrees" :show-favourites="true" :focus-input="focusInputFindlabel" :labelbot-is-on="labelbotIsOn" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
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
