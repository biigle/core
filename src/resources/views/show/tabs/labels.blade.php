<sidebar-tab name="labels" icon="tags" title="Toggle the label list">
    <labels-tab v-on:select="handleSelectedLabel" v-cloak inline-template>
        <div class="labels-tab">
            <div class="labels-tab__trees">
                <label-trees :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
            </div>
            {{--
            TODO: Put biigle-largo mixin here
            <div class="labels-tab__examples" v-if="selectedLabel">
                <div class="alert alert-info">No example annotations available</div>
            </div>
            --}}
        </div>
    </labels-tab>
</sidebar-tab>
