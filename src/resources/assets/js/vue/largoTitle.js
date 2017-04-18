/**
 * The dynamic part of the Largo breadcrumbs in the navbar
 */
biigle.$viewModel('largo-title', function (element) {
    var events = biigle.$require('largo.stores.events');

    new Vue({
        el: element,
        data: {
            step: 0,
            count: 0,
            dismissedCount: 0,
        },
        computed: {
            shownCount: function () {
                if (this.isInDismissStep) {
                    return this.count;
                }

                return this.dismissedCount;
            },
            isInDismissStep: function () {
                return this.step === 0;
            },
            isInRelabelStep: function () {
                return this.step === 1;
            },
        },
        methods: {
            updateStep: function (step) {
                this.step = step;
            },
            updateCount: function (count) {
                this.count = count;
            },
            updateDismissedCount: function (count) {
                this.dismissedCount = count;
            },
        },
        created: function () {
            events.$on('annotations-count', this.updateCount);
            events.$on('dismissed-annotations-count', this.updateDismissedCount);
            events.$on('step', this.updateStep);
        }
    });
});
