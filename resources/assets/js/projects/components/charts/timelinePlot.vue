<template>
    <span ref="root" class="chart grid-col-span-3"></span>
</template>

<script>
import { use, init } from 'echarts/core';
import {
    DatasetComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
} from 'echarts/components';
import { LineChart, PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { IDToColor } from "./IDToColor";
import { markRaw } from "vue";

export default {
    props: {
        annotationTimeSeries: {
            required: true,
            type: Array,
        },
        subtitle: {
            required: true,
            type: String,
        },
    },
    data() {
        return {
            chart: null,
            pieObj: {
                type: 'pie',
                radius: '30%',
                center: ['55%', '30%'],
                emphasis: {
                    focus: 'self'
                },
                label: {
                    formatter: '{b}: {@[0]} ({d}%)',
                },
                encode: {
                    itemName: 'yearmonth',
                    tooltip:  0,
                    value: 0
                },
                itemStyle: {
                    color: function (params) {
                        return IDToColor(params.data[params.data.length - 1]);
                    }
                }
            },
        };
    },
    methods: {
        handleUpdate(event) {
            let xAxisInfo = event.axesInfo[0];
            let dimension = 0;
            if (xAxisInfo) {
                // if mouse hovered on the x-axis of timeline
                // skip first two entries (+2) of sourcedata annotation-array-user (see sourcedata-property)
                dimension = xAxisInfo.value + 2;
            }

            this.pieObj.label.formatter = '{b}: {@[' + dimension + ']} ({d}%)';
            this.pieObj.encode.value = dimension;
            this.pieObj.encode.tooltip = dimension;

            if (this.chart) {
                this.chart.setOption(this.option);
            }
        },
        extractYearMonth() {
            // helper-function to get all X-Axis data (yearsmonth)
            let xAxis = this.annotationTimeSeries.map((entry) => {
                return entry.yearmonth.toString();
            });
            // sort the yearmonths entries
            xAxis = xAxis.sort();

            //generate dates for xAxis
            let currentDate = new Date(xAxis[0]);
            let lastDate = new Date(xAxis[xAxis.length - 1]);
            let xAxisFin = [];

            while (currentDate.getTime() < lastDate.getTime()) {
                let year = currentDate.getFullYear();
                let month = currentDate.getMonth() + 1;
                let yearMonth = year + '-' + month.toString().padStart(2, '0');

                xAxisFin.push(yearMonth);
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            if (!xAxisFin.includes(xAxis[xAxis.length - 1])) {
                xAxisFin.push(xAxis[xAxis.length - 1]);
            }

            return xAxisFin;
        },
    },
    computed: {
        sourcedata() {
            // provides special information specifically to pie-chart, namely total contribution of each user 
            // returns array of type [xAxis-array, annotation-array-user1, annotation-array-user2, etc.]:
            // [['all', 'year', 2020, 2021, 2022], [1195,"Name1",1195,0,0], [6,"Name2",0,2,4], [...]]
            let dat = this.annotationTimeSeries;
            let xAxis = this.extractYearMonth();
            let chartdata = [];

            let users = {};

            // get all unique User-names
            dat.forEach((entry) => {
                users[entry.user_id] = entry.fullname;
            });

            let idDict = {};
            // create object with "year-slots" for each user (e.g. {id: {"2020":0, "2021":0, "2022":0]}))
            for (let id in users) {
                let yearDict = {};
                for (let y of xAxis) {
                    yearDict[y] = 0;
                }
                idDict[id] = yearDict;
            }
        
        

            // assemble the annotations of each user in correct order of year
            // each user has its own year-timeseries in idDict (e.g. {id: {"2020":10, "2021":4, "2022":6]})

            for (let yearmonth of xAxis) {
                for (let entry of dat) {
                    if (entry.yearmonth.toString() === yearmonth) {
                        idDict[entry.user_id][yearmonth] += entry.count;
                    } else {
                        idDict[entry.user_id][yearmonth] += 0;
                    }
                }
            }

            // setup of whole chartdata object
            // include axis-name in front
            xAxis.unshift('yearmonth');
            // include an entry of the sum over all years
            xAxis.unshift('all');
            chartdata.push(xAxis);

            // reduce user-timeseries to values only
            Object.entries(idDict).forEach(entry => {
                // calculate the sum over all years and include in the array on position 0
                let sum = 0;
                Object.values(entry[1]).forEach(val => {
                    sum += val;
                })
                let name = users[entry[0]];
                let userid = entry[0];
                // case of deleted account
                if (name === " ") {
                    chartdata.push([sum, 'Deleted Account', ...Object.values(entry[1]),userid]);
                } else { // case of existing user
                    chartdata.push([sum, name, ...Object.values(entry[1]),userid]);
                }
            });
            return chartdata;
        },
        createTimelineSeries() {
            // create a series Array with entries for each user, used for the timeline-plot
            let series = [];
            let end = this.sourcedata[0].length;

            // create a series of data which is specific to each user
            // skip first entry (idx=1), as it is an array of x-axis names and not user-data
            // sourcedata-structure: [['all', 'year', 2020, 2021, 2022], [1195,"Name1",1195,0,0], [6,"Name2",0,2,4]]
            for (let idx = 1; idx < this.sourcedata.length; idx++) {
                let snippet = {
                    name: this.sourcedata[idx][1],
                    type: 'line',
                    smooth: true,
                    seriesLayoutBy: 'row',
                    emphasis: { focus: 'series' },
                    // skip first two entries as they are irrelevant for the timeline-data
                    data: this.sourcedata[idx].slice(2, end),
                    itemStyle: { "color": IDToColor(this.sourcedata[idx][end]) },
                };
                series.push(snippet)
            }
            return series;
        },
        option() {
            let seriesObj = this.createTimelineSeries;
            // append the pie-chart specific snippet
            seriesObj.push(this.pieObj);
            return {
                legend: {
                    left: '2%',
                    top: '24%',
                    orient: 'vertical',
                    textStyle: {
                        width: 150,
                        overflow: 'break',
                    },
                },
                tooltip: {
                    trigger: 'axis',
                    showContent: false
                },
                backgroundColor: 'transparent',
                title: {
                    text: 'Total contribution',
                    subtext: this.subtitle,
                    top: '5%',
                    left: '2%',
                    textAlign: "left",
                    textStyle: {
                        fontSize: 20
                    },
                    subtextStyle: {
                        width: 250,
                        overflow: "break",
                        lineHeight: 15,
                        align: "center",
                        verticalAlign: "top"
                    },
                },
                dataset: {
                    source: this.sourcedata
                },
                xAxis: {
                    type: 'category',
                    data: this.extractYearMonth()
                },
                yAxis: {
                    gridIndex: 0,
                    name: "annotations",
                    nameLocation: "middle",
                    nameTextStyle: { verticalAlign: "middle" },
                    nameGap: 60
                },
                grid: {
                    top: '60%',
                    bottom: '10%',
                    left: '20%',
                    right: '5%'
                },
                series: seriesObj
            }
        }
    },
    watch: {
        option() {
            if (this.chart) {
                this.chart.setOption(this.option);
            }
        },
    },
    beforeCreate() {
        use([
            DatasetComponent,
            TooltipComponent,
            GridComponent,
            LegendComponent,
            LineChart,
            PieChart,
            CanvasRenderer,
            LabelLayout,
            TitleComponent,
        ]);
    },
    mounted() {
        this.chart = markRaw(init(this.$refs.root, 'dark', { renderer: 'svg' }));
        this.chart.setOption(this.option);
        this.chart.on('updateAxisPointer', this.handleUpdate);
    },
};
</script>
