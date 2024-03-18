<template>
    <div 
        class="thumbnail-preview" 
        ref="thumbnailPreview" 
        :style="thumbnailStyle"
        :width="thumbnailWidth" 
        :height="thumbnailHeight"
        v-show="!spriteNotFound">
        
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
            sideButtonsWidth: 52,
            spritesFolderPath: null,
            triedUrls: {},
            // retry sprite loading x times
            retryAttempts: 2,
            // start with true to hide flashing black thumbnail
            spriteNotFound: true,
            // default values but will be overwritten in created()
            thumbnailWidth: 240,
            thumbnailHeight: 138,
            thumbnailsPerSprite: 25,
            thumbnailInterval: 2.5,
            estimatedThumbnails: 0,
        };
    },
    computed: {
        thumbnailStyle() {
            let left = Math.min(
                this.clientMouseX - this.thumbnailWidth / 2,
                window.innerWidth - this.thumbnailWidth - this.sideButtonsWidth
            );
            let top = this.scrollstripTop - this.thumbProgressBarSpace;
            return `transform: translate(${left}px, ${top}px);`
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
            context.clearRect(0, 0, this.thumbnailCanvas.width, this.thumbnailCanvas.height);
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