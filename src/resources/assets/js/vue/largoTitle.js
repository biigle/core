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
        },
        methods: {
            isInDismissStep: function () {
                return this.step === 0;
            },
            isInRelabelStep: function () {
                return this.step === 1;
            },
            updateStep: function (step) {
                this.step = step;
            },
            updateCount: function (count) {
                this.count = count;
            },
        },
        created: function () {
            events.$on('annotations-count', this.updateCount);
            events.$on('step', this.updateStep);
        }
    });
});
