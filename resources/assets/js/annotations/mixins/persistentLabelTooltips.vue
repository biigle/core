<script>
import PersistentLabelTooltip from '../components/persistentLabelTooltip.vue';
import Styles from '../stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import {shouldShowPersistentLabelTooltips} from '../utils.js';
import {markRaw} from 'vue';

export default {
    components: {
        persistentLabelTooltip: PersistentLabelTooltip,
    },
    data() {
        return {
            persistentLabelTooltipFeatures: [],
        };
    },
    computed: {
        persistentLabelTooltipsEnabled() {
            return shouldShowPersistentLabelTooltips(this.showLabelTooltip);
        },
        showPersistentLabelTooltips() {
            return shouldShowPersistentLabelTooltips(this.showLabelTooltip);
        },
        visiblePersistentLabelTooltipFeatures() {
            if (!this.persistentLabelTooltipsEnabled) return [];

            return this.persistentLabelTooltipFeatures.filter(feature => {
                return feature.get('annotation')?.labels.length > 0;
            });
        },
    },
    methods: {
        attachPersistentLabelTooltipSource() {
            if (!this.annotationSource || this.persistentLabelTooltipSource === this.annotationSource) {
                return;
            }

            this.detachPersistentLabelTooltipSource();
            this.persistentLabelTooltipSource = this.annotationSource;
            this.persistentLabelTooltipSource.on('addfeature', this.schedulePersistentLabelTooltipSync);
            this.persistentLabelTooltipSource.on('removefeature', this.schedulePersistentLabelTooltipSync);
            this.persistentLabelTooltipSource.on('clear', this.schedulePersistentLabelTooltipSync);
            this.syncPersistentLabelTooltipFeatures();
        },
        detachPersistentLabelTooltipSource() {
            if (!this.persistentLabelTooltipSource) return;

            this.persistentLabelTooltipSource.un('addfeature', this.schedulePersistentLabelTooltipSync);
            this.persistentLabelTooltipSource.un('removefeature', this.schedulePersistentLabelTooltipSync);
            this.persistentLabelTooltipSource.un('clear', this.schedulePersistentLabelTooltipSync);
            this.persistentLabelTooltipSource = null;
            this.persistentLabelTooltipFeatures = [];
        },
        schedulePersistentLabelTooltipSync() {
            if (this.persistentLabelTooltipSyncPending) return;

            this.persistentLabelTooltipSyncPending = true;
            queueMicrotask(() => {
                this.persistentLabelTooltipSyncPending = false;
                if (this.persistentLabelTooltipSource) {
                    this.syncPersistentLabelTooltipFeatures();
                }
            });
        },
        syncPersistentLabelTooltipFeatures() {
            this.persistentLabelTooltipFeatures = markRaw(
                this.persistentLabelTooltipSource.getFeatures().filter(feature => feature.getId() !== undefined)
            );
        },
        initializePersistentLabelTooltips() {
            this.$nextTick(this.attachPersistentLabelTooltipSource);
        },
    },
    watch: {
        mapReadyRevision: 'initializePersistentLabelTooltips',
        showPersistentLabelTooltips(show) {
            this.persistentLabelTooltipLineLayer.setVisible(show);
        },
    },
    created() {
        this.persistentLabelTooltipLineSource = markRaw(new VectorSource());
        this.persistentLabelTooltipLineLayer = markRaw(new VectorLayer({
            source: this.persistentLabelTooltipLineSource,
            zIndex: 101,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            style: Styles.features,
        }));
        this.persistentLabelTooltipSource = null;
        this.persistentLabelTooltipSyncPending = false;
    },
    mounted() {
        this.persistentLabelTooltipLineLayer.setVisible(this.showPersistentLabelTooltips);
        this.map.addLayer(this.persistentLabelTooltipLineLayer);
        this.attachPersistentLabelTooltipSource();
    },
    beforeUnmount() {
        this.detachPersistentLabelTooltipSource();
        this.map.removeLayer(this.persistentLabelTooltipLineLayer);
    },
};
</script>
