import React, { PropTypes } from 'react'
import * as d3 from 'd3'
import { sankey } from 'd3-sankey'
import isEqual from 'lodash/isEqual'
import { makeResponsive } from './utils'
import './style.css'


export class Sankey extends React.Component {

  static propTypes = {

  }

  static defaultProps = {
    initialWidth: 960,
    initialHeight: 500
  }

  componentDidMount(){
    this.renderChart()
  }

  componentWillUpdate(prevProps, prevState){
    if(!isEqual(this.props.data, prevProps.data))
      this.renderChart()
  }

  renderChart =()=>{
    const { initialWidth, initialHeight, data } = this.props

    let margin = {
        top: 1,
        right: 1,
        bottom: 6,
        left: 1
      },
      width = initialWidth - margin.left - margin.right,
      height = initialHeight - margin.top - margin.bottom;

    let formatNumber = d3.format(",.0f"),
      format = function(d) {
        return formatNumber(d) + " TWh";
      },
      color = d3.scaleOrdinal(d3.schemeCategory20);

    let svg = d3.select(this.chartContainer)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(makeResponsive)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let sk = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .size([width, height]);

    let path = sk.link();


    sk
      .nodes(data.nodes)
      .links(data.links)
      .layout(32);

    let link = svg.append("g").selectAll(".link")
      .data(data.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) {
        return Math.max(1, d.dy);
      })
      .sort(function(a, b) {
        return b.dy - a.dy;
      });

    link.append("title")
      .text(function(d) {
        return d.source.name + " → " + d.target.name + "\n" + format(d.value);
      });

    let node = svg.append("g").selectAll(".node")
      .data(data.nodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .call(d3.drag()
        .subject(function(d) {
          return d;
        })
        .on("start", function() {
          this.parentNode.appendChild(this);
        })
        .on("drag", dragmove));

    node.append("rect")
      .attr("height", function(d) {
        return d.dy;
      })
      .attr("width", sk.nodeWidth())
      .style("fill", function(d) {
        return d.color = color(d.name.replace(/ .*/, ""));
      })
      .style("stroke", function(d) {
        return d3.rgb(d.color).darker(2);
      })
      .append("title")
      .text(function(d) {
        return d.name + "\n" + format(d.value);
      });

    node.append("text")
      .attr("x", -6)
      .attr("y", function(d) {
        return d.dy / 2;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) {
        return d.name;
      })
      .filter(function(d) {
        return d.x < width / 2;
      })
      .attr("x", 6 + sk.nodeWidth())
      .attr("text-anchor", "start");

    function dragmove(d) {
      d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
      sk.relayout();
      link.attr("d", path);
    }

  }

  render(){
    return(
      <div
        ref={(chartContainer) => { this.chartContainer = chartContainer }}
        className="chart"
        style={{ width: '100%', height: '100%' }} />
    )
  }
}