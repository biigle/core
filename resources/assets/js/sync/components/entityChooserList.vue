<template>
    <div class="entity-chooser-list" :class="classObject">
        <input type="text" class="form-control entity-chooser-list-search" placeholder="Filter..." v-model="filterQuery" v-if="filtering" :disabled="disabled || null">
        <ul>
            <li v-for="e in entities" :key="e.id" @click="select(e)">
                <i v-if="e.icon" :class="`fa fa-${e.icon}`"></i>
                <span v-text="e.name" :title="e.name"></span>
                <span><br><span class="text-muted" v-text="e.description" :title="e.description"></span></span>
            </li>
        </ul>
    </div>
</template>

<script>
/**
 * A a list component of the entity chooser
 *
 * @type {Object}
 */
export default {
    emits: [
        'select',
        'filter',
    ],
    props: {
        entities: {
            type: Array,
            required: true,
        },
        filtering: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            filterQuery: '',
        };
    },
    computed: {
        classObject() {
            return {
                'entity-chooser-list--disabled': this.disabled,
            };
        },
    },
    methods: {
        select(entity) {
            if (!this.disabled) {
                this.$emit('select', entity);
            }
        },
    },
    watch: {
        filterQuery(query) {
            this.$emit('filter', query);
        },
    },
};
</script>
