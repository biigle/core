import AnnotationCanvas from './components/annotationCanvas';
import AnnotationsStore from './stores/annotations';
import AttachLabelInteraction from './ol/AttachLabelInteraction';
import ControlButton from './components/controlButton';
import ImagesStore from './stores/images';
import LabelTooltip from './components/labelTooltip';
import Minimap from './components/minimap';
import MousePositionIndicator from './components/mousePositionIndicator';
import StylesStore from './stores/styles';
import TranslateInteraction from './ol/TranslateInteraction';
import {plugins as annotationsTabPlugins} from './components/siaAnnotationsTab';
import {plugins as labelsTabPlugins} from './components/labelsTab';
import {plugins as settingsTabPlugins} from './components/settingsTab';

biigle.$declare('annotations.components.annotationCanvas', AnnotationCanvas);
biigle.$declare('annotations.components.annotationsTabPlugins', annotationsTabPlugins);
biigle.$declare('annotations.components.controlButton', ControlButton);
biigle.$declare('annotations.components.labelsTabPlugins', labelsTabPlugins);
biigle.$declare('annotations.components.labelTooltip', LabelTooltip);
biigle.$declare('annotations.components.mousePositionIndicator', MousePositionIndicator);
biigle.$declare('annotations.components.settingsTabPlugins', settingsTabPlugins);
biigle.$declare('annotations.ol.AttachLabelInteraction', () => AttachLabelInteraction);
biigle.$declare('annotations.ol.TranslateInteraction', () => TranslateInteraction);
biigle.$declare('annotations.stores.annotations', AnnotationsStore); // required for SHERPA2BIIGLE
biigle.$declare('annotations.stores.images', ImagesStore);
biigle.$declare('annotations.stores.styles', StylesStore);
