<template>
    <span :style="stateStyle">
    </span>
</template>

<script>
export default {
    props: {
        labelbotState: {
            type: String,
            required: true,
        }
    },
    computed: {
        stateStyle() {
            let style = {};
            switch (this.labelbotState) {
                case 'ready':
                    style = { backgroundColor: '#219b19'};
                    break;
                case 'initializing':
                    style = { backgroundColor: 'yellow' };
                    break;
                case 'computing':
                    style = { backgroundColor: '#21dae6' };
                    break;
                case 'busy': // busy if max number of requests is reached
                    style = { backgroundColor: 'gray' };
                    break;
                default:
                    style = { backgroundColor: 'red' };
            }
            return style;
        }
    }
}
</script>
