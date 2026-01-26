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
        @include('partials.labelbot-button')

        <div class="labels-tab__trees">
            <label-trees
                ref="labelTrees"
                :trees="labelTrees"
                :show-favourites="true"
                :focus-input="focusInputFindlabel"
                v-on:select="handleSelectedLabel"
                v-on:deselect="handleDeselectedLabel"
                v-on:clear="handleDeselectedLabel"
            ></label-trees>
        </div>
    </div>
</script>
@endpush
