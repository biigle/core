<div class="clearfix" id="label-tree-version-title">
    <span class="pull-right label-tree-buttons">
        @include('label-trees.versions.show.version-button')
        <dropdown menu-right>
            <button class="btn btn-default dropdown-toggle"><i class="fa fa-cog"></i> <span class="caret"></span></button>
            <template slot="dropdown">
                <li>
                    <a href="{{route('label-trees-create', ['upstream_label_tree' => $tree->id])}}" title="Create a fork of this label tree" >Fork</a>
                </li>
                @mixin('labelTreesShowDropdown')
                @can('destroy', $version)
                    <li role="separator" class="divider"></li>
                    <li :class="disabledClass">
                        <a title="Delete this label tree version" v-on:click.prevent="deleteVersion" href="#">Delete</a>
                    </li>
                @endcan
            </template>
        </dropdown>
    </span>
    <h2>
        {{$tree->name}}&nbsp;@&nbsp;{{$version->name}}
        @if ($private)
            <small class="label label-default label-hollow" title="This label tree is private">Private</small>
        @endif
        @if($tree->description)
            <br><small>{{$tree->description}}</small>
        @endif
    </h2>
</div>
