<div class="col-md-12 clearfix" id="label-tree-version-title">
    <h2>
        @can('destroy', $version)
            <span class="pull-right">
                <form action="{{url("api/v1/label-tree-versions/{$version->id}")}}" method="post" style="display: inline-block" v-on:submit="confirmDeletion">
                    <input type="hidden" name="_method" value="DELETE">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <input type="hidden" name="_redirect" value="{{ route('label-trees', $masterTree->id) }}">
                    <button class="btn btn-default" type="submit" :disabled="loading" title="Delete this label tree version">Delete</button>
                </form>
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
