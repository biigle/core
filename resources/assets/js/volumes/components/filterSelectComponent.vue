<template>
    <div class="filter-select">
        <typeahead :items="items" :value="value" :placeholder="placeholder" @select="select" :more-info="typeaheadMoreInfo"></typeahead>
        <button type="submit" class="btn btn-default" @click="submit" :disabled="!selectedItem || null">Add rule</button>
    </div>
</template>

<script>
import Typeahead from '@/core/components/typeahead.vue';

/**
 * Base component for a filter select element
 *
 * @type {Object}
 */
export default {
    emits: ['select'],
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
            typeaheadMoreInfo: '',
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
