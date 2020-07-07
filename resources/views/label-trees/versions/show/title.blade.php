<div class="col-md-12 clearfix" id="label-tree-version-title">
    <h2>
        <span class="pull-right">
            <a href="{{route('label-trees-create', ['upstream_label_tree' => $tree->id])}}" class="btn btn-default" title="Create a fork of this label tree" >Fork</a>
            @can('destroy', $version)
                <button class="btn btn-default" type="button" :disabled="loading" title="Delete this label tree version" v-on:click="deleteVersion">Delete</button>
            @endcan
        </span>
        {{$tree->name}}&nbsp;@&nbsp;{{$version->name}}
        @if ($private)
            <small class="label label-default label-hollow" title="This label tree is private">Private</small>
        @endif
        @if($tree->description)
            <br><small>{{$tree->description}}</small>
        @endif
    </h2>
</div>
