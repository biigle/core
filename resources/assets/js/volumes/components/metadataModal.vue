<template>
    <modal
        ref="modal"
        v-model="show"
        size="md"
        :title="name"
        :footer="false"
        >
        <div class="panel panel-default">
            <table class="table">
                <thead>
                    <tr>
                        <th class="text-center" v-if="times">{{ "Time" }}</th>
                        <th class="text-center" v-if="name !== 'Times'">{{ name }}</th>
                    </tr>
                </thead>
                <tbody v-if="name === 'Times'">
                    <tr v-for="time in times">
                        <td class="text-center">{{ time }}</td>
                    </tr>
                </tbody>
                <tbody v-else-if="times.length === items.length">
                    <tr v-for="(item, index) in items">
                        <td class="text-center">{{ times[index] }}</td>
                        <td class="text-center">{{ item }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </modal>
</template>

<script>
import { Modal } from 'uiv';

export default {
    components: {
        modal: Modal,
    },
    props: {
        showModal: {
            required: true,
            type: Boolean,
        },
        times: {
            required: true,
            type: Array,
        },
        items: {
            required: true,
            type: Array,
        },
        name: {
            required: true,
            type: String,
        },
    },
    data() {
        return {
            show: false,
        };
    },
    watch: {
        // if volume-metadata-button pressed, trigger modal
        showModal: function () {
            if (this.showModal) {
                this.show = true;
            }
        },
        // if modal is closed, trigger the close-modal-event, which sets 'showModal' in parent container to false again
        show: function() {
            if (this.show === false) {
                this.$emit('close-modal');
            }
        }
    },
    created() {
        this.show = false;
    }
}
</script>
