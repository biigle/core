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
        @if(config('labelbot.show_button'))
            <div class="well well-sm">
                <p>
                    <button
                        type="button"
                        class="btn btn-default btn-block"
                        :disabled="labelbotIsDisabled"
                        :title="labelbotToggleTitle"
                        :class="{'btn-info active': labelbotIsActive}"
                        v-on:click="toggleLabelBot"
                        >
                        LabelBOT<sup :class="{'text-muted': !labelbotIsActive}">beta</sup>
                        </button>
                </p>
                <p>
                    LabelBOT chooses the label of new annotations based on similar annotations from the label trees below.<a href="{{route('manual-tutorials', ['labelbot', 'labelbot'])}}" class="btn btn-default btn-xs" title="Learn more about LabelBOT" target="_blank"><i class="fa fa-info-circle"></i></a>
                </p>
            </div>
        @endif
        <div class="labels-tab__trees">
            <label-trees ref="labelTrees" :trees="labelTrees" :show-favourites="true" :focus-input="focusInputFindlabel" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
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
