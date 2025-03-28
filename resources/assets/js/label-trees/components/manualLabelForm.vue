<script>
import LabelFormComponent from '../mixins/labelFormComponent.vue';

/**
 * A component for a form to manually create a new label for a label tree
 *
 * @type {Object}
 */
export default {
    template: '#manual-label-form-template',
    emits: ['submit'],
    extends: LabelFormComponent,
    methods: {
        submit() {
            let label = {
                name: this.selectedName,
                color: this.selectedColor,
            };

            if (this.parent) {
                label.parent_id = this.parent.id;
            }

            this.$emit('submit', label);
        },
    },
};
</script>
