<script>
import FileLabelList from '@/volumes/components/fileLabelList.vue';
import ImageLabelsApi from '@/volumes/api/imageLabels.js';
import Keyboard from '@/core/keyboard.js';
import Loader from '@/core/mixins/loader.vue';
import VideoLabelsApi from '@/volumes/api/videoLabels.js';
import {handleErrorResponse} from '@/core/messages/store.vue';

export default {
    mixins: [Loader],
    components: {
        fileLabelList: FileLabelList,
    },
    props: {
        fileId: {
            required: true,
            type: Number,
        },
        selectedLabel: {
            type: Object,
            default: null,
        },
        type: {
            type: String,
            default: 'image',
        },
    },
    data() {
        return {
            cache: {},
            open: false,
            currentLabels: [],
            saving: false,
            userId: null,
            isAdmin: false,
        };
    },
    computed: {
        hasLabels() {
            return this.currentLabels.length > 0;
        },
        hasSelectedLabel() {
            return this.selectedLabel !== null;
        },
        canAttachSelectedLabel() {
            if (this.hasSelectedLabel) {
                for (let i = this.currentLabels.length - 1; i >= 0; i--) {
                    if (this.currentLabels[i].label.id === this.selectedLabel.id) {
                        return false;
                    }
                }

                return !this.saving;
            }

            return false;
        },
        proposedLabelTitle() {
            if (!this.hasSelectedLabel) {
                return 'Please select a label first.';
            } else if (!this.canAttachSelectedLabel) {
                return 'The selected label is already attached.';
            }

            return `Attach '${this.selectedLabel.name}' as new ${this.type} label`;
        },
    },
    methods: {
        startSaving() {
            this.saving = true;
        },
        finishSaving() {
            this.saving = false;
        },
        showFileLabels(id) {
            if (!this.cache.hasOwnProperty(id)) {
                this.startLoading();
                this.currentLabels = [];
                if (this.type === 'image') {
                    this.cache[id] = ImageLabelsApi.query({image_id: id});
                } else {
                    this.cache[id] = VideoLabelsApi.query({video_id: id});
                }
                this.cache[id].finally(this.finishLoading);
            }

            this.cache[id].then(this.updateCurrentLabels, handleErrorResponse);
        },
        updateCurrentLabels(response) {
            this.currentLabels = response.body;
        },
        handleDeletedLabel(label) {
            for (let i = this.currentLabels.length - 1; i >= 0; i--) {
                if (this.currentLabels[i].id === label.id) {
                    this.currentLabels.splice(i, 1);
                    break;
                }
            }
        },
        attachSelectedLabel() {
            this.startSaving();
            let promise;
            if (this.type === 'image') {
                promise = ImageLabelsApi
                    .save(
                        {image_id: this.fileId},
                        {label_id: this.selectedLabel.id}
                    );
            } else {
                promise = VideoLabelsApi
                    .save(
                        {video_id: this.fileId},
                        {label_id: this.selectedLabel.id}
                    );
            }

            promise.then((r) => this.currentLabels.push(r.data), handleErrorResponse)
                .finally(this.finishSaving);
        },
        attachSelectedLabelIfPossible() {
            if (this.canAttachSelectedLabel) {
                this.attachSelectedLabel();

                // Stop the keyboard event handler in this case.
                return false;
            }
        },
    },
    watch: {
        fileId(id) {
            if (this.open) {
                this.showFileLabels(id);
            }
        },
        open(open) {
            if (open) {
                this.showFileLabels(this.fileId);
                Keyboard.on('Enter', this.attachSelectedLabelIfPossible);
            } else {
                Keyboard.off('Enter', this.attachSelectedLabelIfPossible);
            }
        },
    },
    created() {
        this.$parent.$watch('open', (open) => this.open = open);

    },
};
</script>
