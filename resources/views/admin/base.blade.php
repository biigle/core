@extends('app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-4 col-md-3 col-lg-2">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation"@if(Route::is('admin')) class="active" @endif><a href="{{route('admin')}}">Dashboard</a></li>
                <li role="presentation"@if(Route::is('admin-users')) class="active" @endif><a href="{{route('admin-users')}}">Users</a></li>
                <li role="presentation"@if(Route::is('admin-system-messages')) class="active" @endif><a href="{{route('admin-system-messages')}}">System Messages</a></li>
                @if (config('biigle.admin_logs'))
                    <?php $errorCount = with(new \Biigle\Logging\LogManager)->getRecentCount() ?>
                    <li role="presentation"@if(Route::is('admin-logs-index')) class="active" @endif><a href="{{route('admin-logs-index')}}">Logs @if ($errorCount > 0 )<span class="badge" title="{{$errorCount}} errors in the last two days">{{$errorCount}}</span>@endif</a></li>
                @endif
                @mixin('adminMenu')
            </ul>
        </div>
        <div class="col-sm-8 col-md-9 col-lg-10">
            @yield('admin-content')
        </div>
    </div>
</div>
@endsection
