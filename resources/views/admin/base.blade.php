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
                    <?php
                        // I know this is hacky but it gets the job done.
                        $logs = File::glob(storage_path('logs').'/*.log');
                        $yesterday = \Carbon\Carbon::now()->subDay()->toDateString();
                        $today = \Carbon\Carbon::now()->toDateString();
                        $errorCount = array_reduce($logs, function ($carry, $file) use ($yesterday, $today) {
                            $content = File::get($file);
                            return $carry + substr_count($content, $yesterday) + substr_count($content, $today);
                        }, 0);
                    ?>
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
