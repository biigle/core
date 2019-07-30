<div class="col-md-12 clearfix" id="label-trees-title">
    @can('update', $tree)
        <span class="pull-right label-tree-buttons" v-if="editing" v-cloak>
            <button class="btn btn-success" title="Save changes" v-on:click="saveChanges" :disabled="loading || !isChanged"><span v-if="loading">Saving...</span><span v-else>Save</span></button>
            <button class="btn btn-default" title="Discard changes" v-on:click="discardChanges" :disabled="loading">Cancel</button>
        </span>
        <span class="pull-right label-tree-buttons" v-else>
            <a href="{{route('label-trees-create', ['upstream_label_tree' => $tree->id])}}" class="btn btn-default" title="Create a fork of this label tree" >Fork</a>
            <button class="btn btn-default" v-on:click="startEditing" :disabled="loading" title="Edit this label tree">Edit</button>
            <button class="btn btn-default" v-on:click="deleteTree" :disabled="loading" title="Delete this label tree">Delete</button>
            @if ($members->pluck('id')->contains($user->id))
                <button class="btn btn-default" v-on:click="leaveTree" :disabled="loading" title="Revoke your membership of this label tree">Leave</button>
            @endif
        </span>
        <form v-if="editing" v-cloak class="form-inline label-tree-info-form" v-on:submit.prevent="saveChanges">
            <div class="form-group">
                <input class="form-control label-tree-name" type="text" title="Label tree name" placeholder="Name" v-model="name"/>
                <select class="form-control" title="Label tree visibility" v-model="visibility_id">
                    @foreach ($visibilities as $id => $name)
                        <option value="{{$id}}">{{$name}}</option>
                    @endforeach
                </select>
                <br>
                <input class="form-control input-sm label-tree-description" type="text" title="Label tree description" placeholder="Description" v-model="description"/>
                <input class="hidden" type="submit" name="submit">
            </div>
        </form>
        <h2 v-else>
            <span v-text="name">{{$tree->name}}</span>
            <small class="label label-default label-hollow" @if(!$private) v-cloak @endif title="This label tree is private" v-if="isPrivate">Private</small>
            <span v-if="hasDescription" @if(!$tree->description) v-cloak @endif>
                <br><small v-text="description">{{$tree->description}}</small>
            </span>
        </h2>
    @else
        <h2>
            <span class="pull-right">
                <a href="{{route('label-trees-create', ['upstream_label_tree' => $tree->id])}}" class="btn btn-default" title="Create a fork of this label tree" >Fork</a>
                @if ($members->pluck('id')->contains($user->id))
                    <button class="btn btn-default" v-on:click="leaveTree" :disabled="loading" title="Revoke your membership of this label tree">Leave</button>
                @endif
            </span>
            {{$tree->name}}
            @if ($private)
                <small class="label label-default label-hollow" title="This label tree is private">Private</small>
            @endif
            @if ($tree->description)
                <br><small>{{$tree->description}}</small>
            @endif
        </h2>
    @endcan
</div>
