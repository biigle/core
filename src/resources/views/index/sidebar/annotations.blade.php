<div class="sidebar__annotations" data-ng-controller="AnnotationsController">
	<ul class="annotation-list list-unstyled ng-cloak">
		<li class="annotation-list__item" data-ng-repeat="annotation in annotations | orderBy:'id':true" data-ng-click="selectAnnotation($event, annotation.id)" data-ng-dblclick="fitAnnotation(annotation.id)" data-ng-class="{selected:(selected())}" data-annotation-list-item="" title="𝗗𝗼𝘂𝗯𝗹𝗲 𝗰𝗹𝗶𝗰𝗸 to zoom to the annotation">
			<span class="icon" data-ng-class="shapeClass"></span>#@{{annotation.id}}
			@if ($editMode)
				<button class="btn btn-inverse btn-xs pull-right" title="Attach '@{{ currentLabel().name }}' with confidence @{{ currentConfidence() }}" data-ng-if="canAttachLabel()" data-ng-click="attachLabel()"><span class="glyphicon glyphicon-tag" aria-hidden="true"></span></button>
			@endif
			<ul class="label-list list-unstyled" data-ng-if="selected() && annotation.labels.length > 0">
				<li class="label-list__item" data-ng-repeat="annotationLabel in annotation.labels | orderBy:'confidence':true" data-label-item="">
					<span class="confidence-label label" data-ng-bind="annotationLabel.confidence | number:2" data-ng-class="class" title="Level of confidence: @{{annotationLabel.confidence | number:2}}"></span><span class="label__name">@{{annotationLabel.label.name}}</span> <small class="label__user">@{{annotationLabel.user.name || '(deleted)'}}</small>
					@if ($editMode)
						<button type="button" class="close" title="Remove this label" data-ng-click="removeLabel(annotationLabel)"><span aria-hidden="true">&times;</span></button>
					@endif
				</li>
			</ul>
		</li>
	</ul>
</div>
