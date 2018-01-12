<div class="annotation-canvas">
    <minimap v-if="showMinimap" :extent="extent" :projection="projection" inline-template>
        <div class="annotation-canvas__minimap"></div>
    </minimap>
    <div class="annotation-canvas__left-indicators">
        <mouse-position-indicator v-if="showMousePosition" :position="mousePosition" inline-template>
            <div class="mouse-position-indicator" title="Mouse position on the image" v-text="positionText"></div>
        </mouse-position-indicator>
        <zoom-level-indicator v-if="showZoomLevel" :resolution="resolution" inline-template>
            <div class="zoom-level-indicator" title="Zoom level of the viewport" v-text="zoomLevelText"></div>
        </zoom-level-indicator>
    </div>
    <div class="annotation-canvas__right-indicators">
        <label-indicator v-if="selectedLabel" :label="selectedLabel" inline-template>
            <div class="label-indicator" title="Currently selected label" v-text="label.name"></div>
        </label-indicator>
    </div>
    <annotation-tooltip :annotations="hoveredAnnotations" :position="mouseDomPosition" inline-template>
        <div class="annotation-tooltip" :style="styleObject" :class="classObject">
            <ul class="annotation-tooltip__annotations">
                <li v-for="annotation in annotations">
                    <ul class="annotation-tooltip__labels">
                        <li v-for="label in annotation.labels" v-text="label.label.name"></li>
                    </ul>
                </li>
            </ul>
        </div>
    </annotation-tooltip>
    <div class="annotation-canvas__toolbar">
        <div class="btn-group">
            <control-button icon="fa-step-backward" :title="previousButtonTitle + ' 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄'" v-on:click="handlePrevious"></control-button>
            <control-button icon="fa-step-forward" :title="nextButtonTitle + ' 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲'" v-on:click="handleNext"></control-button>
        </div>
        @can('add-annotation', $image)
            <div class="btn-group drawing-controls">
                <control-button icon="icon-point" title="Set a point 𝗔" :active="isDrawingPoint" v-on:click="drawPoint"></control-button>
                <control-button icon="icon-rectangle" title="Draw a rectangle 𝗦" :active="isDrawingRectangle" v-on:click="drawRectangle"></control-button>
                <control-button icon="icon-circle" title="Draw a circle 𝗗" :active="isDrawingCircle" v-on:click="drawCircle">
                    <control-button icon="icon-ellipse" title="Draw an ellipse  𝗦𝗵𝗶𝗳𝘁+𝗗" :active="isDrawingEllipse" v-on:click="drawEllipse"></control-button>
                </control-button>
                <control-button icon="icon-linestring" title="Draw a line string 𝗙, hold 𝗦𝗵𝗶𝗳𝘁 for freehand" :active="isDrawingLineString" v-on:click="drawLineString"></control-button>
                <control-button icon="icon-polygon" title="Draw a polygon 𝗚, hold 𝗦𝗵𝗶𝗳𝘁 for freehand" :active="isDrawingPolygon" v-on:click="drawPolygon">
                    @unless($volume->isRemote())
                        <control-button icon="fa-magic" title="Draw a polygon using the magic wand tool 𝗦𝗵𝗶𝗳𝘁+𝗚" :active="isMagicWanding" v-on:click="toggleMagicWand"></control-button>
                    @else
                        <control-button icon="fa-magic" title="The magic wand tool is not available for remote volumes" :disabled="true"></control-button>
                    @endunless
                </control-button>
            </div>
            <div class="btn-group edit-controls">
                <control-button icon="fa-tag" title="Attach the currently selected label to existing annotations 𝗟" :active="isAttaching" v-on:click="toggleAttaching"></control-button>
                <control-button icon="fa-arrows" title="Move selected annotations 𝗠" :active="isTranslating" v-on:click="toggleTranslating"></control-button>
                <control-button v-if="hasLastCreatedAnnotation" icon="fa-undo" title="Delete the last drawn annotation 𝗕𝗮𝗰𝗸𝘀𝗽𝗮𝗰𝗲" v-on:click="deleteLastCreatedAnnotation"></control-button>
                <control-button v-else icon="fa-trash-o" title="Delete selected annotations 𝗗𝗲𝗹" :disabled="!hasSelectedAnnotations" v-on:click="deleteSelectedAnnotations"></control-button>
            </div>
        @endcan
    </div>
</div>
