@inject('modules', 'Dias\Services\Modules')
<nav class="navbar navbar-default navbar-static-top">
    <div class="container">
        <div class="navbar-header">
            <a class="navbar-brand logo" href="{{ route('home') }}">
                <span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup>
            </a>
        </div>
        @hasSection('navbar')
            <div class="navbar-left">
                @yield('navbar')
            </div>
        @endif
        <div class="navbar-right">
            <ul class="nav navbar-nav">
                <li>
                    @if($user->unreadNotifications()->exists())
                        <a href="{{route('notifications')}}" class="notifications-icon notifications-icon--unread" title="You have unread notifications"><i class="glyphicon glyphicon-bell"></i></a>
                    @else
                        <a href="{{route('notifications')}}" class="notifications-icon" title="You have no unread notifications"><i class="glyphicon glyphicon-bell"></i></a>
                    @endif
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
                        @foreach ($modules->getMixins('navbarMenuItem') as $module => $nestedMixins)
                            @include($module.'::navbarMenuItem')
                        @endforeach
                        @if ($user->isAdmin)
                            <li>
                                <a href="{{ route('admin') }}" title="Admin area">Admin area</a>
                            </li>
                        @endif
                        <li>
                            <a href="{{ route('manual') }}" title="{{ trans('dias.titles.manual') }}">{{ trans('dias.titles.manual') }}</a>
                        </li>
                        <li role="separator" class="divider"></li>
                        <li>
                            <a href="{{ route('settings') }}" title="{{ trans('dias.titles.settings') }}">{{ trans('dias.titles.settings') }}</a>
                        </li>
                        <li>
                            <a href="{{ url('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();" title="{{ trans('dias.titles.logout') }}">
                                {{ trans('dias.titles.logout') }}
                            </a>

                            <form id="logout-form" action="{{ url('logout') }}" method="POST" style="display: none;">
                                {{ csrf_field() }}
                            </form>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
