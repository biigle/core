import AnnotationCanvas from './components/annotationCanvas';
import AnnotationCanvasMixins from './stores/annotationCanvasMixins';
import AnnotationsStore from './stores/annotations';
import AttachLabelInteraction from './ol/AttachLabelInteraction';
import ImagesStore from './stores/images';
import StylesStore from './stores/styles';
import {plugins as annotationsTabPlugins} from './components/siaAnnotationsTab';
import {plugins as labelsTabPlugins} from './components/labelsTab';
import {plugins as settingsTabPlugins} from './components/settingsTab';

biigle.$declare('annotations.components.annotationCanvas', AnnotationCanvas);
biigle.$declare('annotations.components.annotationsTabPlugins', annotationsTabPlugins);
biigle.$declare('annotations.components.labelsTabPlugins', labelsTabPlugins);
biigle.$declare('annotations.components.settingsTabPlugins', settingsTabPlugins);
biigle.$declare('annotations.ol.AttachLabelInteraction', AttachLabelInteraction);
biigle.$declare('annotations.stores.annotations', AnnotationsStore); // required for SHERPA2BIIGLE
biigle.$declare('annotations.stores.canvasMixins', AnnotationCanvasMixins);
biigle.$declare('annotations.stores.images', ImagesStore);
biigle.$declare('annotations.stores.styles', StylesStore);
