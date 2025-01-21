<sidebar-tab class="sidebar__tab--nopad" name="image-labels" icon="image" title="Image labels">
    <image-label-tab :file-id="imageId" :selected-label="selectedLabel" type="image" v-cloak></image-label-tab>
</sidebar-tab>


@push('scripts')
<script type="text/html" id="image-labels-tab-template">
    <div class="file-label-tab">
        <span class="file-label__buttons">
            <loader v-if="loading || saving" :active="true"></loader>
            @can('add-annotation', $image)
                <button v-else class="btn btn-default btn-xs" :disabled="!canAttachSelectedLabel || null" :title="proposedLabelTitle" v-on:click="attachSelectedLabel"><i class="fa fa-plus"></i></button>
            @endcan
        </span>
        <h4>Image Labels</h4>
        <file-label-list :file-labels="currentLabels" :user-id="userId" :is-admin="isAdmin" :type="type" v-on:deleted="handleDeletedLabel"></file-label-list>
    </div>
</script>
@endpush
