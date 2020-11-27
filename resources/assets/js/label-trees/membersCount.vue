<script>
import Events from '../core/events';

export default {
    methods: {
        updateCount(count) {
            this.$el.textContent = count;
        },
    },
    created() {
        Events.$on('label-trees.members.count', this.updateCount);
    },
};
</script>
