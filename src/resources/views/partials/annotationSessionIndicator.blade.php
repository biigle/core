@if ($transect->activeAnnotationSession)
    <?php $session = $transect->activeAnnotationSession ?>
    <button class="btn btn-info btn-xs" title="Active annotation session '{{$session->name}}'" data-popover-title="Active annotation session" data-popover-placement="bottom" data-uib-popover-template="'annotationSessionIndicatorPopover.html'">
        <span class="glyphicon glyphicon-time" aria-hidden="true" ></span>
        <script type="text/ng-template" id="annotationSessionIndicatorPopover.html">
            <div class="annotation-session-indicator-popover">
                <div>
                    <strong>{{$session->name}}</strong><br>
                    <span class="text-muted">(ends at <span data-ng-bind="'{{$session->ends_at_iso8601}}' | date: 'yyyy-MM-dd HH:mm'"></span>)</span><br>
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
        </script>
    </button>

    @push('scripts')
        <script type="text/javascript">
            angular.element(document).ready(function () {
                "use strict";
                angular.bootstrap(document.querySelector('[data-uib-popover-template="\'annotationSessionIndicatorPopover.html\'"]'), ['ui.bootstrap']);
            });
        </script>
    @endpush
@endif
