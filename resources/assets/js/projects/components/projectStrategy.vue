<template>
    <div class='project-strategy'>
        <h4><span v-if="editing">Edit </span><span v-if="creating">Create </span>Annotation Strategy</h4>
        <div v-if="isAdmin">
            <button class="btn pull-right">Edit</button>
        </div>
                <a class="pull-right" href="/manual/tutorials/projects/about#members" title="Learn more about project members" target="_blank"><i class="fa fa-question-circle"></i></a>


        <div v-if="editing || creating">
            <form @submit.prevent="sendProjectStrategyUpdate">
                <div class="form-group project-strategy-description ">
                    <label>Description</label>
                    <textarea v-model="strategyDescription" class="strategy-description" maxlength=2000 wrap="hard"
                        :placeholder="descriptionPlaceholder"
                        ></textarea>
                </div>
                <button
                    class="btn btn-success btn-block"
                    type="submit"
                    >
                    Create
                </button>
                <button
                    class="btn btn-danger btn-block"
                    type="submit"
                    >
                    Delete
                </button>
            </form>
        </div>
        <div v-else>
            <div class="form-group project-strategy-description ">
                <h5>Description</h5>
                <p>{{ strategyDescription }}</p>
            </div>
        </div>
    </div>
</template>
<script>
import ProjectStrategy from '@/projects/api/projectStrategy.js';

export default {
    props: {
        annotationStrategy: {
            type: Object,
            default: undefined,
        },
        annotationStrategyLabel: {
            type: Object,
            default: undefined,
        },
        isAdmin: {
            type: Boolean,
            required: true,
        },
    },
    computed: {
        descriptionPlaceholder() {
            return this.strategyDescription ? this.strategyDescription.length > 0 : "Describe the annotation strategy here..."
        },
        creating() {
            return this.annotationStrategy === undefined;
        }
    },
    created() {
        if (this.annotationStrategy !== undefined) {
            this.strategyDescription = this.annotationStrategy.description;
        }
    },
    data() {
        return {
            editing: false,
            strategyDescription: "",
            projectId: biigle.$require('projects.project').id,
        }
    },
    methods: {
        sendProjectStrategyUpdate() {

            ProjectStrategy.save({id: this.projectId, description: this.strategyDescription}).then(location.reload())
        }

    }
};

</script>
