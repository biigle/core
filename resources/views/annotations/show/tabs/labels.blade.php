<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab v-on:select="handleSelectedLabel" v-cloak inline-template>
        <div class="labels-tab">
            <div class="labels-tab__labelBOT">
                <power-toggle :active="labelBOTIsOn" title-off="Activate LabelBOT" title-on="Deactivate LabelBOT" v-on:on="activateLabelBOT" v-on:off="deactivateLabelBOT">LabelBOT</power-toggle>
            </div>
            <div class="labels-tab__trees">
                <label-trees :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
            </div>
            <div class="labels-tab__plugins">
                @mixin('annotationsLabelsTab')
            </div>
        </div>
    </labels-tab>
</sidebar-tab>