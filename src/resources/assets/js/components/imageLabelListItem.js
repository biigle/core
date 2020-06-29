import ImageLabelsApi from '../api/imageLabels';
import {handleErrorResponse} from '../import';

/**
 * One item in the imageLabelList component.
 *
 * @type {Object}
 */
export default {
    template: `<li class="image-label" :class="classObject">
        <span class="image-label__color" :style="colorStyle"></span>
        <span v-text="label.name" :title="title"></span>
        <button v-if="!deleting && deletable" class="close image-label__delete" :title="deleteTitle" @click.stop="deleteThis"><span aria-hidden="true">&times;</span></button>
    </li>`,
    props: {
        item: {
            type: Object,
            required: true,
        },
        deletable: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            deleting: false,
        };
    },
    computed: {
        label() {
            return this.item.label;
        },
        colorStyle() {
            return {
                'background-color': '#' + this.label.color
            };
        },
        deleteTitle() {
            return 'Detach label ' + this.label.name;
        },
        title() {
            return `Attached by ${this.item.user.firstname} ${this.item.user.lastname}`;
        },
        classObject() {
            return {
                'image-label--deleting': this.deleting,
            };
        },
    },
    methods: {
        deleteThis() {
            if (this.deleting) return;

            this.deleting = true;
            ImageLabelsApi.delete({id: this.item.id})
                .then(this.deleted, handleErrorResponse)
                .finally(() => this.deleting = false);
        },
        deleted() {
            this.$emit('deleted', this.item);
        },
    }
};
