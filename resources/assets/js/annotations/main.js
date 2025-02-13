import './export';
import '@biigle/ol/ol.css';
import Container from './annotatorContainer.vue';
import Navbar from './annotationsNavbar.vue';

biigle.$mount('annotator-container', Container);
biigle.$mount('annotations-navbar', Navbar);

