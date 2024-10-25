<template>
    <div class="filtering-tab">
        <div class="list-group filter-list-group">
            <label>Annotation type</label>
            <select
                class="form-control"
                @change="filterAnnotation"
                v-model="annotationType"
                >
                <option
                    v-for="annotation_type_name, annotation_type_id in annotationShapes"
                    :value="annotation_type_id"
                    v-text="annotation_type_name"
                    ></option>
            </select>
        </div>

    </div>
</template>
<script>

export default {
    methods: {
        filterAnnotation(annotationValue) {
            console.log(this.annotationType)
        }
    },
    data() {
        return {
            annotationType: {},
            annotationShapes : {}
        }
    },
    created() {
        this.$emit("load-shapes")
    }
};
</script>
