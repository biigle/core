<div class="btn-group edit-controls" data-ng-controller="EditControlsController">
    <button class="btn" title="Move selected annotations 𝗠" data-ng-click="moveSelectedAnnotations()" data-ng-class="{active:isMoving()}"><span class="glyphicon glyphicon-move" aria-hidden="true"></span></button>
    <button class="btn" title="Delete the last drawn annotation 𝗕𝗮𝗰𝗸𝘀𝗽𝗮𝗰𝗲" data-ng-click="deleteLastDrawnAnnotation()" data-ng-disabled="!canDeleteLastAnnotation()" disabled=""><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span></button>
    <button class="btn" title="Delete selected annotations 𝗗𝗲𝗹" data-ng-click="deleteSelectedAnnotations()" data-ng-disabled="!hasSelectedAnnotations()" disabled=""><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
</div>
