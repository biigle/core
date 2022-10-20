<script>
import Popover from 'uiv/dist/Popover';

export default {
    components: {
        popover: Popover,
    },
    data() {
        return {
            expandAnnouncement: true,
        };
    },
    methods: {
        handleHide() {
            this.expandAnnouncement = false;
            // Store ID in local storage to keep collapsed.
        },
    },
    created() {
        // Collapse announcement if the ID matches local storage.
        // Delete local storage if the ID is not the one of the current announcement.
    },
};
</script>
