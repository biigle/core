<script>
import {Loader} from '../import';
import {ImageLabelList} from '../import';
import {ImageLabelsApi} from '../import';
import {handleErrorResponse} from '../import';

/**
 * The image information tab of the annotation tool
 *
 * @type {Object}
 */
export default {
    mixins: [Loader],
    components: {
        imageLabelList: ImageLabelList,
    },
    props: {
        imageId: {
            required: true,
            type: Number,
        },
        selectedLabel: {
            type: Object,
            default: null,
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

                return true;
            }

            return false;
        },
        proposedLabelTitle() {
            if (!this.hasSelectedLabel) {
                return 'Please select a label first.';
            } else if (!this.canAttachSelectedLabel) {
                return 'The selected label is already attached.';
            }

            return `Attach '${this.selectedLabel.name}' as new image label`;
        },
    },
    methods: {
        startSaving() {
            this.saving = true;
        },
        finishSaving() {
            this.saving = false;
        },
        showImageLabels(id) {
            if (!this.cache.hasOwnProperty(id)) {
                this.startLoading();
                this.currentLabels = [];
                this.cache[id] = ImageLabelsApi.query({image_id: id});
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
            let labels = this.currentLabels;

            ImageLabelsApi.save({image_id: this.imageId}, {label_id: this.selectedLabel.id})
                .then(function (response) {
                    labels.push(response.data);
                }, handleErrorResponse)
                .finally(this.finishSaving);
        },
    },
    watch: {
        imageId(id) {
            if (this.open) {
                this.showImageLabels(id);
            }
        },
        open(open) {
            if (open) {
                this.showImageLabels(this.imageId);
            }
        },
    },
    created() {
        this.userId = biigle.$require('annotations.userId');
        this.isAdmin = biigle.$require('annotations.isAdmin');
        this.$parent.$watch('open', (open) => this.open = open);
    },
};
</script>
