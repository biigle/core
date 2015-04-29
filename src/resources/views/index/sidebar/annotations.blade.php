<div class="sidebar__annotations" data-ng-controller="AnnotationsController">
	<ul class="annotation-list list-unstyled ng-cloak">
		<li class="annotation-list__item" data-ng-repeat="annotation in annotations" data-ng-click="selectAnnotation($event, annotation.id)" data-ng-class="{selected:(isSelected(annotation.id))}" data-annotation-list-item="">
			<span class="icon" data-ng-class="shapeClass"></span>#@{{annotation.id}}
			<ul class="label-list list-unstyled" data-ng-if="isSelected(annotation.id) && annotation.labels.length > 0">
				<li class="label-list__item" data-ng-repeat="annotationLabel in annotation.labels | orderBy:'confidence':true" data-label-item="">
					<span class="label" data-ng-bind="annotationLabel.confidence" data-ng-class="class" title="Level of confidence: @{{annotationLabel.confidence}}"></span><span class="label__name">@{{annotationLabel.label.name}}</span> <span class="label__user">@{{annotationLabel.user.name}}</span>
				</li>
			</ul>
		</li>
	</ul>
</div>