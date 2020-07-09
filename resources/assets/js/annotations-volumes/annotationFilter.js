import VolumesApi from './api/volumes';
import {FilterList} from './import';
import {VolumeFilters} from './import';

/**
 * Annotations filter for the volume overview filters.
 */
if (Array.isArray(VolumeFilters)) {
    VolumeFilters.push({
        id: 'annotations',
        label: 'annotations',
        help: "All images that (don't) contain annotations.",
        listComponent: FilterList,
        getSequence(volumeId) {
            return VolumesApi.queryImagesWithAnnotations({id: volumeId});
        },
    });
}
