<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab
        :label-trees="labelTrees"
        :project-ids="projectIds"
        :labelbot-state="labelbotState"
        :has-pending-annotation="!!pendingAnnotation"
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
                :sorting-project-ids="projectIds"
                :focus-input="focusInputFindlabel"
                :show-favourites="true"
                :has-pending-annotation="hasPendingAnnotation"
                v-on:select="handleSelectedLabel"
                v-on:deselect="handleDeselectedLabel"
                v-on:clear="handleDeselectedLabel"
            ></label-trees>
        </div>
    </div>
</script>
@endpush
