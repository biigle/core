<div class="col-md-12 clearfix" id="label-tree-version-title">
    <h2>
        @can('destroy', $version)
            <span class="pull-right">
                <button class="btn btn-default" type="button" :disabled="loading" title="Delete this label tree version" v-on:click="deleteVersion">Delete</button>
            </span>
        @endcan
        @if ($private)
            <span class="text-muted fa fa-lock" aria-hidden="true" title="This label tree is private"></span>
        @endif
        {{$tree->name}}&nbsp;@&nbsp;{{$version->name}}
        @if($tree->description)
            <br><small>{{$tree->description}}</small>
        @endif
    </h2>
</div>
