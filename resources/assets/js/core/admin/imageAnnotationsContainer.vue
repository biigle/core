<script>
import chart from '../components/adminChart.vue';

export default {
    components: {
        chart: chart,
    },
    data() {
        return {
            data: [],
        };
    },
    created() {
        this.data = [
            biigle.$require('admin.dayNames'),
            biigle.$require('admin.imageAnnotationWeek'),
        ];
    },
}
</script>
