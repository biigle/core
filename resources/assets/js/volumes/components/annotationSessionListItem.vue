<template>
<li class="list-group-item session" :title="title" :class="classObject" @click="edit">
    <div>
        <span class="session__dates"><span :title="session.starts_at_iso8601" v-text="session.starts_at"></span> - <span :title="session.ends_at_iso8601" v-text="session.ends_at"></span></span> <strong v-text="session.name"></strong>
    </div>
    <div v-text="session.description"></div>
    <div>
        <span class="label label-default"><span v-text="session.users.length"></span> user(s)</span>
        <span class="label label-default" v-if="session.hide_other_users_annotations" title="Hide annotations of other users while this annotation session is active">hide&nbsp;other</span>
        <span class="label label-default" v-if="session.hide_own_annotations" title="Hide own annotations that were created before this annotation session started while it is active">hide&nbsp;own</span>
    </div>
</li>
</template>
<script>
export default {
    emits: ['edit'],
    props: ['session', 'editing', 'editId'],
    computed: {
        title() {
            return this.editing ? 'Edit this annotation session' : this.session.name;
        },
        active() {
            let now = new Date();

            return this.session.starts_at_iso8601 < now && this.session.ends_at_iso8601 >= now;
        },
        currentlyEdited() {
            return this.session.id === this.editId;
        },
        classObject() {
            return {
                'session--active': this.active,
                'list-group-item-info': this.currentlyEdited,
            };
        },
    },
    methods: {
        edit() {
            if (!this.editing || this.currentlyEdited) return;
            this.$emit('edit', this.session);
        },
    },
};
</script>
