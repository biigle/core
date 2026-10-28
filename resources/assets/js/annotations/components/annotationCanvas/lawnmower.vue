<script>
export const LawnmowerSaveState = Object.freeze({
    SAVE: 'save',
    LOAD: 'load',
    DISCARD: 'discard'
});

export default {
    emits: [
        'lawnmower-pre-viewport-change',
        'lawnmower-post-viewport-change',
    ],
    props: {
        lawnmowerSaveState: {
            type: String,
            required: true
        }
    },
    computed: {
    },
    methods: {

    },
    watch: {
        image() {

        },
        lawnmowerSaveState(newState) {
            switch(newState) {
                case LawnmowerSaveState.SAVE:
                    this.saveCurrentLawnmowerState();
                    break;
                case LawnmowerSaveState.LOAD:
                    this.loadSavedLawnmowerState();
                    break;
                case LawnmowerSaveState.DISCARD:
                    this.discardSavedLawnmowerState();
                    break;
            }
        },
    },
};
</script>
