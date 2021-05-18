<nav class="navbar navbar-default navbar-static-top">
@hasSection('full-navbar')
    <div class="container-fluid">
@else
    <div class="container">
@endif
        <div class="navbar-header">
            <a class="navbar-brand logo" href="{{ route('home') }}"><span class="logo__biigle">BIIGLE</span></a>
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
                        <a href="{{route('search')}}" title="Search BIIGLE"><i class="fa fa-search"></i></a>
                    </li>
                    <li id="notifications-navbar-indicator" unread="{{$user->unreadNotifications()->count()}}">
                        <a href="{{route('notifications')}}" class="notifications-icon" v-bind:title="title"><i class="fa fa-bell"></i><span class="notifications-icon__count badge" v-if="hasUnread" v-cloak v-text="unread"></span></a>
                    </li>
                    @include('partials.top-menu')
                </ul>
            </div>
        @endif
    </div>
</nav>
