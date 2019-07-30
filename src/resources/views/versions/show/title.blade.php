<div class="col-md-12 clearfix" id="label-tree-version-title">
    <h2>
        @can('destroy', $version)
            <span class="pull-right">
                <button class="btn btn-default" type="button" :disabled="loading" title="Delete this label tree version" v-on:click="deleteVersion">Delete</button>
            </span>
        @endcan
        {{$tree->name}}&nbsp;@&nbsp;{{$version->name}}
        @if ($private)
            <small class="label label-default label-hollow" title="This label tree is private">Private</small>
        @endif
        @if($tree->description)
            <br><small>{{$tree->description}}</small>
        @endif
    </h2>
</div>
