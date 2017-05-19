<sidebar-tab name="labels" icon="tags" title="Toggle the label list">
    <labels-tab v-on:select="handleSelectedLabel" v-cloak inline-template>
        <div class="labels-tab">
            <div class="labels-tab__trees">
                <label-trees :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
            </div>
            <div class="labels-tab__plugins">
                @foreach ($modules->getMixins('annotationsLabelsTab') as $module => $nestedMixins)
                    @include($module.'::annotationsLabelsTab', ['mixins' => $nestedMixins])
                @endforeach
            </div>
        </div>
    </labels-tab>
</sidebar-tab>
