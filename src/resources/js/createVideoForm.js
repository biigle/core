biigle.$viewModel('create-video-form', function (element) {
    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
    });
});
