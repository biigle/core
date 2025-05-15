<template>
    <div class="thumbnail-preview" ref="thumbnailPreview" :style="thumbnailStyle">
        <canvas v-if="showThumbnails" class="thumbnail-canvas" ref="thumbnailCanvas" v-show="hasAnySprite">
        </canvas>
        <canvas class="thumbnail-canvas" ref="hovertimeCanvas">
        </canvas>
    </div>
</template>

<script>
import videoTime from '@/videos/filters/videoTime';

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
        videoUuid: {
            type: String,
            required: true,
        },
        showThumbnails: {
            type: Boolean,
            default: true,
        }
    },
    data() {
        return {
            thumbnailPreview: null,
            thumbnailCanvas: null,
            sprite: new Image(),
            spriteIdx: 0,
            thumbnailIndex: -1,
            thumbProgressBarSpace: 10,
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
            hovertimeCanvas: null,
            hoverTimeBarHeightDefault: 20,
            hoverTimeBarWidthDefault: 120,
            hoverTimeBarWidth: 120,
            preloadedSprites: {},
            lastSpriteIdx: 0,
            hasAnySprite: false,
        };
    },
    computed: {
        thumbnailStyle() {
            let width = this.spriteNotFound || !this.showThumbnails ? this.hoverTimeBarWidth : this.canvasWidth;
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
            return videoTime(this.hoverTime);
        },
        hoverTimeStyle() {
            return { 'font': `bold ${this.fontSize}px Sans-Serif`, 'color': '#cccccc' };
        },
        fontSizeInPx() {
            return this.fontSize * 0.75;
        },
    },
    methods: {
        preloadPreviousSprite() {
            let prevIdx = this.spriteIdx - 1;
            let prevSpriteUrl = this.getSpriteUrl(prevIdx);

            if (this.spriteIdx === 0
                || prevIdx in this.preloadedSprites
                || this.triedUrls[prevSpriteUrl] >= this.retryAttempts) {
                return;
            }

            if (!this.triedUrls[prevSpriteUrl]) {
                this.triedUrls[prevSpriteUrl] = 0
            }
            let prevImg = new Image();
            this.preloadedSprites[prevSpriteUrl] = prevImg;

            prevImg.onerror = () => {
                if (prevSpriteUrl in this.triedUrls) {
                    this.triedUrls[prevSpriteUrl]++;
                }
            }
            prevImg.src = prevSpriteUrl;
        },
        preloadNextSprite() {
            let nextIdx = this.spriteIdx + 1;
            let nextSpriteUrl = this.getSpriteUrl(nextIdx);

            if (this.spriteIdx === this.lastSpriteIdx
                || nextIdx in this.preloadedSprites
                || this.triedUrls[nextSpriteUrl] >= this.retryAttempts) {
                return;
            }
            if (!this.triedUrls[nextSpriteUrl]) {
                this.triedUrls[nextSpriteUrl] = 0
            }
            let nextImg = new Image();
            this.preloadedSprites[nextSpriteUrl] = nextImg;

            nextImg.onerror = () => {
                if (nextSpriteUrl in this.triedUrls) {
                    this.triedUrls[nextSpriteUrl]++;
                }
            }
            nextImg.src = nextSpriteUrl;
        },
        removeOldSprites() {
            let preloadedSprites = {}
            for (let i = this.spriteIdx - 1; i < this.spriteIdx + 2; i++) {
                if (i !== 0 || i !== this.lastSpriteIdx) {
                    let url = this.getSpriteUrl(i);
                    let img = this.preloadedSprites[url];
                    if (img) {
                        preloadedSprites[url] = img;
                    }
                }
            }
            this.preloadedSprites = preloadedSprites;
        },
        updateSprite() {
            this.spriteIdx = Math.floor(this.hoverTime / (this.thumbnailInterval * this.thumbnailsPerSprite));
            let spriteUrl = this.getSpriteUrl(this.spriteIdx);

            if (!this.triedUrls[spriteUrl]) {
                this.triedUrls[spriteUrl] = 0
            }

            let preloadedSprite = this.preloadedSprites[spriteUrl];

            if (preloadedSprite && this.finishedLoading(preloadedSprite) && this.triedUrls[spriteUrl] < this.retryAttempts) {
                let onloadFunc = this.sprite.onload;
                let onerrFunc = this.sprite.onerror;
                this.sprite = preloadedSprite;
                onloadFunc.call(this.sprite, new Event('load'));
                this.sprite.onload = onloadFunc;
                this.sprite.onerror = onerrFunc;
            } else if (!preloadedSprite && this.triedUrls[spriteUrl] < this.retryAttempts) {
                this.sprite.src = spriteUrl;
            } else {
                this.spriteNotFound = true;
            }

            this.preloadPreviousSprite();
            this.preloadNextSprite();
            this.removeOldSprites();
        },
        getSpriteUrl(idx) {
            return this.spritesFolderPath + "sprite_" + idx + ".webp";
        },
        viewThumbnailPreview() {
            this.hasAnySprite = true;
            // calculate the current row and column of the sprite
            let thumbnailIndex = Math.floor(this.hoverTime / this.thumbnailInterval) % this.thumbnailsPerSprite;
            if (this.hoverTime >= this.durationRounded) {
                thumbnailIndex = thumbnailIndex === 0 ? this.thumbnailsPerSprite - 1 : this.estimatedThumbnails - 1;
            }

            // Skip redrawing the same thumbnail than before.
            if (this.thumbnailIndex === thumbnailIndex) {
                return;
            }
            this.thumbnailIndex = thumbnailIndex;

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
            let thumbUri = biigle.$require('videos.thumbUri');
            this.spritesFolderPath = thumbUri.replace(':uuid', transformUuid(this.videoUuid) + '/').replace('.jpg', '');
        },
        viewHoverTimeBar() {            
            // Update hover time canvas width if thumbnail canvas width is larger
            this.hoverTimeBarWidth = this.showThumbnails && this.canvasWidth > this.hoverTimeBarWidthDefault ? this.canvasWidth : this.hoverTimeBarWidthDefault;
            this.hovertimeCanvas.width = this.hoverTimeBarWidth;

            // draw the hover time bar
            let ctx = this.hovertimeCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.hoverTimeBarWidthDefault, this.hoverTimeBarHeightDefault);
            ctx.font = this.hoverTimeStyle['font'];
            ctx.fillStyle = this.hoverTimeStyle['color']
            ctx.textAlign = 'center';
            let ytext = this.hoverTimeBarHeightDefault - (this.hoverTimeBarHeightDefault - this.fontSizeInPx) / 2
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
            if (this.canvasWidth < this.hoverTimeBarWidthDefault) {
                let ratio = this.canvasHeight / this.canvasWidth;
                this.canvasWidth = this.hoverTimeBarWidthDefault
                this.canvasHeight = this.canvasWidth * ratio;
            }

            this.hovertimeCanvas.height = this.hoverTimeBarHeightDefault;
            this.thumbnailCanvas.width = this.canvasWidth;
            this.thumbnailCanvas.height = this.canvasHeight;
        },
        finishedLoading(sprite) {
            if (!sprite) {
                return false;
            }
            return sprite.complete && sprite.naturalWidth && sprite.naturalWidth !== 0
        }
    },
    watch: {
        hoverTime() {
            if (this.hoverTime === 0) {
                return;
            }

            if (this.showThumbnails) {
                let spriteIdx = Math.floor(this.hoverTime / (this.thumbnailInterval * this.thumbnailsPerSprite));
                if (this.spriteIdx != spriteIdx) {
                    this.updateSprite();
                }
                if (!this.spriteNotFound) {
                    this.viewThumbnailPreview();
                }
            }
            this.viewHoverTimeBar();
        },
        showThumbnails() {
            if (this.showThumbnails) {
                // Ensures to display the canvas correctly after using recreating it
                this.$nextTick(() => {
                    this.thumbnailCanvas = this.$refs.thumbnailCanvas;
                    this.initDimensions();
                });
            }
        },
    },
    created() {
        this.setSpritesFolderpath();
        this.updateThumbnailInterval();
        this.thumbnailsPerSprite = biigle.$require('videos.spritesThumbnailsPerSprite');

        this.sprite.onload = () => {
            this.spriteNotFound = false;
            this.preloadedSprites[this.sprite.src] = this.sprite;
            if (this.showThumbnails) {
                this.initDimensions();
                this.viewThumbnailPreview();
            }
            this.viewHoverTimeBar();
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
        this.thumbnailCanvas = this.showThumbnails ? this.$refs.thumbnailCanvas : null;
        this.hovertimeCanvas = this.$refs.hovertimeCanvas;
        this.hovertimeCanvas.width = this.hoverTimeBarWidthDefault;
        this.hovertimeCanvas.height = this.hoverTimeBarHeightDefault;

        this.spriteIdx = Math.floor(this.hoverTime / (this.thumbnailInterval * this.thumbnailsPerSprite));

        this.updateSprite();
        this.viewHoverTimeBar();
    }
};
</script>
