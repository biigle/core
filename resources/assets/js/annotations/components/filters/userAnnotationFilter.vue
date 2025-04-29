<script>
import AnnotationFilter from '@/annotations/mixins/annotationFilter.vue';

export default {
    extends: AnnotationFilter,
    data() {
        return {
            placeholder: 'user name',
        };
    },
    computed: {
        items() {
            let map = {};
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    map[annotationLabel.user_id] = annotationLabel.user;
                });
            });

            return Object.values(map).map(function (user) {
                user.name = user.firstname + ' ' + user.lastname;
                return user;
            });
        },
    },
    methods: {
        filter(annotations) {
            if (!this.selectedItem) {
                return annotations;
            }

            let id = this.selectedItem.id;

            return annotations.filter(function (annotation) {
                return annotation.labels.reduce(function (carry, annotationLabel) {
                    return carry || annotationLabel.user_id === id;
                }, false);
            });
        },
    },
};
</script>
