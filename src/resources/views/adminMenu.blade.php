@if (!empty(config('sync.allowed_exports')))
<li role="presentation"@if(Request::is('admin/export')) class="active" @endif><a href="{{route('admin-export')}}">Export</a></li>
@endif
<li role="presentation"@if(Request::is('admin/import')) class="active" @endif><a href="{{route('admin-import')}}">Import</a></li>
