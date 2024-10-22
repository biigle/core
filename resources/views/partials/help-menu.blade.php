<li is="vue:dropdown" ref="dropdown" tag="li">
    <a href="#" onclick="event.preventDefault()" class="dropdown-toggle navbar-btn-link" role="button" aria-haspopup="true" aria-expanded="false" title="Help menu">
        <span class="btn btn-default">
            <i class="fa fa-question-circle"></i> <span class="caret"></span>
        </span>
    </a>
    <template #dropdown>
        <li>
            <a href="{{ route('manual') }}" title="View the manual">Manual</a>
        </li>
        <li>
            <a href="{{ url('doc/api/index.html') }}" title="View the API documentation">API documentation</a>
        </li>
        <li>
            <a href="https://github.com/orgs/biigle/discussions" target="_blank" title="Visit the community forum">Community <i class="fas fa-external-link-alt text-muted"></i></a>
        </li>
        @mixin('navbarHelpItem')
    </template>
</li>
