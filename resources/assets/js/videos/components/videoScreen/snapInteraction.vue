<script>
import snapInteraction from '../../../annotations/snapInteraction.vue';

export default {
    mixins: [snapInteraction],
    computed: {
        width() {
            return this.video.videoWidth;
        },
        height() {
            return this.video.videoHeight;
        }
    }
}

</script>