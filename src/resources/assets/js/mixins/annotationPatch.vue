<script>
import {VIDEO_ANNOTATION} from '../constants';

export default {
    computed: {
        patchPrefix() {
            return this.uuid[0] + this.uuid[1] + '/' + this.uuid[2] + this.uuid[3] + '/' + this.uuid;
        },
    },
    methods: {
        getThumbnailUrl() {
            if (this.type === VIDEO_ANNOTATION) {
                return this.urlTemplate
                    .replace(':prefix', this.patchPrefix)
                    .replace(':id', `v-${this.id}`);
            }

            return this.urlTemplate
                .replace(':prefix', this.patchPrefix)
                .replace(':id', this.id);
        },
    },
};
</script>
