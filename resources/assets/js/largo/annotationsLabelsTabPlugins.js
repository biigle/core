import Plugin from './components/annotationsLabelsTabPlugin.vue';
import {plugins} from '@/annotations/components/labelsTab.vue';

if (plugins) {
    plugins.exampleAnnotations = Plugin;
}
