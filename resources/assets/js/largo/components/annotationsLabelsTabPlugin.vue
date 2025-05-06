<template>
<div v-if="isShown" class="largo-example-annotations">
    <p v-if="loading" class="text-muted">
        Loading example annotations...
    </p>
    <div v-else>
        <div v-if="hasExamples">
            <p class="text-muted" v-if="label.id !== exampleLabel.id">
                Examples with label <strong v-text="exampleLabel.name"></strong>, may be similar to <strong v-text="label.name"></strong>:
            </p>
            <div class="largo-example-annotations__images">
                <annotation-patch
                    v-for="(uuid, id) in exampleAnnotations"
                    :key="id"
                    :_id="id"
                    :_uuid="uuid"
                    :label="label"
                    :empty-src="emptySrc"
                    :_url-template="urlTemplate"
                    >
                </annotation-patch>
            </div>
        </div>
        <p v-else class="text-muted">
            No example annotations available.
        </p>
    </div>
</div>
</template>

<script>
import AnnotationPatch from'./annotationExamplePatch.vue';
import VolumesApi from '../api/volumes.js';
import Events from '@/core/events.js';
import LoaderMixin from '@/core/mixins/loader.vue';

/**
 * The plugin component to show example annotation patches in the labels tab of the
 * annotation tool.
 *
 * @type {Object}
 */
export default {
    mixins: [LoaderMixin],
    components: {
        annotationPatch: AnnotationPatch,
    },
    props: {
        label: {
            default: null,
        },
        volumeId: {
            type: Number,
            required: true,
        },
        count: {
            type: Number,
            default: 3,
        },
        emptySrc: {
            type: String,
            required: true,
        },
        urlTemplate: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            exampleLabel: null,
            exampleAnnotations: [],
            cache: {},
            shown: true,
        };
    },
    computed: {
        isShown() {
            return this.shown && this.label !== null;
        },
        hasExamples() {
            return this.exampleLabel && this.exampleAnnotations && Object.keys(this.exampleAnnotations).length > 0;
        },
    },
    methods: {
        parseResponse(response) {
            return response.data;
        },
        setExampleAnnotations(args) {
            // Delete the cached item if there is less than the desired number of
            // example annotations. Maybe there are more the next time we fetch them
            // again.
            if (!args[0].hasOwnProperty('annotations') || Object.keys(args[0].annotations).length < this.count) {
                delete this.cache[args[1]];
            }

            // Also delete the cached item if there are only examples with a similar
            // label. Maybe there are examples from the requested label the next
            // time.
            if (!args[0].hasOwnProperty('label') || args[0].label.id !== args[1]) {
                delete this.cache[args[1]];
            }

            // Only set the example annotations if the received data belongs to the
            // currently selected label. The user might have selected another label
            // in the meantime.
            if (this.label && this.label.id === args[1]) {
                this.exampleAnnotations = args[0].annotations;
                this.exampleLabel = args[0].label;
            }
        },
        updateShown(shown) {
            this.shown = shown;
        },
        updateExampleAnnotations() {
            this.exampleAnnotations = [];

            // Note that this includes the check for label !== null.
            if (this.isShown) {
                this.startLoading();

                if (!this.cache.hasOwnProperty(this.label.id)) {
                    this.cache[this.label.id] = VolumesApi.queryExampleAnnotations({
                            id: this.volumeId,
                            label_id: this.label.id,
                            take: this.count,
                        })
                        .then(this.parseResponse);
                }

                Promise.all([this.cache[this.label.id], this.label.id])
                    .then(this.setExampleAnnotations)
                    .finally(this.finishLoading);
            }
        },
    },
    watch: {
        label() {
            this.updateExampleAnnotations();
        },
        shown() {
            this.updateExampleAnnotations();
        },
    },
    created() {
        Events.on('settings.exampleAnnotations', this.updateShown);
    },
};
</script>
