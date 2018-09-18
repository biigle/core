/**
 * View model for the annotator navbar
 */
biigle.$viewModel('annotations-navbar', function (element) {

    new Vue({
        el: element,
        mixins: [biigle.$require('annotations.mixins.imageFilenameTracker')],
        data: {
            // Take the pre-filled content of the element when the page is initially
            // loaded until the image id has been set. Otherwise the filename would
            // vanish and appear again what we don't want.
            defaultFilename: element.innerText,
            imageIds: biigle.$require('annotations.imagesIds').slice(),
            imageIdsLeft: biigle.$require('annotations.imagesIds').slice(),
            initialImageId: null,
            showIndicator: true,
        },
        computed: {
            progressPath: function () {
                var largeArc = this.progress >= 0.5 ? 1 : 0;
                var position = this.arcPosition(this.progress);

                return 'M 2 1 A 1 1 0 ' + largeArc + ' 1 ' + position.join(' ') + 'L 1 1';
            },
            initialProgressPath: function () {
                var position = this.arcPosition(this.initialProgress);

                return 'M 1 1 L ' + position.join(' ');
            },
            progressTitle: function () {
                var additions = ['started at ' + this.initialImageNumber];
                if (this.hasSeenAllImages) {
                    additions.push('seen all');
                }

                return 'Image ' + this.currentImageNumber + ' of ' + this.imageIds.length + ' (' + additions.join(', ') + ')';
            },
            currentImageNumber: function () {
                if (this.currentImageId) {
                    return this.imageIds.indexOf(this.currentImageId) + 1;
                }

                return 0;
            },
            progress: function () {
                return this.currentImageNumber / this.imageIds.length;
            },
            initialImageNumber: function () {
                if (this.initialImageId === null) {
                    return 1;
                }

                return this.imageIds.indexOf(this.initialImageId) + 1;
            },
            initialProgress: function () {
                return this.initialImageNumber / this.imageIds.length;
            },
            hasSeenAllImages: function () {
                return this.imageIdsLeft.length === 0;
            },
            showInitialProgressMarker: function () {
                return this.initialImageNumber !== 1;
            },
            indicatorClass: function () {
                return this.hasSeenAllImages ? 'progress-indicator--all' : '';
            },
            filenameClass: function () {
                return this.hasSeenAllImages ? 'text-success' : '';
            },
            filenameTitle: function () {
                return this.hasSeenAllImages ? 'You have seen all images' : '';
            },
        },
        methods: {
            arcPosition: function (percent) {
                return [
                    Math.cos(2 * Math.PI * percent) + 1,
                    Math.sin(2 * Math.PI * percent) + 1,
                ];
            },
            setInitialImageId: function (id) {
                this.initialImageId = id;
            },
            updateShowIndicator: function (show) {
                this.showIndicator = show !== false;
            },
        },
        watch: {
            currentImageId: function (id) {
                var ids = this.imageIdsLeft;
                for (var i = ids.length - 1; i >= 0; i--) {
                    if (ids[i] === id) {
                        ids.splice(i, 1);
                        break;
                    }
                }
            },
            currentImageFilename: function (filename) {
                document.title = 'Annotate ' + filename;
            },
        },
        created: function () {
            var self = this;
            var events = biigle.$require('events');

            events.$on('images.sequence', function (ids) {
                self.imageIds = ids.slice();
                self.imageIdsLeft = ids.slice();
            });

            events.$once('images.change', this.setInitialImageId);

            var settings = biigle.$require('annotations.stores.settings');
            this.updateShowIndicator(settings.get('progressIndicator'));
            settings.$watch('settings.progressIndicator', this.updateShowIndicator);
        },
    });
});
