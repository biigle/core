<sidebar-tab class="sidebar__tab--nopad" name="image" icon="picture" title="Toggle the image label list">
    <image-label-tab :image-id="imageId" :selected-label="selectedLabel" v-cloak inline-template>
        <div class="image-label-tab">
            <span class="image-label__buttons">
                <loader v-if="loading || saving" :active="true"></loader>
                @can('add-annotation', $image)
                    <button v-else class="btn btn-default btn-xs" v-if="canAttachSelectedLabel" :title="proposedLabelTitle" v-on:click="attachSelectedLabel"><i class="fa fa-plus"></i></button>
                @endcan
            </span>
            <h4>Image Labels</h4>
            <image-label-list :image-labels="currentLabels" :user-id="userId" :is-admin="isAdmin" v-on:deleted="handleDeletedLabel"></image-label-list>
        </div>
    </image-label-tab>
</sidebar-tab>
