@extends('app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-4 col-md-3 col-lg-2">
            {{-- Reviewer users can see some admin pages, too, but they should not have access to the navigation. --}}
            @if ($user->can('sudo'))
                <ul class="nav nav-pills nav-stacked">
                    <li role="presentation"@if(Route::is('admin')) class="active" @endif><a href="{{route('admin')}}">Dashboard</a></li>
                    <li role="presentation"@if(Route::is('admin-users')) class="active" @endif><a href="{{route('admin-users')}}">Users</a></li>
                    <li role="presentation"@if(Route::is('admin-announcements')) class="active" @endif><a href="{{route('admin-announcements')}}">Announcements</a></li>
                    @if (config('biigle.admin_logs'))
                        <?php $errorCount = with(new \Biigle\Logging\LogManager)->getRecentCount($logLevel ?? 'error') ?>
                        <li role="presentation"@if(Route::is('admin-logs-index')) class="active" @endif><a href="{{route('admin-logs-index')}}">Logs @if ($errorCount > 0 )<span class="badge" title="{{$errorCount}} errors in the last two days">{{$errorCount}}</span>@endif</a></li>
                    @endif
                    <li role="presentation"@if(Request::is('admin/global-label-trees')) class="active" @endif><a href="{{route('admin-global-label-trees')}}">Global Label Trees</a></li>
                    <li role="presentation"@if(Request::is('admin/federated-search')) class="active" @endif><a href="{{route('admin-federated-search')}}">Federated Search</a></li>
                    @if (!empty(config('sync.allowed_exports')))
                        <li role="presentation"@if(Request::is('admin/export')) class="active" @endif><a href="{{route('admin-export')}}">Export</a></li>
                    @endif
                    <li role="presentation"@if(Request::is('admin/import')) class="active" @endif><a href="{{route('admin-import')}}">Import</a></li>
                    @mixin('adminMenu')
                </ul>
            @endif
        </div>
        <div class="col-sm-8 col-md-9 col-lg-10">
            @yield('admin-content')
        </div>
    </div>
</div>
@endsection
