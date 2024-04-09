<template>
<div class="label-tree-label label-mapping-item">
    <div class="label-mapping-item-column">
        <div class="label-tree-label__name">
            <span class="label-tree-label__color" :style="colorStyle"></span>
            <span v-text="label.name"></span>
        </div>
    </div>
    <div class="label-mapping-item-chevron">
        <i class="fas fa-chevron-right"></i>
    </div>
    <div class="label-mapping-item-column">
        <div v-if="mappedLabel" class="label-tree-label__name">
            <span class="label-tree-label__color" :style="mappedLabelColorStyle"></span>
            {{mappedLabel.name}}<br>
            <span class="text-muted">{{mappedLabel.labelTreeName}}</span>
        </div>
        <div v-else>
            <typeahead
                :items="labels"
                :clear-on-select="true"
                @select="handleSelect"
                more-info="labelTreeName"
                placeholder="Label name"
                ></typeahead>
        </div>
    </div>
</div>
</template>

<script>
import Typeahead from '../../label-trees/components/labelTypeahead';

export default {
    components: {
        Typeahead,
    },
    props: {
        label: {
            required: true,
            type: Object,
        },
        labels: {
            default: () => [],
            type: Array,
        },
        trees: {
            default: () => [],
            type: Array,
        },
    },
    computed: {
        colorStyle() {
            return {
                'background-color': '#' + this.label.color,
            };
        },
        mappedLabelColorStyle() {
            if (!this.mappedLabel) {
                return '';
            }

            return {
                'background-color': '#' + this.mappedLabel.color,
            };
        },
        mappedLabel() {
            return this.labels.find(l => l.id === this.label.mappedLabel) || null;
        },
    },
    methods: {
        handleSelect(label) {
            this.label.mappedLabel = label.id;
        },
    },
};
</script>
