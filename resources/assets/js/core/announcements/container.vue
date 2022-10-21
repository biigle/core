<script>
import Popover from 'uiv/dist/Popover';

export default {
    components: {
        popover: Popover,
    },
    data() {
        return {
            expand: false,
            id: null,
        };
    },
    methods: {
        handleHide() {
            this.expand = false;
            window.localStorage.setItem('seen-announcement', this.id);
        },
    },
    mounted() {
        this.id = this.$el.attributes['announcement-id'].value;
        let seenId = window.localStorage.getItem('seen-announcement');
        this.expand = this.id !== seenId;
    },
};
</script>
