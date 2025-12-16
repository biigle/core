<script>
import {Popover} from 'uiv';

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
        handleShow() {
            window.localStorage.setItem('seen-announcement', this.id);
        },
        handleHide() {
            this.expand = false;
        },
    },
    mounted() {
        this.id = this.$el.attributes['announcement-id'].value;
        let seenId = window.localStorage.getItem('seen-announcement');
        this.expand = this.id !== seenId;
    },
};
</script>
