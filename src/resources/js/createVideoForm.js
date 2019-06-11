biigle.$viewModel('create-video-form', function (element) {
    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        mounted: function () {
            // Vue disables the autofocus attribute somehow, so set focus manually here.
            this.$refs.nameInput.focus();
        },
    });
});
