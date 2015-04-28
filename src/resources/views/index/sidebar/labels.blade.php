<div class="sidebar__labels" data-ng-controller="LabelsController">
	<ul class="list-unstyled ng-cloak" data-ng-repeat="feature in selectedFeatures">
		<li class="label__item" data-ng-repeat="annotationLabel in feature.annotation.labels | orderBy:'confidence':true" data-label-item="">
			<span class="label" data-ng-bind="annotationLabel.confidence" data-ng-class="class" title="Level of confidence: @{{annotationLabel.confidence}}"></span><span class="label__name">@{{annotationLabel.label.name}}</span> (@{{annotationLabel.user.name}})
		</li>
	</ul>
</div>