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
                    <li>
                        <a href="{{route('search')}}" title="Search BIIGLE"><i class="glyphicon glyphicon-search"></i></a>
                    </li>
                    <li id="notifications-navbar-indicator" unread="{{$user->unreadNotifications()->count()}}">
                        <a href="{{route('notifications')}}" class="notifications-icon" v-bind:title="title"><i class="glyphicon glyphicon-bell"></i><span class="notifications-icon__count badge" v-if="hasUnread" v-cloak v-text="unread"></span></a>
                    </li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="glyphicon glyphicon-menu-hamburger"></i> <span class="caret"></span></a>
                        <ul class="dropdown-menu">
                            <li class="dropdown-header">
                                Signed in as <strong>{{ $user->firstname }} {{ $user->lastname }}</strong>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li>
                                <a href="{{ route('home') }}" title="Dashboard">Dashboard</a>
                            </li>
                            @mixin('navbarMenuItem')
                            @if ($user->isAdmin)
                                <li>
                                    <a href="{{ route('admin') }}" title="Admin area">Admin area</a>
                                </li>
                            @endif
                            <li role="separator" class="divider"></li>
                            <li>
                                <a href="{{ route('settings') }}" title="{{ trans('biigle.titles.settings') }}">{{ trans('biigle.titles.settings') }}</a>
                            </li>
                            <li>
                                <a href="{{ url('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();" title="{{ trans('biigle.titles.logout') }}">
                                    {{ trans('biigle.titles.logout') }}
                                </a>

                                <form id="logout-form" action="{{ url('logout') }}" method="POST" style="display: none;">
                                    {{ csrf_field() }}
                                </form>
                            </li>
                            <li role="separator" class="divider"></li>
                            <li class="dropdown-footer">
                                <ul>
                                    <li>
                                        <a href="{{ route('manual') }}" title="Manual">Manual</a>
                                    </li>
                                    @mixin('navbarMenuItemFooter')
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        @endif
    </div>
</nav>
