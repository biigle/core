<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab v-on:select="handleSelectedLabel" :focus-input="focusInputFindlabel" v-cloak inline-template>
        <div class="labels-tab">
            <div class="labels-tab__trees">
                <label-trees :trees="labelTrees" :show-favourites="true" :focus-input="focusInput" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
            </div>
            <div class="labels-tab__plugins">
                @mixin('annotationsLabelsTab')
            </div>
        </div>
    </labels-tab>
</sidebar-tab>
