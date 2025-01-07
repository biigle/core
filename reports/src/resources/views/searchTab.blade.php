<li role="presentation" @if($type === 'reports') class="active"@endif>
    <a href="{{route('search', ['q' => $query, 't' => 'reports'])}}">Reports <span class="badge">{{readable_number($reportResultCount)}}</span></a>
</li>
