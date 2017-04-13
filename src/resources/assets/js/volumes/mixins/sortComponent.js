/**
 * A component of the sorting tab.
 *
 * @type {Object}
 */
biigle.$component('volumes.mixins.sortComponent', {
    template: '<button class="list-group-item" :title="title" @click="handleClick" :class="classObject" v-text="text"></button>',
    props: {
        activeSorter: {
            type: String,
            default: '',
        },
    },
    computed: {
        active: function () {
            return this.activeSorter === this.id;
        },
        classObject: function () {
            return {
                active: this.active,
            };
        },
    },
    methods: {
        getSequence: function () {
            return new Vue.Promise(function (resolve) {
                resolve([]);
            });
        },
        handleClick: function () {
            if (!this.active) {
                this.$emit('select', this);
            }
        },
    },
});
