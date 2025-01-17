<template>
    <modal
        id="modal-show-metadata"
        ref="modal"
        v-model="show"
        size="lg"
        :title="name"
        :footer="false"
        >
        <div class="panel panel-default table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th v-for="time in times">{{ time }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="items">
                        <td v-for="item in items">{{ item }}</td>
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
        this.$emit('load-modal');
    }
}
</script>
