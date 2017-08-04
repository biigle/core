<li role="presentation" @if($type === 'label-trees') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'label-trees'])}}">Label Trees <span class="badge">{{$labelTreeResultCount}}</span></a>
</li>
