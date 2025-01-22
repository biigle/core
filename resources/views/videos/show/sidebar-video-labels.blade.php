<sidebar-tab class="sidebar__tab--nopad" name="video-labels" icon="film" title="Video labels">
    <video-labels-tab :file-id="videoId" :selected-label="selectedLabel" type="video" v-cloak inline-template>
        <div class="file-label-tab">
            <span class="file-label__buttons">
                <loader v-if="loading || saving" :active="true"></loader>
                @can('add-annotation', $video)
                    <button v-else class="btn btn-default btn-xs" :disabled="!canAttachSelectedLabel || null" :title="proposedLabelTitle" v-on:click="attachSelectedLabel"><i class="fa fa-plus"></i></button>
                @endcan
            </span>
            <h4>Video Labels</h4>
            <file-label-list :file-labels="currentLabels" :user-id="userId" :is-admin="isAdmin" :type="type" v-on:deleted="handleDeletedLabel"></file-label-list>
        </div>
    </video-labels-tab>
</sidebar-tab>
