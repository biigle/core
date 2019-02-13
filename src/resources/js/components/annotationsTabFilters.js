biigle.$component('videos.components.annotationsTabFilters', {
    template:
    '<form' +
        ' class="annotations-tab__filter form-inline"' +
        ' @submit.prevent' +
        '>' +
            '<select' +
                ' class="form-control"' +
                ' v-model="chosenFilterIndex"' +
                '>' +
                    '<option' +
                        ' v-for="(filter, index) in annotationFilters"' +
                        ' :value="index"' +
                        ' v-text="filter.name"' +
                        '></option>' +
            '</select>' +
            ' ' +
            '<span'+
                ' v-show="chosenFilter"' +
                ' ref="filterElement"' +
                '></span>' +
            '<input' +
                ' v-show="!chosenFilter"' +
                ' class="form-control"' +
                ' placeholder="Filter annotations"' +
                ' type="text"' +
                ' disabled="true"' +
                '></input>' +
            ' ' +
            '<button' +
                ' class="btn btn-default"' +
                ' title="Clear annotation filter"' +
                ' :class="clearButtonClass"' +
                ' :disabled="!hasActiveFilter"' +
                ' @click.prevent="emitUnselectFilter"' +
                '>' +
                    '<i class="fa fa-times"></i>' +
            '</button>' +
    '</form>',
    props: {
        annotationFilters: {
            type: Array,
            default: function () {
                return [];
            },
        },
        hasActiveFilter: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            chosenFilterIndex: null,
        };
    },
    computed: {
        hasFilters: function () {
            return this.annotationFilters.length > 0;
        },
        chosenFilter: function () {
            return this.annotationFilters[this.chosenFilterIndex];
        },
        clearButtonClass: function () {
            return {
                'btn-info': this.hasActiveFilter,
            };
        },
    },
    methods: {
        emitSelectFilter: function (filter) {
            this.$emit('select', filter);
        },
        emitUnselectFilter: function () {
            this.$emit('unselect');
        },
    },
    watch: {
        chosenFilter: function (filter, oldFilter) {
            if (oldFilter) {
                this.$refs.filterElement.removeChild(oldFilter.$el);
                oldFilter.$off('select', this.emitSelectFilter);
            }

            this.$refs.filterElement.appendChild(filter.$el);
            filter.$on('select', this.emitSelectFilter);
        },
    },
});
