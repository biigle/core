<script>
import Events from '@/core/events.js';

/**
 * The panel for editing the members of a project
 */
export default {
    methods: {
        updateCount(count) {
            this.$el.textContent = count;
        },
    },
    created() {
        Events.on('project.label-trees.count', this.updateCount);
    },
};
</script>
