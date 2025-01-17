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
