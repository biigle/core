<div class="annotation-canvas" v-on:wheel="conditionalHandleScroll">
    <minimap v-if="showMinimap" :extent="extent"></minimap>
    <div class="annotation-canvas__left-indicators">
        <scale-line-indicator v-if="showScaleLine" :image="image" :areas="imagesArea" :resolution="resolution" inline-template>
            <div class="scale-line-indicator" title="Scale">
                <span class="scale-line-indicator__line" :style="styleObject" v-text="text"></span>
            </div>
        </scale-line-indicator>
        <mouse-position-indicator v-if="showMousePosition" :position="mousePositionIC"></mouse-position-indicator>
        <zoom-level-indicator v-if="showZoomLevel" :resolution="resolution" inline-template>
            <div class="zoom-level-indicator" title="Zoom level of the viewport" v-text="zoomLevelText"></div>
        </zoom-level-indicator>
    </div>
    <div class="annotation-canvas__right-indicators">
        <label-indicator v-if="selectedLabel" :label="selectedLabel" inline-template>
            <div class="label-indicator" title="Currently selected label" v-text="label.name"></div>
        </label-indicator>
        <div v-show="labelbotIsOn" class="labelbot-indicator-info-box" :title="'LabelBOT is ' + labelbotState">
            <labelbot-indicator class="labelbot-indicator" :labelbot-state="labelbotState"></labelbot-indicator>
        </div>
    </div>
    <label-tooltip watch="hoverFeatures" :show="showLabelTooltip" :position="mousePosition"></label-tooltip>
    <measure-tooltip watch="hoverFeatures" :show="showMeasureTooltip" :position="mousePosition" :image="image" :areas="imagesArea"></measure-tooltip>
    <measure-tooltip watch="changeMeasureFeature" :show="hasMeasureFeature" :position="measureFeaturePosition" positioning="center-left" :image="image" :areas="imagesArea"></measure-tooltip>
    <div class="annotation-canvas__toolbar">
        <div class="btn-group" v-on:wheel.stop="handleScroll">
            <control-button icon="fa-step-backward" :title="previousButtonTitle + ' 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄'" v-on:click="handlePrevious" :disabled="modifyInProgress"></control-button>
            <control-button icon="fa-step-forward" :title="nextButtonTitle + ' 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲'" v-on:click="handleNext" :disabled="modifyInProgress"></control-button>
        </div>
            <div class="btn-group drawing-controls" v-if="canAdd" @cannot('add-annotation') v-cloak @endcannot>
                <control-button icon="icon-point" title="Set a point 𝗔" :active="isDrawingPoint" v-on:click="drawPoint"></control-button>
                <control-button icon="icon-rectangle" title="Draw a rectangle 𝗦" :active="isDrawingRectangle" v-on:click="drawRectangle"></control-button>
                <control-button icon="icon-circle" title="Draw a circle 𝗗" :active="isDrawingCircle" v-on:click="drawCircle">
                    <control-button icon="icon-ellipse" title="Draw an ellipse  𝗦𝗵𝗶𝗳𝘁+𝗗" :active="isDrawingEllipse" v-on:click="drawEllipse"></control-button>
                </control-button>
                <control-button icon="icon-linestring" title="Draw a line string 𝗙, hold 𝗦𝗵𝗶𝗳𝘁 for freehand" :active="isDrawingLineString" v-on:click="drawLineString">
                    <control-button icon="fa-ruler" title="Measure a line string  𝗦𝗵𝗶𝗳𝘁+𝗙" :active="isMeasuring" v-on:click="toggleMeasuring"></control-button>
                    <control-button icon="fa-check" title="Convert measurement to a line string 𝗘𝗻𝘁𝗲𝗿" :disabled="cantConvertMeasureFeature" v-on:click="convertMeasurement"></control-button>
                </control-button>
                <control-button icon="icon-polygon" title="Draw a polygon 𝗚, hold 𝗦𝗵𝗶𝗳𝘁 for freehand" :active="isDrawingPolygon" v-on:click="drawPolygon">
                    <control-button v-cloak icon="fa-paint-brush" title="Draw a polygon using the brush tool 𝗘" :active="isUsingPolygonBrush" v-on:click="togglePolygonBrush"></control-button>
                    <control-button v-cloak icon="fa-eraser" title="Modify selected polygons using the eraser tool 𝗥" :active="isUsingPolygonEraser" v-on:click="togglePolygonEraser"></control-button>
                    <control-button v-cloak icon="fa-fill-drip" title="Modify selected polygons using the fill tool 𝗧" :active="isUsingPolygonFill" v-on:click="togglePolygonFill"></control-button>
                    <control-button v-if="crossOrigin" icon="fa-magic" title="The magic wand tool is not available for remote images without cross-origin resource sharing" :disabled="true"></control-button>
                    <control-button v-else v-cloak icon="fa-magic" title="Draw a polygon using the magic wand tool 𝗦𝗵𝗶𝗳𝘁+𝗚" :active="isMagicWanding" v-on:click="toggleMagicWand"></control-button>
                    @mixin('imageAnnotationPolygonTools')
                </control-button>
            </div>
            <div class="btn-group edit-controls" v-if="canModify || canDelete" @cannot('add-annotation') v-cloak @endcannot>
                <control-button v-if="canModify" icon="fa-tag" title="Attach the currently selected label to existing annotations 𝗟" :active="isAttaching" v-on:click="toggleAttaching">
                    <control-button icon="fa-sync-alt" title="Swap the most recent label of an existing annotation with the currently selected one 𝗦𝗵𝗶𝗳𝘁+𝗟" :active="isSwapping" v-on:click="toggleSwapping"></control-button>
                </control-button>
                <control-button v-if="canModify" icon="fa-arrows-alt" title="Move selected annotations 𝗠" :active="isTranslating" v-on:click="toggleTranslating" :disabled="modifyInProgress"></control-button>
                <control-button v-if="hasLastCreatedAnnotation && canDelete" icon="fa-undo" title="Delete the last drawn annotation 𝗕𝗮𝗰𝗸𝘀𝗽𝗮𝗰𝗲" v-on:click="deleteLastCreatedAnnotation"></control-button>
                <control-button v-else-if="canDelete" icon="fa-trash" title="Delete selected annotations 𝗗𝗲𝗹" :disabled="modifyInProgress||!hasSelectedAnnotations" v-on:click="deleteSelectedAnnotations"></control-button>
            </div>

            <div class="btn-group drawing-controls" v-if="!canAdd && image" @cannot('add-annotation') v-cloak @endcannot>
                <control-button icon="fa-ruler" title="Measure a line string  𝗦𝗵𝗶𝗳𝘁+𝗙" :active="isMeasuring" v-on:click="toggleMeasuring"></control-button>
            </div>
    </div>
    <div v-for="(overlay, key) in labelbotOverlays" v-show="!overlay.available" :key="key" :ref="'labelbot-popup-' + key" @click="handleLabelbotPopupClick(key)">
        <labelbot-popup :popup-key="key" :labelbot-labels="overlay.labels" @update-labelbot-label="updateLabelbotLabel" @delete-labelbot-labels="deleteLabelbotLabels"></labelbot-popup>
    </div>
</div>
