<template>
    <div 
        class="thumbnail-preview" 
        ref="thumbnailPreview" 
        :style="thumbnailStyle"
        v-show="!spriteNotFound">
        <canvas 
            class="thumbnail-canvas" 
            ref="thumbnailCanvas" 
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
        videoId: {
            type: Number,
            required: true,
        }
    },
    data() {
        return {
            thumbnailPreview: null,
            thumbnailCanvas: null,
            sprite: new Image(),
            spriteIdx: 0,
            thumbProgressBarSpace: 5,
            sideButtonsWidth: 52,
            spritesFolderPath: null,
            triedUrls: {},
            // retry sprite loading x times
            retryAttempts: 2,
            // start with true to hide flashing black thumbnail
            spriteNotFound: true,
            // default values but will be overwritten in created()
            thumbnailWidth: 360,
            thumbnailHeight: 270,
            canvasWidth: 0,
            canvasHeight: 0,
            thumbnailsPerSprite: 25,
            thumbnailInterval: 2.5,
            estimatedThumbnails: 0,
            thumbnailSizes: [],
        };
    },
    computed: {
        thumbnailStyle() {
            let left = Math.min(
                this.clientMouseX - this.canvasWidth / 2,
                window.innerWidth - this.canvasWidth - this.sideButtonsWidth
            );
            let top = this.scrollstripTop - this.thumbProgressBarSpace;
            return {
                transform: `translate(${left}px, -100%)`,
                top: `${top}px`,
            };
        }
    },
    methods: {
        updateSprite() {
            this.spriteIdx = Math.floor(this.hoverTime / (this.thumbnailInterval * this.thumbnailsPerSprite));
            let SpriteUrl = this.spritesFolderPath + "sprite_" + this.spriteIdx + ".webp";

            if (!this.triedUrls[SpriteUrl]) {
                this.triedUrls[SpriteUrl] = 0
            }
            if (this.triedUrls[SpriteUrl] < this.retryAttempts) {
                this.sprite.src = SpriteUrl;
            } else {
                this.spriteNotFound = true;
            }
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
            context.drawImage(this.sprite, sourceX, sourceY, this.thumbnailWidth, this.thumbnailHeight, 0, 0, this.thumbnailCanvas.width, this.thumbnailCanvas.height);
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
            let fileUuid = fileUuids[this.videoId];
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
        this.thumbnailSizes = biigle.$require('videos.thumbnailSizes');
        let thumbSize = this.thumbnailSizes[this.videoId];
        this.thumbnailWidth = thumbSize['w'];
        this.thumbnailHeight = thumbSize['h'];
        this.thumbnailsPerSprite = biigle.$require('videos.spritesThumbnailsPerSprite');
    },
    mounted() {
        this.thumbnailPreview = this.$refs.thumbnailPreview;
        this.thumbnailCanvas = this.$refs.thumbnailCanvas;
        this.canvasWidth = Math.ceil(this.thumbnailWidth / 2);
        this.canvasHeight = Math.ceil(this.thumbnailHeight / 2);
        this.thumbnailCanvas.width = this.canvasWidth;
        this.thumbnailCanvas.height = this.canvasHeight;
        this.updateSprite();
        this.sprite.onload = () => {
            this.spriteNotFound = false;
            this.viewThumbnailPreview();
        }
        this.sprite.onerror = () => {
            this.spriteNotFound = true;
            if (this.sprite.src in this.triedUrls) {
                this.triedUrls[this.sprite.src]++;
            }
        }
    }
};
</script>
