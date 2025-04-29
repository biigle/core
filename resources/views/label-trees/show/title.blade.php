<div class="clearfix" id="label-trees-title">
    <span class="pull-right label-tree-buttons">
        @can('update', $tree)
            <span v-if="editing" v-cloak>
                <button class="btn btn-success" title="Save changes" v-on:click="saveChanges" :disabled="(loading || !isChanged) || null"><span v-if="loading">Saving...</span><span v-else>Save</span></button>
                <button class="btn btn-default" title="Discard changes" v-on:click="discardChanges" :disabled="loading || null">Cancel</button>
            </span>
        @endcan
        @include('label-trees.show.version-button')
        <dropdown menu-right>
            <button class="btn btn-default dropdown-toggle"><i class="fa fa-cog"></i> <span class="caret"></span></button>
            <template #dropdown>
                <li>
                    <a href="{{route('label-trees-merge-index', $tree->id)}}" title="Merge another label tree into this one">Merge</a>
                </li>
                <li>
                    <a href="{{route('label-trees-create', ['upstream_label_tree' => $tree->id])}}" title="Create a fork of this label tree" >Fork</a>
                </li>
                <li>
                    <a href="{{route('get-public-label-tree-export', $tree->id)}}" title="Download this label tree">Download</a>
                </li>
                @mixin('labelTreesShowDropdown')
                @if ($tree->members()->where('id', $user->id)->exists())
                    <li :class="disabledClass">
                        <a title="Revoke your membership of this label tree" v-on:click.prevent="leaveTree" href="#">Leave</a>
                    </li>
                @endif
                @can('update', $tree)
                    <li role="separator" class="divider"></li>
                    <li :class="disabledClass">
                        <a title="Edit this label tree" v-on:click.prevent="startEditing" href="#">Edit</a>
                    </li>
                    <li :class="disabledClass">
                        <a title="Delete this label tree" v-on:click.prevent="deleteTree" href="#">Delete</a>
                    </li>
                @endcan
            </template>
        </dropdown>
    </span>
    @can('update', $tree)
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
        <h2 v-else class="limit-text">
            <span v-if="false">{{$tree->name}}</span>
            <span v-text="name" v-cloak></span>
            <small class="label label-default label-hollow" @if(!$private) v-cloak @endif title="This label tree is private" v-if="isPrivate">Private</small>
            @if ($tree->description)
                <span v-if="false">
                    <br><small>{{$tree->description}}</small>
                </span>
            @endif
            <span v-if="hasDescription" v-cloak>
                <br><small v-text="description"></small>
            </span>
        </h2>
    @else
        <h2 class="limit-text">
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
