@extends('app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-sm-4 col-md-3 col-md-offset-1 col-lg-2 col-lg-offset-2">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation"@if(Request::is('settings/profile')) class="active" @endif><a href="{{route('settings-profile')}}">Profile</a></li>
                <li role="presentation"@if(Request::is('settings/account')) class="active" @endif><a href="{{route('settings-account')}}">Account</a></li>
                <li role="presentation"@if(Request::is('settings/authentication')) class="active" @endif><a href="{{route('settings-authentication')}}">Authentication</a></li>
                <li role="presentation"@if(Request::is('settings/notifications')) class="active" @endif><a href="{{route('settings-notifications')}}">Notifications</a></li>
                @can('create', \Biigle\ApiToken::class)
                    <li role="presentation"@if(Request::is('settings/tokens')) class="active" @endif><a href="{{route('settings-tokens')}}">Tokens</a></li>
                @endcan
            </ul>
        </div>
        <div class="col-sm-8 col-md-7 col-lg-6">
            @yield('settings-content')
        </div>
    </div>
</div>
@endsection
