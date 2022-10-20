<nav class="navbar navbar-default navbar-static-top">
@hasSection('full-navbar')
    <div class="container-fluid">
@else
    <div class="container">
@endif
        <div class="navbar-header">
            <a class="navbar-brand logo" href="{{ route('home') }}"><span class="logo__biigle">BIIGLE</span></a>
            <span id="announcement" class="announcement">
                <popover v-on:hide="handleHide">
                    <button class="btn btn-warning btn-sm" title="View full announcement"><i class="fa fa-bullhorn"></i> <span v-cloak v-if="expandAnnouncement" class="announcement-text">Newsletter and announcements</span></button>
                    <template slot="popover">
                        <div class="text-warning">
                            BIIGLE system messages are now replaced by the new newsletter (for new BIIGLE features and other information) and announcements (for system maintenance information). You can sign up to the newsletter <a href="#">here</a>.
                        </div>
                    </template>
                </popover>
            </span>
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
