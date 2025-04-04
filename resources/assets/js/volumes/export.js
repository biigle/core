import FilterListComponent from './components/filterListComponent.vue';
import FilterStore from './stores/filters.js';
import ImageGrid from './components/imageGrid.vue';
import ImageGridImage from './components/imageGridImage.vue';
import SortComponent from './components/sortComponent.vue';
import SorterStore from './stores/sorters.js';
import VolumesApi from './api/volumes.js';

biigle.$declare('annotations.api.volumes', VolumesApi); // Legacy support
biigle.$declare('volumes.api.volumes', VolumesApi);
biigle.$declare('volumes.components.filterListComponent', FilterListComponent);
biigle.$declare('volumes.components.imageGrid', ImageGrid);
biigle.$declare('volumes.components.imageGridImage', ImageGridImage);
biigle.$declare('volumes.mixins.sortComponent', SortComponent); // Legacy support.
biigle.$declare('volumes.stores.filters', FilterStore);
biigle.$declare('volumes.stores.sorters', SorterStore);
