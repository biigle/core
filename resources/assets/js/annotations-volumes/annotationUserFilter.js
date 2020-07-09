import VolumesApi from './api/volumes';
import {FilterList} from './import';
import {FilterSelect} from './import';
import {handleErrorResponse} from './import';
import {VolumeFilters} from './import';
import {VolumesApi as CoreVolumesApi} from './import';

/**
 * Annotation user filter for the volume overview filters.
 */
if (Array.isArray(VolumeFilters)) {
    VolumeFilters.push({
        id: 'annotationUser',
        label: 'annotations from user',
        help: "All images that (don't) contain one or more annotations from the given user.",
        listComponent: {
            mixins: [FilterList],
            data() {
                return {name: 'annotations from user'};
            },
        },
        selectComponent: {
            mixins: [FilterSelect],
            data() {
                return {
                    placeholder: 'User name',
                    typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.affiliation"></small>',
                };
            },
            created() {
                CoreVolumesApi.queryUsers({id: this.volumeId})
                    .then(this.parseUsernames, handleErrorResponse)
                    .then(this.gotItems);
            },
        },
        getSequence(volumeId, user) {
            return VolumesApi.queryImagesWithAnnotationFromUser({id: volumeId, user_id: user.id});
        },
    });
}
