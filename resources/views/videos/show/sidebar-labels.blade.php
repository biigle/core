<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab
        :labelbot-state="labelbotState"
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
                <div class="labelbot-buttons">
                    <button
                        type="button"
                        class="btn btn-default"
                        :disabled="labelbotIsDisabled"
                        :title="labelbotToggleTitle"
                        :class="{'btn-info active': labelbotIsActive}"
                        v-on:click="toggleLabelBot"
                        >
                        LabelBOT<sup :class="{'text-muted': !labelbotIsActive}">beta</sup>
                        </button>
                    <button class="btn btn-default" v-on:click="toggleLabelbotInfo" :class="{active: showLabelbotInfo}" title="Show LabelBOT info">
                        <i class="fa fa-info-circle"></i>
                    </button>
                </div>
                <div class="labelbot-info" v-show="showLabelbotInfo">
                    <p>
                        LabelBOT chooses the label of new annotations based on similar annotations from the label trees below. Usage:
                    </p>
                    <ol>
                        <li>
                            Enable LabelBOT, skip selecting a label and draw an annotation.
                        </li>
                        <li>
                            Check the suggested labels in the popup. The first was already selected for the annotation.
                        </li>
                        <li>
                            Confirm the selected label, choose a different label or let the popup automatically close.
                        </li>
                    </ol>
                    <p>
                        Learn more in <a href="{{route('manual-tutorials', ['labelbot', 'labelbot'])}}" class="" title="Learn more about LabelBOT" target="_blank">the manual</a>.
                    </p>
                </div>
            </div>
        @endif
        <div class="labels-tab__trees">
            <label-trees ref="labelTrees"
                :trees="labelTrees"
                :focus-input="focusInputFindlabel"
                :show-favourites="true"
                v-on:select="handleSelectedLabel"
                v-on:deselect="handleDeselectedLabel"
                v-on:clear="handleDeselectedLabel"
                ></label-trees>
        </div>
    </div>
</script>
@endpush
