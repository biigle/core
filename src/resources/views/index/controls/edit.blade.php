<div class="btn-group edit-controls" data-ng-controller="EditControlsController">
    <button class="btn btn-sm" title="Attach the curently selected label to existing annotations 𝗟" data-ng-click="toggleAttaching()" data-ng-class="{active:isAttaching()}"><span class="glyphicon glyphicon-tag" aria-hidden="true"></span></button>
    <button class="btn btn-sm" title="Move selected annotations 𝗠" data-ng-click="toggleMoving()" data-ng-class="{active:isMoving()}"><span class="glyphicon glyphicon-move" aria-hidden="true"></span></button>
    <button class="btn btn-sm ng-cloak" title="Delete the last drawn annotation 𝗕𝗮𝗰𝗸𝘀𝗽𝗮𝗰𝗲" data-ng-click="deleteLastDrawnAnnotation()" data-ng-if="canDeleteLastAnnotation()"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span></button>
    <button class="btn btn-sm" title="Delete selected annotations 𝗗𝗲𝗹" data-ng-click="deleteSelectedAnnotations()" data-ng-if="!canDeleteLastAnnotation()" data-ng-disabled="!hasSelectedAnnotations()" disabled=""><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
</div>
