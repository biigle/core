<div class="annotation-canvas" v-on:wheel="conditionalHandleScroll">
    <minimap v-if="showMinimap" :extent="extent"></minimap>
    <div class="annotation-canvas__left-indicators">
        <scale-line-indicator v-if="showScaleLine" :image="image" :areas="imagesArea" :resolution="resolution"></scale-line-indicator>
        <mouse-position-indicator v-if="showMousePosition" :position="mousePositionIC"></mouse-position-indicator>
        <zoom-level-indicator v-if="showZoomLevel" :resolution="resolution"></zoom-level-indicator>
    </div>
    <div class="annotation-canvas__right-indicators">
        <label-indicator v-if="selectedLabel" :label="selectedLabel"></label-indicator>
        <div v-show="labelbotIsOn" class="labelbot-indicator-info-box" :title="'LabelBOT is ' + labelbotState">
            <labelbot-indicator class="labelbot-indicator" :labelbot-state="labelbotState"></labelbot-indicator>
        </div>
    </div>
    <label-tooltip
        :show="showLabelTooltip"
        :position="mousePosition"
        :features="hoveredFeatures"
        ></label-tooltip>
    <measure-tooltip
        :show="showMeasureTooltip"
        :position="mousePosition"
        :image="image"
        :areas="imagesArea"
        :features="hoveredFeatures"
        ></measure-tooltip>
    <measure-tooltip
        positioning="center-left"
        :features="measureFeatures"
        :show="hasMeasureFeature"
        :position="measureFeaturePosition"
        :image="image"
        :areas="imagesArea"
        ></measure-tooltip>
    <div class="annotation-canvas__toolbar">
        <div class="btn-group" v-on:wheel.stop="handleScroll">
            <control-button
                icon="fa-step-backward"
                :title="previousButtonTitle + ' 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄'"
                :disabled="modifyInProgress"
                v-on:click="handlePrevious"
                ></control-button>
            <control-button
                icon="fa-step-forward"
                :title="nextButtonTitle + ' 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲'"
                :disabled="modifyInProgress"
                v-on:click="handleNext"
                ></control-button>
        </div>
        <div class="btn-group drawing-controls" v-if="canAdd" @cannot('add-annotation') v-cloak @endcannot>
            <control-button
                icon="icon-point"
                title="Set a point 𝗔"
                :active="isDrawingPoint"
                v-on:click="drawPoint"
                ></control-button>
            <control-button
                icon="icon-rectangle"
                title="Draw a rectangle 𝗦"
                :active="isDrawingRectangle"
                v-on:click="drawRectangle"
                ></control-button>
            <control-button
                icon="icon-circle"
                title="Draw a circle 𝗗"
                :active="isDrawingCircle"
                v-on:click="drawCircle"
                v-slot="{onActive}"
                >
                <control-button
                    icon="icon-ellipse"
                    title="Draw an ellipse 𝗦𝗵𝗶𝗳𝘁+𝗗"
                    :active="isDrawingEllipse"
                    v-on:click="drawEllipse"
                    v-on:active="onActive"
                    ></control-button>
            </control-button>
            <control-button
                icon="icon-linestring"
                title="Draw a line string 𝗙, hold 𝗦𝗵𝗶𝗳𝘁 for freehand"
                :active="isDrawingLineString"
                v-on:click="drawLineString"
                v-slot="{onActive}"
                >
                <control-button
                    icon="fa-ruler"
                    title="Measure a line string 𝗦𝗵𝗶𝗳𝘁+𝗙"
                    :active="isMeasuring"
                    v-on:click="toggleMeasuring"
                    v-on:active="onActive"
                    ></control-button>
                <control-button
                    icon="fa-check"
                    title="Convert measurement to a line string 𝗘𝗻𝘁𝗲𝗿"
                    :disabled="cantConvertMeasureFeature"
                    v-on:click="convertMeasurement"
                    v-on:active="onActive"
                    ></control-button>
            </control-button>
            <control-button
                icon="icon-polygon"
                title="Draw a polygon 𝗚, hold 𝗦𝗵𝗶𝗳𝘁 for freehand"
                :active="isDrawingPolygon"
                v-on:click="drawPolygon"
                v-slot="{onActive}"
                >
                <control-button
                    icon="fa-paint-brush"
                    title="Draw a polygon using the brush tool 𝗘"
                    :active="isUsingPolygonBrush"
                    v-on:click="togglePolygonBrush"
                    v-on:active="onActive"
                    ></control-button>
                <control-button
                    icon="fa-eraser"
                    title="Modify selected polygons using the eraser tool 𝗥"
                    :active="isUsingPolygonEraser"
                    v-on:click="togglePolygonEraser"
                    v-on:active="onActive"
                    ></control-button>
                <control-button
                    icon="fa-fill-drip"
                    title="Modify selected polygons using the fill tool 𝗧"
                    :active="isUsingPolygonFill"
                    v-on:click="togglePolygonFill"
                    v-on:active="onActive"
                    ></control-button>
                <control-button
                    v-if="crossOrigin"
                    icon="fa-magic"
                    title="The magic wand tool is not available for remote images without cross-origin resource sharing"
                    :disabled="true"
                    ></control-button>
                <control-button
                    v-else
                    icon="fa-magic"
                    title="Draw a polygon using the magic wand tool 𝗦𝗵𝗶𝗳𝘁+𝗚"
                    :active="isMagicWanding"
                    v-on:click="toggleMagicWand"
                    v-on:active="onActive"
                    ></control-button>
                @mixin('imageAnnotationPolygonTools')
            </control-button>
        </div>
        <div class="btn-group edit-controls" v-if="canModify || canDelete" @cannot('add-annotation') v-cloak @endcannot>
            <control-button
                v-if="canModify"
                icon="fa-tag"
                title="Attach the currently selected label to existing annotations 𝗟"
                :active="isAttaching"
                v-on:click="toggleAttaching"
                v-slot="{onActive}"
                >
                <control-button
                    icon="fa-sync-alt"
                    title="Swap the most recent label of an existing annotation with the currently selected one 𝗦𝗵𝗶𝗳𝘁+𝗟"
                    :active="isSwapping"
                    v-on:click="toggleSwapping"
                    v-on:active="onActive"
                    ></control-button>
            </control-button>
            <control-button
                v-if="canModify"
                icon="fa-arrows-alt"
                title="Move selected annotations 𝗠"
                :active="isTranslating"
                :disabled="modifyInProgress"
                v-on:click="toggleTranslating"
                ></control-button>
            <control-button
                v-if="hasLastCreatedAnnotation && canDelete"
                icon="fa-undo"
                title="Delete the last drawn annotation 𝗕𝗮𝗰𝗸𝘀𝗽𝗮𝗰𝗲"
                v-on:click="deleteLastCreatedAnnotation"
                ></control-button>
            <control-button
                v-else-if="canDelete"
                icon="fa-trash"
                title="Delete selected annotations 𝗗𝗲𝗹"
                :disabled="modifyInProgress||!hasSelectedAnnotations"
                v-on:click="deleteSelectedAnnotations"
                ></control-button>
        </div>

        <div class="btn-group drawing-controls" v-if="!canAdd && image" @cannot('add-annotation') v-cloak @endcannot>
            <control-button
                icon="fa-ruler"
                title="Measure a line string  𝗦𝗵𝗶𝗳𝘁+𝗙"
                :active="isMeasuring"
                v-on:click="toggleMeasuring"
                ></control-button>
        </div>
    </div>
    <div v-for="(overlay, key) in labelbotOverlays" v-show="!overlay.available" :key="key" :ref="'labelbot-popup-' + key">
        <labelbot-popup :popup-key="key" :focused-popup-key="focusedPopupKey" :labelbot-labels="overlay.labels" @update-labelbot-label="updateLabelbotLabel" @delete-labelbot-labels="deleteLabelbotLabels" @change-labelbot-focused-popup="handleLabelbotPopupFocused" @delete-labelbot-labels-annotation="handleDeleteLabelbotLabelsAnnotation"></labelbot-popup>
    </div>
</div>
