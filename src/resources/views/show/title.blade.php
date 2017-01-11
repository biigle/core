<div class="col-md-12 clearfix" data-ng-controller="LabelTreeController">
    @can('update', $tree)
        <div data-ng-switch="isEditing()">
            <span class="pull-right ng-cloak" data-ng-switch-when="true">
                <span data-ng-switch="isSaving()">
                    <button class="btn btn-success ng-cloak" title="Save changes" data-ng-switch-when="true" disabled="">Saving...</button>
                    <button class="btn btn-success" title="Save changes" data-ng-click="saveChanges()" data-ng-switch-default="">Save</button>
                </span>
                <button class="btn btn-default" title="Discard changes" data-ng-click="discardChanges()" data-ng-disabled="isSaving()">Cancel</button>
            </span>
            <span class="pull-right" data-ng-switch-default="">
                <button class="btn btn-default" data-ng-click="toggleEditing()">Edit</button>
                <button class="btn btn-default" data-ng-click="deleteTree()">Delete</button>
                <button class="btn btn-default" data-ng-click="leaveTree(getVisibilityId() === {{\Biigle\Visibility::$private->id}})">Leave</button>
            </span>
            <form class="ng-cloak form-inline label-tree-info-form" data-ng-switch-when="true" data-ng-submit="saveChanges()">
                <div class="form-group">
                    <select class="form-control" title="Label tree visibility" data-ng-model="labelTreeInfo.visibility_id">
                        @foreach ($visibilities as $id => $name)
                            <option value="{{$id}}">{{$name}}</option>
                        @endforeach
                    </select>
                    <input class="form-control label-tree-name" type="text" title="Label tree name" placeholder"Name" data-ng-model="labelTreeInfo.name"/>
                    <br>
                    <input class="form-control input-sm label-tree-description" type="text" title="Label tree description" placeholder="Description" data-ng-model="labelTreeInfo.description"/>
                    <input class="hidden" type="submit" name="submit">
                </div>
            </form>
            <h2 data-ng-switch-default="">
                <small class="text-muted glyphicon glyphicon-lock @if(!$private) ng-hide @endif" aria-hidden="true" title="This label tree is private" data-ng-show="getVisibilityId() === {{\Biigle\Visibility::$private->id}}"></small>
                <span data-ng-bind="getName()">{{$tree->name}}</span>
                <span class="@if(!$tree->description) hidden @endif" data-ng-if="getDescription()">
                    <br><small data-ng-bind="getDescription()">{{$tree->description}}</small>
                </span>
            </h2>
        </div>
    @else
        <h2>
            @can('create-label', $tree)
                <span class="pull-right">
                    <button class="btn btn-default" data-ng-click="leaveTree(getVisibilityId() === {{\Biigle\Visibility::$private->id}})">Leave</button>
                </span>
            @endcan
            @if($private)
                <small class="text-muted glyphicon glyphicon-lock" aria-hidden="true" title="This label tree is private"></small>
            @endif
            {{$tree->name}}
            @if($tree->description)
                <br><small>{{$tree->description}}</small>
            @endif
        </h2>
    @endcan
</div>
