<template>
<tr class="label-tree-label">
    <td class="label-tree-label__name">
        <span class="label-tree-label__color" :style="colorStyle"></span>
        <span v-text="label.name"></span>
    </td>
    <td>
        <i class="fas fa-chevron-right"></i>
    </td>
    <td class="label-tree-label__name">
        <div v-if="mappedLabel">
            <span class="label-tree-label__color" :style="mappedLabelColorStyle"></span>
            <span v-text="mappedLabel.name"></span>
        </div>
    </td>
</tr>
</template>

<script>
export default {
    props: {
        label: {
            required: true,
            type: Object,
        },
        labels: {
            default: () => {},
            type: Object,
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
            return this.labels[this.label.mappedLabel] || null;
        }
    },
};
</script>
