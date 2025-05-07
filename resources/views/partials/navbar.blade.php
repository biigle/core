<nav class="navbar navbar-default navbar-static-top">
@hasSection('full-navbar')
    <div class="container-fluid">
@else
    <div class="container">
@endif
        <div class="navbar-header">
            <a class="navbar-brand logo" href="{{ route('home') }}"><span class="logo__biigle">BIIGLE</span></a>
            @if ($announcement)
                @include('partials.announcement')
            @endif
        </div>
        @hasSection('navbar')
            <div class="navbar-left">
                @yield('navbar')
            </div>
        @endif
        @if ($user)
            <div id="navbar-right" class="navbar-right">
                <ul class="nav navbar-nav">
                    @can('sudo')
                        <li class="sudo-mode-indicator" title="You are in Super User Mode">
                            <a href="{{route('settings-account')}}" class="navbar-btn-link">
                                <span class="btn btn-danger">
                                    su
                                </span>
                            </a>
                        </li>
                    @endcan
                    <li>
                        <a href="{{route('search')}}" title="Search" class="navbar-btn-link"><span class="btn btn-default"><i class="fa fa-search"></i></span></a>
                    </li>
                    <li>
                        <a href="{{route('notifications')}}" class="notifications-icon navbar-btn-link" @if ($hasNotification) title="You have unread notifications" @else title="Notifications" @endif>
                            <span class="btn @if ($hasNotification) btn-info @else btn-default @endif">
                                <i class="fa fa-bell"></i>
                            </span>
                        </a>
                    </li>
                    @include('partials.help-menu')
                    @include('partials.top-menu')
                </ul>
            </div>
        @endif
    </div>
</nav>
