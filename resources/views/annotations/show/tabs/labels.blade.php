<sidebar-tab name="labels" icon="tags" title="Label trees">
    <labels-tab v-on:select="handleSelectedLabel" v-on:open="openSidebarLabels" v-cloak></labels-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="labels-tab-template">
    <div class="labels-tab">
        <div class="labels-tab__trees">
            <label-trees :trees="labelTrees" :show-favourites="true" :focus-input="focusInputFindlabel" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
        </div>
        <div class="labels-tab__plugins">
            @mixin('annotationsLabelsTab')
        </div>
    </div>
</script>
@endpush
