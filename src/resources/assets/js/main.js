import './annotationsLabelsTabPlugin';
import './annotationsSettingsTabPlugin';
import AnnotationCatalogContainer from './annotationCatalogContainer';
import LargoContainer from './largoContainer';
import LargoTitle from './largoTitle';
import ProjectLargoContainer from './projectLargoContainer';

biigle.$mount('annotation-catalog-container', AnnotationCatalogContainer);
biigle.$mount('largo-container', LargoContainer);
biigle.$mount('largo-title', LargoTitle);
biigle.$mount('project-largo-container', ProjectLargoContainer);
