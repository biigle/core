import FilterListComponent from './components/filterListComponent';
import FilterStore from './stores/filters';
import ImageGrid from './components/imageGrid';
import ImageGridImage from './components/imageGridImage';
import SortComponent from './components/sortComponent';
import SorterStore from './stores/sorters';
import VolumesApi from './api/volumes';

biigle.$declare('annotations.api.volumes', VolumesApi); // Legacy support
biigle.$declare('volumes.components.filterListComponent', FilterListComponent);
biigle.$declare('volumes.components.imageGrid', ImageGrid);
biigle.$declare('volumes.components.imageGridImage', ImageGridImage);
biigle.$declare('volumes.mixins.sortComponent', SortComponent); // Legacy support.
biigle.$declare('volumes.stores.filters', FilterStore);
biigle.$declare('volumes.stores.sorters', SorterStore);
