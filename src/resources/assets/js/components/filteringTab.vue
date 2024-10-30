<template>
    <div class="filtering-tab" @click.delay.once="loadShapes" v-on:filter-tab-clicked="loadShapes">
        <div class="list-group filter-list-group">
            <label>Annotation Shape</label>
            <select
                class="form-control"
                @change="filterAnnotation"
                v-model="annotationShape"
                >
                <option
                    v-for="annotation_type_name, annotation_type_id in this.shapes"
                    :value="annotation_type_id"
                    v-text="annotation_type_name"
                    ></option>
            </select>
        </div>

    </div>
</template>
<script>

export default {
    props: {
        annotationShapes: {
            type: Function,
            required: true,
        }
    },
    data() {
        return {
            annotationShape: {},
            shapes: {}            
        }
    },
    computed: {
        getAnnotationShapes(){
            return this.getShapes()
        }
    },
    methods: {
        filterAnnotation(annotationValue) {
            console.log(this.annotationShape)
        },
        
        async loadShapes(){
            if (Object.keys(this.shapes).length < 1) {
                this.shapes = await this.annotationShapes()
        }
        }
    },
    created() {
    }
};
</script>
