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
            <div class="navbar-right">
                <ul class="nav navbar-nav">
                    @can('sudo')
                        <li class="sudo-mode-indicator" title="You are in Super User Mode">
                            <p class="navbar-text">su</p>
                        </li>
                    @endcan
                    <li>
                        <a href="{{route('search')}}" title="Search"><i class="fa fa-search"></i></a>
                    </li>
                    <li>
                        <a href="{{route('notifications')}}" class="notifications-icon" @if ($hasNotification) title="You have unread notifications" @else title="Notifications" @endif>
                            <i class="fa fa-bell"></i>
                            @if ($hasNotification)
                                <span class="notifications-icon__count"></span>
                            @endif
                        </a>
                    </li>
                    @include('partials.help-menu')
                    @include('partials.top-menu')
                </ul>
            </div>
        @endif
    </div>
</nav>
