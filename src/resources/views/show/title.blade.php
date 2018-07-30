<div class="col-md-12 clearfix" id="label-trees-title">
    @can('update', $tree)
        <span class="pull-right label-tree-buttons" v-if="editing" v-cloak>
            <button class="btn btn-success" title="Save changes" v-on:click="saveChanges" :disabled="loading || !isChanged"><span v-if="loading">Saving...</span><span v-else>Save</span></button>
            <button class="btn btn-default" title="Discard changes" v-on:click="discardChanges" :disabled="loading">Cancel</button>
        </span>
        <span class="pull-right label-tree-buttons" v-else>
            <button class="btn btn-default" v-on:click="startEditing" :disabled="loading">Edit</button>
            <button class="btn btn-default" v-on:click="deleteTree" :disabled="loading">Delete</button>
            <button class="btn btn-default" v-on:click="leaveTree" :disabled="loading">Leave</button>
        </span>
        <form v-if="editing" v-cloak class="form-inline label-tree-info-form" v-on:submit.prevent="saveChanges">
            <div class="form-group">
                <select class="form-control" title="Label tree visibility" v-model="visibility_id">
                    @foreach ($visibilities as $id => $name)
                        <option value="{{$id}}">{{$name}}</option>
                    @endforeach
                </select>
                <input class="form-control label-tree-name" type="text" title="Label tree name" placeholder="Name" v-model="name"/>
                <br>
                <input class="form-control input-sm label-tree-description" type="text" title="Label tree description" placeholder="Description" v-model="description"/>
                <input class="hidden" type="submit" name="submit">
            </div>
        </form>
        <h2 v-else>
            <span class="text-muted fa fa-lock" @if(!$private) v-cloak @endif aria-hidden="true" title="This label tree is private" v-if="isPrivate"></span>
            <span v-text="name">{{$tree->name}}</span>
            <span v-if="hasDescription" @if(!$tree->description) v-cloak @endif>
                <br><small v-text="description">{{$tree->description}}</small>
            </span>
        </h2>
    @else
        <h2>
            @can('create-label', $tree)
                <span class="pull-right">
                    <button class="btn btn-default" v-on:click="leaveTree" :disabled="loading">Leave</button>
                </span>
            @endcan
            @if($private)
                <span class="text-muted fa fa-lock" aria-hidden="true" title="This label tree is private"></span>
            @endif
            {{$tree->name}}
            @if($tree->description)
                <br><small>{{$tree->description}}</small>
            @endif
        </h2>
    @endcan
</div>
