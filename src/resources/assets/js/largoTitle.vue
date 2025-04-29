<script>
import {Events} from './import.js';

/**
 * The dynamic part of the Largo breadcrumbs in the navbar
 */
export default {
    data() {
        return {
            step: 0,
            count: 0,
            dismissedCount: 0,
        };
    },
    computed: {
        shownCount() {
            if (this.isInDismissStep) {
                return this.count;
            }

            return this.dismissedCount;
        },
        isInDismissStep() {
            return this.step === 0;
        },
        isInRelabelStep() {
            return this.step === 1;
        },
    },
    methods: {
        updateStep(step) {
            this.step = step;
        },
        updateCount(count) {
            this.count = count;
        },
        updateDismissedCount(count) {
            this.dismissedCount = count;
        },
    },
    created() {
        Events.on('annotations-count', this.updateCount);
        Events.on('dismissed-annotations-count', this.updateDismissedCount);
        Events.on('step', this.updateStep);
    },
};
</script>
