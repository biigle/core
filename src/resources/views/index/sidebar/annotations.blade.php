<div class="sidebar__annotations" data-ng-controller="AnnotationsController">
    <ul class="list-unstyled ng-cloak">
        <li data-labels-list-item="" class="labels-list-item" data-ng-repeat="(id, item) in getAnnotations()" data-ng-class="getClass()" title="List all annotations with label @{{item.label.name}}">
            <div class="cleafix list-item-title" data-ng-click="toggleOpen()">
                <span class="pull-right" data-ng-bind="item.annotations.length" title="There are @{{item.annotations.length}} annotations with this label"></span>
                <span class="list-item-color" data-ng-style="{'background-color': '#' + item.label.color}"></span> <span data-ng-bind="item.label.name"></span>
            </div>
            <ul class="annotations-list list-unstyled" data-ng-if="isSelected()">
                <li data-annotation-list-item="" class="annotation-list-item clearfix" data-ng-repeat="a in item.annotations" data-ng-class="getClass()" data-ng-click="select($event)" data-ng-dblclick="zoomTo()" title="𝗗𝗼𝘂𝗯𝗹𝗲 𝗰𝗹𝗶𝗰𝗸 to zoom to the annotation">
                    @if ($editMode)
                        <button type="button" class="close" title="Detach this label from the annotation" data-ng-if="canBeRemoved()" data-ng-click="remove($event)"><span aria-hidden="true">&times;</span></button>
                    @endif
                    <span class="icon" data-ng-class="getShapeClass()"></span> <span>@{{a.label.user ? (a.label.user.firstname + ' ' + a.label.user.lastname) : '(user deleted)'}}</span>
                </li>
            </ul>
        </li>
    </ul>
</div>
