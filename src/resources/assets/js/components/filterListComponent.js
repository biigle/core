/**
 * Base component for a filter list item
 *
 * @type {Object}
 */
biigle.$component('volumes.components.filterListComponent', {
    template: '<span><strong>with<span v-if="rule.negate">out</span></strong> <span v-text="name"></span> <strong v-if="dataName" v-text="dataName"></strong></span>',
    props: {
        rule: {
            type: Object,
            required: true,
        }
    },
    data: function () {
        return {name: this.rule.id};
    },
    computed: {
        dataName: function () {
            if (this.rule.data) {
                return this.rule.data.name;
            }
        },
    },
});
