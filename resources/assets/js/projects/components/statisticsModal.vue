<template>
    <modal id="modal-demo" ref="modal" v-model="show" title="Statistics" size="lg">
        <p>This is a large modal.</p>
    </modal>
</template>

<script>
import { Modal } from 'uiv';


export default{
    name: "statisticsModal",
    components: {
        modal: Modal
    },
    props: {
        showModal: {required:true, type:Boolean}
    },
    data() {
        return {
            show: false
        };
    },
    methods: {
    },
    watch: {
        // if volume-statistics-button pressed, trigger modal
        showModal: function(){
            if(this.showModal == true){
                this.show = true;
            }
        },
        // if modal is closed, trigger the close-modal-event, which sets 'showModal' in parent container to false again
        show: function() {
            if(this.show == false) {
                this.$emit('close-modal');
                // console.log('SHOW: ', this.show);
            }
        }
    }
}
</script>
