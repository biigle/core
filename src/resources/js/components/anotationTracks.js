biigle.$component('videos.components.annotationTracks', {
    template:
    '<div' +
        ' class="annotation-tracks"' +
        ' draggable="true"' +
        ' @click="emitDeselect"' +
        ' @mousedown="startDragging"' +
        ' @mouseup="stopDragging"' +
        ' @mousemove="continueDragging"' +
        ' @scroll.stop="updateScrollTop"' +
        '>' +
            '<annotation-track v-for="track in tracks"' +
                ' :label="track.label"' +
                ' :lanes="track.lanes"' +
                ' :duration="duration"' +
                ' :element-width="elementWidth"' +
                ' @select="emitSelect"' +
                '></annotation-track>' +
    '</div>',
    components: {
        annotationTrack: biigle.$require('videos.components.annotationTrack'),
    },
    props: {
        tracks: {
            type: Array,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        elementWidth: {
            type: Number,
            required: true,
        },
    },
    data: function () {
        return {
            hasOverflowTop: false,
            hasOverflowBottom: false,
            dragging: false,
            scrollTop: 0,
            scrollHeight: 0,
            clientHeight: 0,
        };
    },
    computed: {
        hasOverflowTop: function () {
            return this.scrollTop > 0;
        },
        hasOverflowBottom: function () {
            var breakpoint = (this.scrollHeight - this.clientHeight);

            return breakpoint > 0 && this.scrollTop < breakpoint;
        },
    },
    methods: {
        emitSelect: function (annotation, time) {
            this.$emit('select', annotation, time);
        },
        emitDeselect: function () {
            this.$emit('deselect');
        },
        emitDragX: function (delta) {
            this.$emit('drag-x', delta);
        },
        startDragging: function (e) {
            this.dragging = e.buttons === 1;
        },
        stopDragging: function () {
            this.dragging = false;
        },
        continueDragging: function (e) {
             if (this.dragging) {
                if (e.buttons !== 1) {
                    // If the cursor left the element and the mouse button was released.
                    this.stopDragging();
                } else {
                    this.$el.scrollTop -= e.movementY;

                    if (e.movementX !== 0) {
                        this.emitDragX(e.movementX);
                    }
                }
            }
        },
        updateScrollTop: function () {
            this.scrollTop = this.$el.scrollTop;
        },
        updateScrollHeight: function () {
            this.scrollHeight = this.$el.scrollHeight;
        },
        updateClientHeight: function () {
            this.clientHeight = this.$el.clientHeight;
        },
    },
    watch: {
        tracks: function () {
            this.$nextTick(this.updateScrollHeight);
        },
        hasOverflowTop: function (has) {
            this.$emit('overflow-top', has);
        },
        hasOverflowBottom: function (has) {
            this.$emit('overflow-bottom', has);
        },
        scrollTop: function (scrollTop) {
            this.$emit('scroll-y', scrollTop);
        },
    },
    created: function () {
        window.addEventListener('resize', this.updateClientHeight);
    },
    mounted: function () {
        this.$nextTick(this.updateClientHeight);
    },
});
