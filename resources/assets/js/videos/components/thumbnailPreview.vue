<template>
    <div 
        class="thumbnail-preview" 
        ref="thumbnailPreview" 
        :style="thumbnailStyle"
        >
        <canvas 
            v-cloak
            class="thumbnail-canvas" 
            ref="thumbnailCanvas"
            v-show="!spriteNotFound">
        </canvas>
        <canvas 
            v-cloak
            class="thumbnail-canvas" 
            ref="hovertimeCanvas">
        </canvas>
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
        },
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
            fontSize: 14.5,
            fontSizeInPx: 11,
            hovertimeCanvas: null,
            hoverTimeBarHeight: 20,
            hoverTimeBarWidth: 120,
            preloadedSprites: [],
            lastSpriteIdx: 0,
        };
    },
    computed: {
        thumbnailStyle() {
            let width = this.spriteNotFound ? this.hoverTimeBarWidth : this.canvasWidth;
            let left = Math.min(
                this.clientMouseX - width / 2,
                window.innerWidth - width - this.sideButtonsWidth
            );
            let top = this.scrollstripTop - this.thumbProgressBarSpace;
            return {
                transform: `translate(${left}px, -100%)`,
                top: `${top}px`,
            };
        },
        spriteGridInfo() {
            let nbrThumbnailsOnSprite = this.estimatedThumbnails - this.spriteIdx * this.thumbnailsPerSprite;
            nbrThumbnailsOnSprite = nbrThumbnailsOnSprite > this.thumbnailsPerSprite ? this.thumbnailsPerSprite : nbrThumbnailsOnSprite;
            let nbrCols = Math.sqrt(this.thumbnailsPerSprite);
            let nbrRows = Math.ceil(nbrThumbnailsOnSprite / nbrCols);
            return [nbrCols, nbrRows];
        },
        hoverTimeText() {
            return Vue.filter('videoTime')(this.hoverTime);
        },
        hoverTimeStyle() {
            return { 'font': `bold ${this.fontSize}px Sans-Serif`, 'color': '#cccccc' };
        },
        xtext() {
            return this.canvasWidth / 2;
        },
        ytext() {
            return this.canvasHeight + this.fontSizeInPx + (this.hoverTimeBarHeight - this.fontSizeInPx) / 2;
        },
    },
    methods: {
        preloadPreviousSprite() {
            let prevIdx = this.spriteIdx - 1;
            if (this.spriteIdx === 0 || prevIdx in this.preloadedSprites) {
                return;
            }
            let prevSpriteUrl = this.spritesFolderPath + "sprite_" + prevIdx + ".webp";
            let prevImg = new Image();
            prevImg.src = prevSpriteUrl;
            this.preloadedSprites[prevIdx] = prevImg;
        },
        preloadNextSprite() {
            let nextIdx = this.spriteIdx + 1;
            if (this.spriteIdx === this.lastSpriteIdx || nextIdx in this.preloadedSprites) {
                return;
            }
            let nextSpriteUrl = this.spritesFolderPath + "sprite_" + nextIdx + ".webp";
            let nextImg = new Image();
            nextImg.src = nextSpriteUrl;
            this.preloadedSprites[nextIdx] = nextImg;
        },
        updateSprite() {
            let SpriteUrl = this.spritesFolderPath + "sprite_" + this.spriteIdx + ".webp";

            if (!this.triedUrls[SpriteUrl]) {
                this.triedUrls[SpriteUrl] = 0
            }
            if (this.triedUrls[SpriteUrl] < this.retryAttempts) {
                if (this.spriteIdx in this.preloadedSprites) {
                    let onloadFunc = this.sprite.onload;
                    this.sprite = this.preloadedSprites[this.spriteIdx];
                    onloadFunc.call(this.sprite, new Event('load'));
                    this.sprite.onload = onloadFunc;
                } else {
                    this.sprite.src = SpriteUrl;
                    this.preloadedSprites[this.spriteIdx] = this.sprite;
                }
            } else {
                this.spriteNotFound = true;
            }

            this.preloadPreviousSprite();
            this.preloadNextSprite();
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
        
            // Call viewHoverTimeBar here to prevent flickering hover time bar
            this.viewHoverTimeBar();
        },
        updateThumbnailInterval() {
            let maxThumbnails = biigle.$require('videos.spritesMaxThumbnails');
            let minThumbnails = biigle.$require('videos.spritesMinThumbnails');
            let defaultThumbnailInterval = biigle.$require('videos.spritesThumbnailInterval');
            this.durationRounded = Math.floor(this.duration * 10) / 10;
            this.estimatedThumbnails = Math.floor(this.durationRounded / defaultThumbnailInterval);
            this.lastSpriteIdx = Math.floor(this.estimatedThumbnails / this.thumbnailsPerSprite);
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
        viewHoverTimeBar() {
            // draw the hover time bar
            let ctx = this.hovertimeCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.hoverTimeBarWidth, this.hoverTimeBarHeight);
            ctx.font = this.hoverTimeStyle['font'];
            ctx.fillStyle = this.hoverTimeStyle['color']
            ctx.textAlign = 'center';
            let ytext = this.hoverTimeBarHeight - (this.hoverTimeBarHeight - this.fontSizeInPx) / 2
            ctx.fillText(this.hoverTimeText, this.hoverTimeBarWidth / 2, ytext);
        },
        initDimensions() {
            let nbrCols = this.spriteGridInfo[0];
            let nbrRows = this.spriteGridInfo[1];
            this.thumbnailWidth = this.sprite.width / nbrCols;
            this.thumbnailHeight = this.sprite.height / nbrRows;
            this.canvasWidth = Math.ceil(this.thumbnailWidth / 2);
            this.canvasHeight = Math.ceil(this.thumbnailHeight / 2);

            // If thumbnail is too narrow, enlarge it to 120px so that the hover time fits
            if (this.canvasWidth < this.hoverTimeBarWidth) {
                let ratio = this.canvasHeight / this.canvasWidth;
                this.canvasWidth = this.hoverTimeBarWidth
                this.canvasHeight = this.canvasWidth * ratio;
            }

            this.thumbnailCanvas.width = this.canvasWidth;
            this.thumbnailCanvas.height = this.canvasHeight;

            // Update hover time canvas width if thumbnail canvas width is larger
            this.hoverTimeBarWidth = this.canvasWidth > this.hoverTimeBarWidth ? this.canvasWidth : this.hoverTimeBarWidth;
            this.hovertimeCanvas.width = this.hoverTimeBarWidth;
            this.hovertimeCanvas.height = this.hoverTimeBarHeight;
        },
    },
    watch: {
        hoverTime() {
            let spriteIdx = Math.floor(this.hoverTime / (this.thumbnailInterval * this.thumbnailsPerSprite));
            if (this.spriteIdx !== spriteIdx){
                this.spriteIdx = spriteIdx;
                this.updateSprite();
            }

            if (this.spriteNotFound) {
                this.viewHoverTimeBar();
            } else {
                this.viewThumbnailPreview();
            }
        },
    },
    created() {
        this.setSpritesFolderpath();
        this.updateThumbnailInterval();
        this.thumbnailSizes = biigle.$require('videos.thumbnailSizes');
        this.thumbnailsPerSprite = biigle.$require('videos.spritesThumbnailsPerSprite');

        this.sprite.onload = () => {
            this.spriteNotFound = false;
            this.initDimensions();
            // Call viewThumbnailPreview here again to prevent glitching thumbnails
            this.viewThumbnailPreview();
        }
        this.sprite.onerror = () => {
            this.spriteNotFound = true;
            if (this.sprite.src in this.triedUrls) {
                this.triedUrls[this.sprite.src]++;
            }
            this.viewHoverTimeBar();
        }
    },
    mounted() {
        this.thumbnailPreview = this.$refs.thumbnailPreview;
        this.thumbnailCanvas = this.$refs.thumbnailCanvas;
        this.hovertimeCanvas = this.$refs.hovertimeCanvas;
        this.hovertimeCanvas.width = this.hoverTimeBarWidth;
        this.hovertimeCanvas.height = this.hoverTimeBarHeight;

        this.updateSprite();
    }
};
</script>
