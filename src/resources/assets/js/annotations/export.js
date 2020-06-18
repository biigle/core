import AnnotationCanvas from './components/annotationCanvas';
import AnnotationsStore from './stores/annotations';
import ImagesStore from './stores/images';
import {plugins as annotationsTabPlugins} from './components/siaAnnotationsTab';
import {plugins as labelsTabPlugins} from './components/labelsTab';
import {plugins as settingsTabPlugins} from './components/settingsTab';

biigle.$declare('annotations.components.annotationCanvas', AnnotationCanvas);
biigle.$declare('annotations.components.annotationsTabPlugins', annotationsTabPlugins);
biigle.$declare('annotations.components.labelsTabPlugins', labelsTabPlugins);
biigle.$declare('annotations.components.settingsTabPlugins', settingsTabPlugins);
biigle.$declare('annotations.stores.annotations', AnnotationsStore); // required for SHERPA2BIIGLE
biigle.$declare('annotations.stores.images', ImagesStore);
