import FilterList from '../components/filterListComponent';
import FilterSelect from '../components/filterSelectComponent';
import LabelTypeahead from '../../label-trees/components/labelTypeahead';
import VolumesApi from '../api/volumes';
import {handleErrorResponse} from '../../core/messages/store';

let imageLabelsFilter = {
    id: 'imageLabels',
    label: 'image labels',
    help: "All images that (don't) have image labels attached.",
    listComponent: {
        mixins: [FilterList],
        data() {
            return {
                name: 'image labels',
            };
        },
    },
    getSequence(volumeId) {
        return VolumesApi.queryImagesWithImageLabels({id: volumeId});
    },
};

let imageLabelFilter = {
    id: 'imageLabel',
    label: 'image label',
    help: "All images that (don't) have the given image label attached.",
    listComponent: {
        mixins: [FilterList],
        data() {
            return {
                name: 'image label',
            };
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
            VolumesApi.queryUsedImageLabels({id: this.volumeId})
                .then(this.gotItems, handleErrorResponse);
        },
    },
    getSequence(volumeId, label) {
        return VolumesApi.queryImagesWithImageLabel({
            id: volumeId,
            label_id: label.id,
        });
    },
};

let imageLabelUserFilter = {
    id: 'imageLabelUser',
    label: 'image label from user',
    help: "All images that (don't) have one or more image labels attached by the given user.",
    listComponent: {
        mixins: [FilterList],
        data() {
            return {
                name: 'image label from user',
            };
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
            VolumesApi.queryUsers({id: this.volumeId})
                .then(this.parseUsernames, handleErrorResponse)
                .then(this.gotItems);
        },
    },
    getSequence(volumeId, user) {
        return VolumesApi.queryImagesWithImageLabelFromUser({
            id: volumeId,
            user_id: user.id,
        });
    },
};

let filenameFilter = {
    id: 'filename',
    label: 'filename',
    help: "All images that (don't) have a filename matching the given pattern. A pattern may contain the wildcard character * that matches any string of zero or more characters.",
    listComponent: {
        mixins: [FilterList],
        computed: {
            dataName() {
                return this.rule.data;
            },
        },
    },
    selectComponent: {
        template: `<div class="filter-select">
            <div class="typeahead">
                <input class="form-control" type="text" v-model="selectedItem" placeholder="Filename pattern">
            </div>
            <button type="submit" class="btn btn-default" @click="submit" :disabled="!selectedItem">Add rule</button>
        </div>`,
        mixins: [FilterSelect],
    },
    getSequence(volumeId, pattern) {
        return VolumesApi.queryImagesWithFilename({
            id: volumeId,
            pattern: pattern,
        });
    },
};

let annotationFilter = {
    id: 'annotations',
    label: 'annotations',
    help: "All images that (don't) contain annotations.",
    listComponent: FilterList,
    getSequence(volumeId) {
        return VolumesApi.queryImagesWithAnnotations({id: volumeId});
    },
};

let annotationLabelFilter = {
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
                .then(this.gotItems, handleErrorResponse);
        },
    },
    getSequence(volumeId, label) {
        return VolumesApi.queryImagesWithAnnotationLabel({
            id: volumeId,
            label_id: label.id,
        });
    }
};

let annotationUserFilter = {
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
            VolumesApi.queryUsers({id: this.volumeId})
                .then(this.parseUsernames, handleErrorResponse)
                .then(this.gotItems);
        },
    },
    getSequence(volumeId, user) {
        return VolumesApi.queryImagesWithAnnotationFromUser({id: volumeId, user_id: user.id});
    },
};

/**
 * Store for the volume image filters
 */
export default [
    // default filters
    imageLabelsFilter,
    imageLabelFilter,
    imageLabelUserFilter,
    filenameFilter,
    annotationFilter,
    annotationLabelFilter,
    annotationUserFilter,
];
