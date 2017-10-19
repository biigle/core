<sidebar-tab name="image" icon="picture" title="Toggle the image information tab">
    <image-info-tab :image-id="imageId" :selected-label="selectedLabel" v-cloak inline-template>
        <div class="image-info-tab">
            <div v-if="!loading">
                <div class="image-info-tab__labels">
                    <div v-if="canAttachSelectedLabel" class="image-label" v-on:click="attachSelectedLabel" :title="proposedLabelTitle">
                        <i class="fa fa-plus"></i> <span class="image-label__color" :style="proposedLabelStyle"></span> <span v-text="selectedLabel.name"></span>
                    </div>
                    <image-label-list :image-labels="currentLabels" :user-id="userId" :is-admin="isAdmin" v-on:deleted="handleDeletedLabel"></image-label-list>
                </div>
                <div v-if="hasExif" class="image-info-tab__exif">
                    <ul class="list-unstyled">
                        <li v-for="(value, key) in currentExif">
                            <strong v-text="key"></strong>: <span v-text="value"></span>
                        </li>
                    </ul>
                </div>
            </div>
            <div v-else>
                <loader :active="true"></loader>
            </div>
        </div>
    </image-info-tab>
</sidebar-tab>
