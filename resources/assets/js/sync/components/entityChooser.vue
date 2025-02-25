<template>
    <div class="entity-chooser">
        <entity-chooser-list
            class="entity-chooser-list--left"
            :entities="unchosenFilteredEntities"
            :filtering="true"
            :disabled="disabled || null"
            @select="handleSelect"
            @filter="handleFiltering"
        ></entity-chooser-list>
        <div class="entity-chooser-buttons">
            <button
                class="btn btn-default btn-block"
                @click="chooseAll"
                :disabled="(disabled || hasNoUnchosenEntities) || null"
                title="Select all"
                >all</button>
            <button
                class="btn btn-default btn-block"
                @click="chooseNone"
                :disabled="(disabled || hasNoChosenEntities) || null"
                title="Select none"
                >none</button>
        </div>
        <entity-chooser-list
            class="entity-chooser-list--right"
            :entities="chosenEntities"
            :disabled="disabled || null"
            @select="handleDeselect"
        ></entity-chooser-list>
    </div>
</template>

<script>
import List from './entityChooserList.vue';

/**
 * A component to choose entities like volumes or users for a list
 *
 * @type {Object}
 */
export default {
    emits: ['select'],
    components: {
        entityChooserList: List,
    },
    props: {
        entities: {
            type: Array,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            chosenIds: {},
            filterQuery: '',
        };
    },
    computed: {
        unchosenEntities() {
            return this.entities.filter((entity) => !this.chosenIds[entity.id]);
        },
        unchosenFilteredEntities() {
            // This is a very simple fuzzy matching. It splits the query string at the
            // spaces into "parts" and returns any entity whose name or description
            // contains all parts.
            // Example: "iv hau" matches the entity "Hausgarten IV PS62/161-3"
            let query = this.filterQuery.trim();
            if (query) {
                let queryParts = query.toLowerCase().split(' ');
                return this.unchosenEntities.filter(function (entity) {
                    let name = entity.name.toLowerCase();
                    if (entity.description) {
                        name += ' ' + entity.description.toLowerCase();
                    }
                    return queryParts.reduce(function (match, part) {
                        return match && name.indexOf(part) !== -1;
                    }, true);
                });
            }

            return this.unchosenEntities;
        },
        chosenEntities() {
            return this.entities.filter((entity) => this.chosenIds[entity.id]);
        },
        hasNoUnchosenEntities() {
            return this.unchosenEntities.length === 0;
        },
        hasNoChosenEntities() {
            return this.chosenEntities.length === 0;
        },
    },
    methods: {
        handleSelect(entity) {
            this.chosenIds[entity.id] = true;
            this.$emit('select', this.chosenEntities);
        },
        handleDeselect(entity) {
            this.chosenIds[entity.id] = false;
            this.$emit('select', this.chosenEntities);
        },
        chooseAll() {
            this.unchosenFilteredEntities.forEach(
                entity => this.chosenIds[entity.id] = true
            );
            this.$emit('select', this.chosenEntities);
        },
        chooseNone() {
            this.chosenEntities.forEach(
                entity => this.chosenIds[entity.id] = false
            );
            this.$emit('select', []);
        },
        handleFiltering(query) {
            this.filterQuery = query;
        },
    },
};
</script>
