<script>
import DatepickerDropdown from '../../uiv/datepickerDropdown';
/**
 * The a form that creates a announcement
 */
// Set the initial content of the textarea to the 'body' model and then clear the
// textarea before initializing Vue. Else Vue will complain that v-model does not
// support initial inline data although we want to have it from a possible failed
// validation.

export default {
    components: {
        datepickerDropdown: DatepickerDropdown,
    },
    data() {
        return {
            title: '',
            body: '',
            showUntil: '',
            limitFrom: new Date(),
        };
    },
    computed: {
        titleChars() {
            return `${this.title.length}/30`;
        },
        titleClass() {
            return {
                'has-warning': this.title.length > 30,
            };
        },
    },
    created() {
        this.title = biigle.$require('announcement.title');
        this.body = biigle.$require('announcement.body');
        this.showUntil = biigle.$require('announcement.showUntil');
    },
};
</script>
