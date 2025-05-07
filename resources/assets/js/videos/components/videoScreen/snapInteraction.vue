<script>
import snapInteraction from '@/annotations/ol/snapInteraction.js';

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
