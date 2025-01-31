<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab v-on:select="handleSelectedLabel" v-on:labelbot="handleLabelBOT" v-cloak inline-template>
        <div class="labels-tab">
            <div class="labelBOT-button">
                <power-toggle :active="labelBOTIsOn" title-off="Activate LabelBOT" title-on="Deactivate LabelBOT" v-on:on="handleLabelBOT" v-on:off="handleLabelBOT">LabelBOT</power-toggle>
            </div>
            <div class="labels-tab__trees">
                <label-trees :trees="labelTrees" :show-favourites="true" :label-b-o-t-is-on="labelBOTIsOn" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
            </div>
            <div class="labels-tab__plugins">
                @mixin('annotationsLabelsTab')
            </div>
        </div>
    </labels-tab>
</sidebar-tab>
