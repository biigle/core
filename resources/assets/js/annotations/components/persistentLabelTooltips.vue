<template>
    <persistent-label-tooltip
        v-for="feature in visibleFeatures"
        :key="feature.getId()"
        :feature="feature"
        :line-source="lineSource"
        :map="map"
        ></persistent-label-tooltip>
</template>

<script>
import PersistentLabelTooltip from './persistentLabelTooltip.vue';
import Styles from '../stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import {LABEL_TOOLTIP_MODES} from '../utils.js';
import {markRaw} from 'vue';

export default {
    components: {
        persistentLabelTooltip: PersistentLabelTooltip,
    },
    props: {
        annotationSource: {
            type: Object,
            default: null,
        },
        map: {
            type: Object,
            required: true,
        },
        mode: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            features: [],
        };
    },
    computed: {
        activeSource() {
            return this.mode === LABEL_TOOLTIP_MODES.ALWAYS ? this.annotationSource : null;
        },
        visibleFeatures() {
            return this.features.filter(feature => {
                return feature.get('annotation')?.labels.length > 0;
            });
        },
    },
    methods: {
        syncFeatures() {
            this.features = markRaw(
                this.source.getFeatures().filter(feature => feature.getId() !== undefined)
            );
        },
        scheduleSync() {
            if (this.syncPending) return;

            this.syncPending = true;
            queueMicrotask(() => {
                this.syncPending = false;
                if (this.source) {
                    this.syncFeatures();
                }
            });
        },
        detachSource() {
            if (!this.source) return;

            this.source.un('addfeature', this.scheduleSync);
            this.source.un('removefeature', this.scheduleSync);
            this.source.un('clear', this.scheduleSync);
            this.source = null;
            this.features = [];
        },
        attachSource(source) {
            if (this.source === source) return;

            this.detachSource();
            if (!source) return;

            this.source = source;
            source.on('addfeature', this.scheduleSync);
            source.on('removefeature', this.scheduleSync);
            source.on('clear', this.scheduleSync);
            this.syncFeatures();
        },
    },
    watch: {
        activeSource: 'attachSource',
        mode(mode) {
            this.lineLayer.setVisible(mode === LABEL_TOOLTIP_MODES.ALWAYS);
        },
    },
    created() {
        // OpenLayers objects must not become reactive because this hurts rendering performance.
        this.source = null;
        this.syncPending = false;
        this.lineSource = new VectorSource();
        this.lineLayer = new VectorLayer({
            source: this.lineSource,
            zIndex: 101,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            style: Styles.features,
        });
        this.lineLayer.setVisible(this.mode === LABEL_TOOLTIP_MODES.ALWAYS);
        this.attachSource(this.activeSource);
    },
    mounted() {
        this.map.addLayer(this.lineLayer);
    },
    beforeUnmount() {
        this.detachSource();
        this.map.removeLayer(this.lineLayer);
    },
};
</script>
