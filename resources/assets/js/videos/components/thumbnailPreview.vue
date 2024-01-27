<template>
    <div 
        class="thumbnail-preview" 
        ref="thumbnailPreview" 
        :width="thumbnailWidth" 
        :height="thumbnailHeight">
        
        <canvas 
            class="thumbnail-canvas" 
            ref="thumbnailCanvas" 
            :width="thumbnailWidth" 
            :height="thumbnailHeight"
            ></canvas>
    </div>
</template>

<script>

let transformUuid = function (uuid) {
    return uuid[0] + uuid[1] + '/' + uuid[2] + uuid[3] + '/' + uuid;
};
export default {
    props: {
        duration: {
            type: Number,
            required: true,
        },
        hoverTime: {
            type: Number,
            required: true,
        },
        clientMouseX: {
            type: Number,
            required: true,
        },
        scrollstripTop: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            thumbnailPreview: null,
            thumbnailCanvas: null,
            sprite: new Image(),
            spriteIdx: 0,
            thumbProgressBarSpace: 150,
            spritesFolderPath: null,
            spriteNotFound: false,
            // default values but will be overwritten in created()
            thumbnailWidth: 240,
            thumbnailHeight: 138,
            thumbnailsPerSprite: 25,
            thumbnailInterval: 2.5,
            estimatedThumbnails: 0,
        };
    },
    methods: {
        updateSprite() {
            this.spriteIdx = Math.floor(this.hoverTime / (this.thumbnailInterval * this.thumbnailsPerSprite));
            this.sprite.src = this.spritesFolderPath + "sprite_" + this.spriteIdx + ".webp";
        },
        viewThumbnailPreview() {
            // calculate the current row and column of the sprite
            let thumbnailIndex = Math.floor(this.hoverTime / this.thumbnailInterval) % this.thumbnailsPerSprite;
            if (this.hoverTime >= this.durationRounded) {
                thumbnailIndex = thumbnailIndex === 0 ? this.thumbnailsPerSprite - 1 : this.estimatedThumbnails - 1;
            }
            let thumbnailRow = Math.floor(thumbnailIndex / Math.sqrt(this.thumbnailsPerSprite));
            let thumbnailColumn = thumbnailIndex % Math.sqrt(this.thumbnailsPerSprite);

            // calculate the x and y coordinates of the sprite sheet
            let sourceX = this.thumbnailWidth * thumbnailColumn;
            let sourceY = this.thumbnailHeight * thumbnailRow;

            // draw the current thumbnail to the canvas
            let context = this.thumbnailCanvas.getContext('2d');
            context.clearRect(0, 0, this.thumbnailCanvas.width, this.thumbnailCanvas.height);
            context.drawImage(this.sprite, sourceX, sourceY, this.thumbnailWidth, this.thumbnailHeight, 0, 0, this.thumbnailCanvas.width, this.thumbnailCanvas.height);

            // position the thumbnail preview based on the mouse position
            let sideButtonsWidth = 52;
            let left = Math.min(this.clientMouseX - this.thumbnailCanvas.width / 2, window.innerWidth - this.thumbnailCanvas.width - sideButtonsWidth);
            this.thumbnailPreview.style.left = left + 'px';
            this.thumbnailPreview.style.top = (this.scrollstripTop - this.thumbProgressBarSpace) + 'px';
        },
        updateThumbnailInterval() {
            let maxThumbnails = biigle.$require('videos.spritesMaxThumbnails');
            let minThumbnails = biigle.$require('videos.spritesMinThumbnails');
            let defaultThumbnailInterval = biigle.$require('videos.spritesThumbnailInterval');
            this.durationRounded = Math.floor(this.duration * 10) / 10;
            this.estimatedThumbnails = Math.floor(this.durationRounded / defaultThumbnailInterval);
            if (this.estimatedThumbnails > maxThumbnails) {
                this.estimatedThumbnails = maxThumbnails;
                this.thumbnailInterval = this.durationRounded / maxThumbnails;
            } else if (this.estimatedThumbnails < minThumbnails) {
                this.estimatedThumbnails = minThumbnails;
                this.thumbnailInterval = this.durationRounded / minThumbnails;
            } else {
                this.thumbnailInterval = defaultThumbnailInterval;
            }
        },
        setSpritesFolderpath() {
            let fileUuids = biigle.$require('videos.fileUuids');
            let thumbUri = biigle.$require('videos.thumbUri');
            let videoid = biigle.$require('videos.id');
            let fileUuid = fileUuids[videoid];
            this.spritesFolderPath = thumbUri.replace(':uuid', transformUuid(fileUuid) + '/').replace('.jpg', '');
        },
    },
    watch: {
        hoverTime() {
            this.updateSprite();
        },
    },
    created() {
        this.setSpritesFolderpath();
        this.updateThumbnailInterval();
        this.thumbnailWidth = biigle.$require('videos.spritesThumbnailWidth');
        this.thumbnailHeight = biigle.$require('videos.spritesThumbnailHeight');
        this.thumbnailsPerSprite = biigle.$require('videos.spritesThumbnailsPerSprite');
    },
    mounted() {
        this.thumbnailPreview = this.$refs.thumbnailPreview;
        this.thumbnailCanvas = this.$refs.thumbnailCanvas;
        this.updateSprite();
        this.sprite.onload = () => {
            this.viewThumbnailPreview();
        }
        // can't hide the error 404 message on the browser console
        // trying to use a http request to ask if the file exists and wrap it with try/catch 
        // does prevent the GET 404(Not Found) error 
        // but we get a HEAD 404(Not Found) error instead (maybe server side?)
        this.sprite.onerror = () => {
            if (this.thumbnailPreview.style.display !== 'none') {
                this.thumbnailPreview.style.display = 'none';
            }
        }
    }
};
</script>