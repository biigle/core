@can('create', [Biigle\LabelTreeVersion::class, $tree])
    <span class="dropdown dropdown-simple">
        <button type="button" class="btn btn-default">
            Version: <strong>latest</strong>
            <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="{{route('create-label-tree-versions', $tree->id)}}" title="Create a new version of this label tree"><i class="fa fa-plus"></i> new version</a></li>
            @if ($tree->versions->isNotEmpty())
                <li class="divider"></li>
                @foreach($tree->versions->sortByDesc('id') as $version)
                    <li><a href="{{route('label-tree-versions', [$tree->id, $version->id])}}" title="Show version {{$version->name}}">{{$version->name}}</a></li>
                @endforeach
            @endif
        </ul>
    </span>
@else
    @if ($tree->versions->isNotEmpty())
        <span class="dropdown dropdown-simple">
            <button type="button" class="btn btn-default">
                Version: <strong>latest</strong>
                <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
                @foreach($tree->versions->sortByDesc('id') as $version)
                    <li><a href="{{route('label-tree-versions', [$tree->id, $version->id])}}" title="Show version {{$version->name}}">{{$version->name}}</a></li>
                @endforeach
            </ul>
        </span>
    @else
        <button type="button" class="btn btn-default" disabled>
            Version: <strong>latest</strong>
        </button>
    @endif
@endcan
