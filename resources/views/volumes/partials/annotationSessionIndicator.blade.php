@if ($session = $volume->getActiveAnnotationSession(auth()->user()))
    <span id="annotation-session-indicator">
        <button id="asi-button" class="btn btn-info btn-xs" title="Active annotation session '<?php echo e($session->name); ?>'"><span class="fa fa-clock" aria-hidden="true" ></span></button>
        <popover title="Title" target="#asi-button" v-cloak>
            <template slot="popover">
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
            </template>
        </popover>
    </span>

    @push('scripts')
        <script type="module">
            biigle.$mount('annotation-session-indicator', {
                components: {popover: biigle.$require('uiv.popover')},
                methods: {
                    date: function (d) {
                        return (new Date(d)).toLocaleString();
                    },
                },
            });
        </script>
    @endpush
@endif
