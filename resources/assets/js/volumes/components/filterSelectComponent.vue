<template>
    <div class="filter-select">
        <typeahead :items="items" :value="value" :placeholder="placeholder" @select="select" :template="typeaheadTemplate"></typeahead>
        <button type="submit" class="btn btn-default" @click="submit" :disabled="!selectedItem">Add rule</button>
    </div>
</template>

<script>
import Typeahead from '../../core/components/typeahead';

/**
 * Base component for a filter select element
 *
 * @type {Object}
 */
export default {
    components: {
        typeahead: Typeahead,
    },
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            items: [],
            placeholder: '',
            selectedItem: null,
            typeaheadTemplate: undefined,
        };
    },
    computed: {
        value() {
            return this.selectedItem ? this.selectedItem.name : '';
        },
    },
    methods: {
        select(item) {
            this.selectedItem = item;
        },
        gotItems(response) {
            this.items = response.data;
        },
        parseUsernames(response) {
            response.data = response.data.map(function (user) {
                user.name = user.firstname + ' ' + user.lastname;

                return user;
            });

            return response;
        },
        submit() {
            this.$emit('select', this.selectedItem);
        },
    },
};
</script>
