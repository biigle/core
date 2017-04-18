@if ($session = $volume->getActiveAnnotationSession(auth()->user()))
    <popover id="annotation-session-indicator" placement="bottom" title="Active annotation session">
        <button class="btn btn-info btn-xs" title="Active annotation session '{{$session->name}}'"><span class="glyphicon glyphicon-time" aria-hidden="true" ></span></button>
        <div slot="content" v-cloak>
            <div>
                <strong>{{$session->name}}</strong><br>
                <span class="text-muted">(ends at <span v-text="date('{!!$session->ends_at_iso8601!!}')"></span>)</span><br>
                {{$session->description}}
            </div>
            <div>
                @if ($session->hide_other_users_annotations)
                    <span class="label label-default" title="Hide annotations of other users while this annotation session is active">hide&nbsp;other</span>
                @endif
                @if ($session->hide_own_annotations)
                    <span class="label label-default" title="Hide own annotations that were created before this annotation session started while it is active">hide&nbsp;own</span>
                @endif
            </div>
        </div>
    </popover>

    @push('scripts')
        <script type="text/javascript">
            biigle.$viewModel('annotation-session-indicator', function (element) {
                new Vue({
                    el: element,
                    components: {popover: VueStrap.popover},
                    methods: {
                        date: function (d) {
                            return (new Date(d)).toLocaleString();
                        },
                    },
                });
            });
        </script>
    @endpush
@endif
