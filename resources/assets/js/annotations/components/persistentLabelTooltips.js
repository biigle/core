import PersistentLabelTooltip from './persistentLabelTooltip.vue';
import Styles from '../stores/styles.js';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import {computed, markRaw, nextTick, reactive, shallowRef, watch} from 'vue';
import {LABEL_TOOLTIP_MODES} from '../utils.js';

export {PersistentLabelTooltip};

export function usePersistentLabelTooltips({annotationSource, map, mapReadyRevision, mode}) {
    const features = shallowRef([]);
    const show = computed(() => mode.value === LABEL_TOOLTIP_MODES.ALWAYS);
    const visibleFeatures = computed(() => {
        if (!show.value) return [];

        return features.value.filter(feature => {
            return feature.get('annotation')?.labels.length > 0;
        });
    });
    const lineSource = markRaw(new VectorSource());
    const lineLayer = markRaw(new VectorLayer({
        source: lineSource,
        zIndex: 101,
        updateWhileAnimating: true,
        updateWhileInteracting: true,
        style: Styles.features,
    }));
    let source = null;
    let syncPending = false;

    function syncFeatures() {
        features.value = markRaw(
            source.getFeatures().filter(feature => feature.getId() !== undefined)
        );
    }

    function scheduleSync() {
        if (syncPending) return;

        syncPending = true;
        queueMicrotask(() => {
            syncPending = false;
            if (source) {
                syncFeatures();
            }
        });
    }

    function detachSource() {
        if (!source) return;

        source.un('addfeature', scheduleSync);
        source.un('removefeature', scheduleSync);
        source.un('clear', scheduleSync);
        source = null;
        features.value = [];
    }

    function attachSource() {
        const newSource = annotationSource.value;
        if (!newSource || source === newSource) return;

        detachSource();
        source = newSource;
        source.on('addfeature', scheduleSync);
        source.on('removefeature', scheduleSync);
        source.on('clear', scheduleSync);
        syncFeatures();
    }

    const stopMapReadyWatch = watch(mapReadyRevision, () => nextTick(attachSource));
    const stopShowWatch = watch(show, value => lineLayer.setVisible(value));

    function mount() {
        lineLayer.setVisible(show.value);
        map.value.addLayer(lineLayer);
        attachSource();
    }

    function unmount() {
        detachSource();
        map.value.removeLayer(lineLayer);
        stopMapReadyWatch();
        stopShowWatch();
    }

    return reactive({
        lineSource,
        mount,
        show,
        unmount,
        visibleFeatures,
    });
}
