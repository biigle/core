<script>
import Events from '@/core/events.js';

export default {
    methods: {
        updateCount(count) {
            this.$el.textContent = count;
        },
    },
    created() {
        Events.on('label-trees.labels.count', this.updateCount);
    },
};
</script>
