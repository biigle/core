<script>
import AnnotationFilter from '../mixins/annotationFilter.vue';

export default Vue.extend({
    mixins: [AnnotationFilter],
    data() {
        return {
            name: 'session',
            sessions: [],
            placeholder: 'session name',
        };
    },
    computed: {
        items() {
            return this.sessions.map(function (session) {
                session.starts_at = new Date(session.starts_at);
                session.ends_at = new Date(session.ends_at);

                return session;
            });
        },
    },
    methods: {
        filter(annotations) {
            if (!this.selectedItem) {
                return annotations;
            }

            let session = this.selectedItem;
            let userMap = {};
            session.users.forEach(function (user) {
                userMap[user.id] = null;
            });

            /*
             * Dates without timezone (like these) are interpreted as dates of the
             * timezone of the browser. Since the application can run in any
             * timezone, these dates may not be interpreted correctly. But since the
             * dates of the annotation session are not interpreted correctly, too
             * (in the same way), we can still use them for comparison. Just be sure
             * not to use the iso_8601 dates of the annotation session for
             * comparison with the dates of the annotations.
             */
            return annotations.filter(function (annotation) {
                for (let i = annotation.labels.length - 1; i >= 0; i--) {
                    if (userMap.hasOwnProperty(annotation.labels[i].user_id)) {
                        // If the annotation has a label of a user that belongs to
                        // the session, it is valid if created_at belongs to the
                        // session, too.
                        let created_at = new Date(annotation.created_at);

                        return created_at >= session.starts_at && created_at < session.ends_at;
                    }
                }

                return false;
            });
        },
    },
});
</script>
