<footer class="footer @if(isset($positionAbsolute) && $positionAbsolute) footer--absolute @endif">
    <ul class="footer-menu">
        <li>
            <a href="{{ route('manual') }}" title="Manual">Manual</a>
        </li>
        @mixin('footerItem')
        @if (isset($links) && is_array($links))
            @foreach($links as $link => $url)
                <li><a href="{{$url}}">{{$link}}</a></li>
            @endforeach
        @endif
    </ul>
</footer>
