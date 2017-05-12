<div class="annotation-canvas">
    <loader-block v-cloak :active="loading"></loader-block>
    <minimap :extent="extent" :projection="projection" inline-template>
        <div class="annotation-canvas__minimap"></div>
    </minimap>
    <label-indicator :label="selectedLabel" inline-template>
        <div class="label-indicator" title="Currently selected label" v-if="hasLabel" v-text="label.name"></div>
    </label-indicator>
    <div class="annotation-canvas__toolbar">
        <div class="btn-group">
            <control-button icon="glyphicon-step-backward" title="Previous image 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄" v-on:click="handlePreviousImage"></control-button>
            <control-button icon="glyphicon-step-forward" title="Next image 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲" v-on:click="handleNextImage"></control-button>
        </div>
        @can('add-annotation', $image)
            <div class="btn-group drawing-controls">
                <control-button icon="icon-point" title="Set a point 𝗔" :active="isDrawingPoint" v-on:click="drawPoint"></control-button>
                <control-button icon="icon-rectangle" title="Draw a rectangle 𝗦" :active="isDrawingRectangle" v-on:click="drawRectangle"></control-button>
                <control-button icon="icon-circle" title="Draw a circle 𝗗" :active="isDrawingCircle" v-on:click="drawCircle"></control-button>
                <control-button icon="icon-linestring" title="Draw a line string 𝗙, hold 𝗦𝗵𝗶𝗳𝘁 for freehand" :active="isDrawingLineString" v-on:click="drawLineString"></control-button>
                <control-button icon="icon-polygon" title="Draw a polygon 𝗚, hold 𝗦𝗵𝗶𝗳𝘁 for freehand" :active="isDrawingPolygon" v-on:click="drawPolygon"></control-button>
            </div>
            <div class="btn-group edit-controls" data-ng-controller="EditControlsController">
                <control-button icon="glyphicon-trash" title="Delete selected annotations 𝗗𝗲𝗹" :disabled="!hasSelectedAnnotations" v-on:click="emitDelete"></control-button>
                <control-button icon="glyphicon-move" title="Move selected annotations 𝗠" :active="isTranslating" v-on:click="toggleTranslate"></control-button>
                {{--<button class="btn btn-sm" title="Attach the currently selected label to existing annotations 𝗟" data-ng-click="toggleAttaching()" data-ng-class="{active:isAttaching()}"><span class="glyphicon glyphicon-tag" aria-hidden="true"></span></button>
                <button class="btn btn-sm ng-cloak" title="Delete the last drawn annotation 𝗕𝗮𝗰𝗸𝘀𝗽𝗮𝗰𝗲" data-ng-click="deleteLastDrawnAnnotation()" data-ng-if="canDeleteLastAnnotation()"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span></button>
                <button class="btn btn-sm" title="Delete selected annotations 𝗗𝗲𝗹" data-ng-click="deleteSelectedAnnotations()" data-ng-if="!canDeleteLastAnnotation()" data-ng-disabled="!hasSelectedAnnotations()" disabled=""><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>--}}
            </div>
        @endcan
    </div>
</div>
