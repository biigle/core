<template>
<div class="user-mapping-item">
    <div class="user-mapping-item-column">
        {{user.name}}
    </div>
    <div class="user-mapping-item-chevron" :class="chevronClass">
        <i class="fas fa-chevron-right"></i>
    </div>
    <div class="user-mapping-item-column">
        <div v-if="mappedUser" class="clearfix">
            <button
                class="btn btn-default pull-right"
                title="Change mapped user"
                type="button"
                :disabled="loading"
                @click="handleChange"
                ><i class="fa fa-pen fa-fw"></i></button>

            {{mappedUser.name}}<br>
            <span class="text-muted">{{mappedUser.affiliation}}</span>
        </div>
        <div v-else class="clearfix">
            <button
                class="btn btn-default pull-right"
                title="Select yourself"
                type="button"
                :disabled="loading"
                @click="handleSelectSelf"
                ><i class="fa fa-user fa-fw"></i></button>

            <typeahead
                :items="users"
                :clear-on-select="true"
                more-info="affiliation"
                placeholder="User name"
                @select="handleSelect"
                ></typeahead>
        </div>
    </div>
</div>
</template>

<script>
import Typeahead from '../../core/components/typeahead';

export default {
    components: {
        Typeahead,
    },
    data() {
        return {
            //
        };
    },
    props: {
        user: {
            required: true,
            type: Object,
        },
        users: {
            default: () => [],
            type: Array,
        },
        loading: {
            default: false,
            type: Boolean,
        },
    },
    computed: {
        mappedUser() {
            return this.users.find(u => u.id === this.user.mappedUser) || null;
        },
        chevronClass() {
            return this.user.mappedUser ? 'text-muted' : 'text-info';
        },
    },
    methods: {
        handleSelect(user) {
            this.$emit('select', this.user, user.id);
        },
        handleSelectSelf() {
            this.$emit('select-self', this.user);
        },
        handleChange() {
            this.$emit('select', this.user, null);
        },
    },
};
</script>
