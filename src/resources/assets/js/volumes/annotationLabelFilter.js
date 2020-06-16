import VolumesApi from './api/volumes';
import {FilterList} from './import';
import {FilterSelect} from './import';
import {VolumeFilters} from './import';
import {LabelTypeahead} from './import';
import {Messages} from './import';

/**
 * Annotation label filter for the volume overview filters.
 */
if (Array.isArray(VolumeFilters)) {
    VolumeFilters.push({
        id: 'annotationLabels',
        label: 'annotation with label',
        help: "All images that (don't) contain one or more annotations with the given label.",
        listComponent: {
            mixins: [FilterList],
            data() {
                return {name: 'annotation with label'};
            },
        },
        selectComponent: {
            mixins: [FilterSelect],
            components: {
                typeahead: LabelTypeahead,
            },
            data() {
                return {
                    placeholder: 'Label name',
                };
            },
            created() {
                VolumesApi.queryAnnotationLabels({id: this.volumeId})
                    .then(this.gotItems, Messages.handleErrorResponse);
            },
        },
        getSequence(volumeId, label) {
            return VolumesApi.queryImagesWithAnnotationLabel({
                id: volumeId,
                label_id: label.id,
            });
        }
    });
}
