<li role="presentation" @if($type === 'exports') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'exports'])}}">Exports <span class="badge">{{readable_number($exportResultCount)}}</span></a>
</li>
