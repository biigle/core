<template>
    <span ref="root" class="admin-chart"></span>
</template>

<script setup>
import { use, init } from 'echarts/core';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { SVGRenderer } from 'echarts/renderers';
import { ref, onMounted, defineProps } from "vue";

const props = defineProps({
    data: {
        required: true,
        type: Array,
    },
});

use([
    TooltipComponent,
    GridComponent,
    BarChart,
    SVGRenderer,
]);

const option = {
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
        },
    },
    grid: {
        left: 0,
        right: 0,
        top: 50,
    },
    xAxis: {
        type: 'category',
        data: props.data[0],
        axisTick: {
            alignWithLabel: true,
        },
        axisLabel: {
            fontSize: 10,
            margin: 8,
        },
    },
    yAxis:{
        show: false,
        axisLabel: {
            show: false,
        },
    },
    series: [
        {
            type: 'bar',
            barWidth: '60%',
            data: props.data[1],
        },
    ],
};

const root = ref(null);
onMounted(() => {
    const chart = init(root.value, 'dark', { renderer: 'svg' });
    chart.setOption(option);
});
</script>

<style scoped>
.admin-chart {
    display: block;
    height: 70px;
}
</style>
