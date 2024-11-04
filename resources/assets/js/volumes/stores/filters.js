import FilterList from '../components/filterListComponent.vue';
import FilterSelect from '../components/filterSelectComponent.vue';
import LabelTypeahead from '@/label-trees/components/labelTypeahead.vue';
import VolumesApi from '../api/volumes.js';
import {handleErrorResponse} from '@/core/messages/store.vue';

let imageLabelsFilter = {
    id: 'fileLabels',
    types: ['image'],
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
        return VolumesApi.queryFilesWithFileLabels({id: volumeId});
    },
};

let videoLabelsFilter = {
    id: 'fileLabels',
    types: ['video'],
    label: 'video labels',
    help: "All videos that (don't) have video labels attached.",
    listComponent: {
        mixins: [FilterList],
        data() {
            return {
                name: 'video labels',
            };
        },
    },
    getSequence(volumeId) {
        return VolumesApi.queryFilesWithFileLabels({id: volumeId});
    },
};

let imageLabelFilter = {
    id: 'imageLabel',
    types: ['image'],
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
            VolumesApi.queryUsedFileLabels({id: this.volumeId})
                .then(this.gotItems, handleErrorResponse);
        },
    },
    getSequence(volumeId, label) {
        return VolumesApi.queryFilesWithLabel({id: volumeId, label_id: label.id});
    },
};

let videoLabelFilter = {
    id: 'videoLabel',
    types: ['video'],
    label: 'video label',
    help: "All videos that (don't) have the given video label attached.",
    listComponent: {
        mixins: [FilterList],
        data() {
            return {
                name: 'video label',
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
            VolumesApi.queryUsedFileLabels({id: this.volumeId})
                .then(this.gotItems, handleErrorResponse);
        },
    },
    getSequence(volumeId, label) {
        return VolumesApi.queryFilesWithLabel({id: volumeId, label_id: label.id});
    },
};

let imageLabelUserFilter = {
    id: 'imageLabelUser',
    types: ['image'],
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
                typeaheadMoreInfo: 'affiliation',
            };
        },
        created() {
            VolumesApi.queryUsers({id: this.volumeId})
                .then(this.parseUsernames, handleErrorResponse)
                .then(this.gotItems);
        },
    },
    getSequence(volumeId, user) {
        return VolumesApi.queryFilesWithLabelFromUser({id: volumeId, user_id: user.id});
    },
};

let videoLabelUserFilter = {
    id: 'videoLabelUser',
    types: ['video'],
    label: 'video label from user',
    help: "All videos that (don't) have one or more video labels attached by the given user.",
    listComponent: {
        mixins: [FilterList],
        data() {
            return {
                name: 'video label from user',
            };
        },
    },
    selectComponent: {
        mixins: [FilterSelect],
        data() {
            return {
                placeholder: 'User name',
                typeaheadMoreInfo: 'affiliation',
            };
        },
        created() {
            VolumesApi.queryUsers({id: this.volumeId})
                .then(this.parseUsernames, handleErrorResponse)
                .then(this.gotItems);
        },
    },
    getSequence(volumeId, user) {
        return VolumesApi.queryFilesWithLabelFromUser({id: volumeId, user_id: user.id});
    },
};

let filenameFilter = {
    id: 'filename',
    types: ['image', 'video'],
    label: 'filename',
    help: "All :types that (don't) have a filename matching the given pattern. A pattern may contain the wildcard character * that matches any string of zero or more characters.",
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
        data() {
            return {
                selectedItem: null,
            };
        },
        methods: {
            submit() {
                this.$emit('select', this.selectedItem);
            },
        },
    },
    getSequence(volumeId, pattern) {
        return VolumesApi.queryFilesWithFilename({
            id: volumeId,
            pattern: pattern,
        });
    },
};

let annotationFilter = {
    id: 'annotations',
    types: ['image', 'video'],
    label: 'annotations',
    help: "All :types that (don't) contain annotations.",
    listComponent: FilterList,
    getSequence(volumeId) {
        return VolumesApi.queryFilesWithAnnotations({id: volumeId});
    },
};

let annotationLabelFilter = {
    id: 'annotationLabels',
    types: ['image', 'video'],
    label: 'annotation with label',
    help: "All :types that (don't) contain one or more annotations with the given label.",
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
        return VolumesApi.queryFilesWithAnnotationLabel({
            id: volumeId,
            label_id: label.id,
        });
    }
};

let annotationUserFilter = {
    id: 'annotationUser',
    types: ['image', 'video'],
    label: 'annotations from user',
    help: "All :types that (don't) contain one or more annotations from the given user.",
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
                typeaheadMoreInfo: 'affiliation',
            };
        },
        created() {
            VolumesApi.queryUsers({id: this.volumeId})
                .then(this.parseUsernames, handleErrorResponse)
                .then(this.gotItems);
        },
    },
    getSequence(volumeId, user) {
        return VolumesApi.queryFilesWithAnnotationFromUser({id: volumeId, user_id: user.id});
    },
};

/**
 * Store for the volume image filters
 */
export default [
    // default filters
    imageLabelsFilter,
    videoLabelsFilter,
    imageLabelFilter,
    videoLabelFilter,
    imageLabelUserFilter,
    videoLabelUserFilter,
    filenameFilter,
    annotationFilter,
    annotationLabelFilter,
    annotationUserFilter,
];
