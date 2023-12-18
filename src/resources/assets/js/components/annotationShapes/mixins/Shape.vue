<script>
export default{
    computed: {
        x(){
            return this.svgXML.childNodes[0].getAttribute('x');
        },
        y(){
            return this.svgXML.childNodes[0].getAttribute('y');
        },
        width(){
            return this.svgXML.childNodes[0].getAttribute('width');
        },
        height(){
            return this.svgXML.childNodes[0].getAttribute('height');
        },
        transform(){
            return this.svgXML.childNodes[0].getAttribute('transform');
        },
        cx(){
            return this.svgXML.childNodes[0].getAttribute('cx');
        },
        cy(){
            return this.svgXML.childNodes[0].getAttribute('cy');
        },
        rx(){
            return this.svgXML.childNodes[0].getAttribute('rx');
        },
        ry(){
            return this.svgXML.childNodes[0].getAttribute('ry');
        },
        r(){
            return this.svgXML.childNodes[0].getAttribute('r');
        },
        x1(){
            return this.svgXML.childNodes[0].getAttribute('x1');
        },
        x2(){
            return this.svgXML.childNodes[0].getAttribute('x2');
        },
        y1(){
            return this.svgXML.childNodes[0].getAttribute('x1');
        },
        y2(){
            return this.svgXML.childNodes[0].getAttribute('x2');
        },
        points(){
            return this.svgXML.childNodes[0].getAttribute('points');
        }
    },
}
</script>