<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab v-on:select="handleSelectedLabel" v-on:open="openSidebarLabels" v-on:change="handleSettingsChange" :labelbot-is-on="labelbotIsOn" v-cloak inline-template>
        <div class="labels-tab">
            <div class="labelBOT-button">
                <power-toggle :active="labelbotIsOn" title-off="Activate LabelBOT" title-on="Deactivate LabelBOT" v-on:on="handleLabelbotOn" v-on:off="handleLabelbotOff">LabelBOT</power-toggle>
            </div>
            <div class="labels-tab__trees">
                <label-trees :trees="labelTrees" :show-favourites="true" :focus-input="focusInputFindlabel" :labelbot-is-on="labelbotIsOn" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
            </div>
            <div class="labels-tab__plugins">
                @mixin('annotationsLabelsTab')
            </div>
        </div>
    </labels-tab>
</sidebar-tab>
