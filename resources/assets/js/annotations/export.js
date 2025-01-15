import AnnotationCanvas from './components/annotationCanvas.vue';
import AnnotationCanvasMixins from './stores/annotationCanvasMixins.js';
import AnnotationsStore from './stores/annotations.js';
import AttachLabelInteraction from './ol/AttachLabelInteraction.js';
import ImagesStore from './stores/images.js';
import StylesStore from './stores/styles.js';
import {plugins as annotationsTabPlugins} from './components/siaAnnotationsTab.vue';
import {plugins as labelsTabPlugins} from './components/labelsTab.vue';
import {plugins as settingsTabPlugins} from './components/settingsTab.vue';

biigle.$declare('annotations.components.annotationCanvas', AnnotationCanvas);
biigle.$declare('annotations.components.annotationsTabPlugins', annotationsTabPlugins);
biigle.$declare('annotations.components.labelsTabPlugins', labelsTabPlugins);
biigle.$declare('annotations.components.settingsTabPlugins', settingsTabPlugins);
biigle.$declare('annotations.ol.AttachLabelInteraction', AttachLabelInteraction);
biigle.$declare('annotations.stores.annotations', AnnotationsStore); // required for SHERPA2BIIGLE
biigle.$declare('annotations.stores.canvasMixins', AnnotationCanvasMixins);
biigle.$declare('annotations.stores.images', ImagesStore);
biigle.$declare('annotations.stores.styles', StylesStore);
