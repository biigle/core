<div class="btn-group drawing-controls" data-ng-controller="DrawingControlsController" data-select-category="Please select a label first.">
    <button class="btn btn-sm" data-ng-click="selectShape('Point')" data-ng-class="{active:(selectedShape()=='Point')}" title="Set a point 𝗔"><span class="icon icon-white icon-point" aria-hidden="true"></span></button>
    <button class="btn btn-sm" data-ng-click="selectShape('Rectangle')" data-ng-class="{active:(selectedShape()=='Rectangle')}" title="Draw a rectangle 𝗦"><span class="icon icon-white icon-rectangle" aria-hidden="true"></span></button>
    <button class="btn btn-sm" data-ng-click="selectShape('Circle')" data-ng-class="{active:(selectedShape()=='Circle')}" title="Draw a circle 𝗗"><span class="icon icon-white icon-circle" aria-hidden="true"></span></button>
    <button class="btn btn-sm" data-ng-click="selectShape('LineString')" data-ng-class="{active:(selectedShape()=='LineString')}" title="Draw a line string 𝗙, hold 𝗦𝗵𝗶𝗳𝘁 for freehand"><span class="icon icon-white icon-linestring" aria-hidden="true"></span></button>
    <button class="btn btn-sm" data-ng-click="selectShape('Polygon')" data-ng-class="{active:(selectedShape()=='Polygon')}" title="Draw a polygon 𝗚, hold 𝗦𝗵𝗶𝗳𝘁 for freehand"><span class="icon icon-white icon-polygon" aria-hidden="true"></span></button>
</div>
