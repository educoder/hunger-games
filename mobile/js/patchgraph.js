
(function() {
  "use strict";
  var Patchgraph = this.Patchgraph || {};

  var w = 650;
  var h = 600;
  var padding = 50;

  //                                    yield, avg? patch ritchness, patch moves?, strategy note, patch competition
  var dataset = [ {name: "Bob", values: [500, 2.5, 2, "My Strategy was lorum ipsum dolum", 0] },
                  {name: "Jim", values: [380, 2.8, 5, "My Strategy was lorum ipsum dolum", 1], "color": {"r": 75, "g": 10, "b": 22} },
                  {name: "Becs", values: [425, 1.4, 8, "My Strategy was lorum ipsum dolum", 2], "color": {"r": 75, "g": 70, "b": 1} },
                  {name: "Tom", values: [245, 0.8, 4, "My Strategy was lorum ipsum dolum", 3], "color": {"r": 85, "g": 45, "b": 30}},
                  {name: "Cres", values: [300, 3.4, 1, "My Strategy was lorum ipsum dolum", 4], "color": {"r": 25, "g": 55, "b": 66}},
                  {name: "Gugo", values: [475, 2.8, 0, "My Strategy was lorum ipsum dolum", 5], "color": {"r": 0, "g": 255, "b": 10}},
                  {name: "Mike", values: [200, 4.4, 3, "My Strategy was lorum ipsum dolum", 6], "color": {"r": 0, "g": 255, "b": 10}},
                  {name: "Joel", values: [500, 2.4, 3, "My Strategy was lorum ipsum dolum", 7], "color": {"r": 88, "g": 10, "b": 75}},
                  {name: "Tony", values: [270, 1.8, 2, "My Strategy was lorum ipsum dolum", 8], "color": {"r": 5, "g": 10, "b": 66}},
                  {name: "Armin", values: [340, 3.4, 4, "My Strategy was lorum ipsum dolum", 9], "color": {"r": 200, "g": 10, "b": 0}},
                  {name: "Colin", values: [375, 5, 2, "My Strategy was lorum ipsum dolum", 10], "color": {"r": 44, "g": 88, "b": 66}},
                  {name: "Alisa", values: [285, 2.4, 3, "My Strategy was lorum ipsum dolum", 11], "color": {"r": 7, "g": 10, "b": 11}},
                  {name: "Kim", values: [240, 3.2, 3, "My Strategy was lorum ipsum dolum", 12], "color": {"r": 255, "g": 0, "b": 255}},
                  {name: "Naxin", values: [270, 4.5, 3, "My Strategy was lorum ipsum dolum", 13], "color": {"r": 40, "g": 75, "b": 33}},
                  {name: "Brenda", values: [355, 2.6, 3, "My Strategy was lorum ipsum dolum", 14], "color": {"r": 10, "g": 10, "b": 44}},
                  {name: "Ani", values: [390, 3.3, 7, "My Strategy was lorum ipsum dolum", 15], "color": {"r": 11, "g": 75, "b": 55}},
                  {name: "Pearl", values: [325, 4.4, 6, "My Strategy was lorum ipsum dolum", 16], "color": {"r": 22, "g": 20, "b": 66}},
                  {name: "Paulo", values: [175, 2.5, 7, "My Strategy was lorum ipsum dolum", 17], "color": {"r": 255, "g": 255, "b": 0}},
              ];

  var xScale = d3.scale.linear()
              .domain([0, d3.max(dataset, function(d){
                      return d.values[0]; })])
              .range([padding, w - (padding*2)]);

  var yScale = d3.scale.ordinal()
              .domain(d3.range(dataset.length))
              .rangeRoundBands([padding, h- padding], 0.1);

  var svg = d3.select("body")
              .append("svg")
              .attr("class", "patchgraph")
              .attr("width", w)
              .attr("height", h)

  // var xAxisLabel = d3.scale.ordinal()
  //                 .domain(["Low", "Middle", "High"])
  //                 .rangeRoundBands([padding, h - padding], 0.05);

  var yAxisLabelNames = d3.scale.ordinal()
                  .domain(dataset.map(function(d){
                      return d.name;}))
                  .rangeRoundBands([padding, h - padding], 0.05);

  var xAxisLabel = d3.scale.linear()
                  .domain([0, d3.max(dataset, function(d){
                      return d.values[0]; })])
                  .range([padding, w -padding]);

  var xAxis = d3.svg.axis()
                  .scale(xAxisLabel)
                  .orient("bottom")
                  ;

  var yAxis = d3.svg.axis()
                    .scale(yAxisLabelNames)
                    .orient("left");
                                  
  svg.append("rect")
    .attr("y", padding)
    .attr("x", padding)
    .attr("width", 200)
    .attr("height", h -padding*2)
    .attr("fill", "rgba(255,0,0, 0.3")
    .attr("class", "legendBar")

  svg.append("text")
    .text("Starving")
    .attr("text-anchor", "middle")
    .attr("y", padding -7)
    .attr("x", padding +100)
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")

  svg.append("rect")
    .attr("y", padding)
    .attr("x", padding +200)
    .attr("width", 200)
    .attr("height", h -padding*2)
    .attr("fill", "rgba(0,255,0, 0.3")
    .attr("class", "legendBar")

  svg.append("text")
    .text("Surviving")
    .attr("text-anchor", "middle")
    .attr("y", padding -7)
    .attr("x", padding +300)
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")

  svg.append("rect")
    .attr("y", padding)
    .attr("x", padding +400)
    .attr("width", 200)
    .attr("height", h -padding*2)
    .attr("fill", "rgba(0,0,255, 0.3")
    .attr("class", "legendBar")

  svg.append("text")
    .text("Prospering")
    .attr("text-anchor", "middle")
    .attr("y", padding -7)
    .attr("x", padding +500)
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")

  svg.selectAll("rect.bars")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "bars")
    .attr("x", 0 + padding)
    .attr("y", function(d, i){
        return yScale(i);
    })
    .attr("width", function(d) {
        return xScale(d.values[0]);
    })
    .attr("height", yScale.rangeBand())
    .attr("fill", function(d) {
      if (d.color) {
        var color = "rgba(";
        color += d.color.r +", ";
        color += d.color.g +", ";
        color += d.color.b +", ";
        color += ".7)";

        return color;
      } else {
        return "rgba(75, 75, 75, 1)";
      }
    })
    .attr("stroke-width", 1)
    .attr("stroke", "rgb(0,0,0)")

  // svg.select(".bars:nth-child(6)")
  //  .attr("fill", "orange")
  //  .attr("padding-bottom", 100)

    .on("mouseover", function(d){    
      var yPosition = parseFloat(d3.select(this).attr("y")) + yScale.rangeBand() /2
      var xPosition = parseFloat(d3.select(this).attr("x")) /2 + w /2;

      d3.select("#tooltip")
          .style("left", "660px")
          .style("top", "140px")
          .select("#strat")
          .text(d.values[3]);
          
      d3.select("#tooltip")
          .select("#graph")
          .attr("src", "img/cpg.jpg");
          
      d3.select("#tooltip")
          .select("#studentName")
          .text(d.name);

      d3.select("#tooltip").classed("hidden", false);
    })

    .on("mouseout", function() {
        d3.select("#tooltip").classed("hidden", true);
    });

  svg.selectAll("text.name")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(d) {
        return d.name;
    })
    .attr("text-anchor", "middle")
    .attr("y", function(d, i) {
      return yScale(i) + yScale.rangeBand() /2 +4;
    })
    .attr("x", function(d) {
      return 80;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px")
    .attr("fill", "white")
    .attr("class", "name-labels")

 
  svg.selectAll("text.values")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(d) {
        return d.values[0];
    })
    .attr("text-anchor", "middle")
    .attr("y", function(d, i) {
      return yScale(i) + yScale.rangeBand() /2 +4;
    })
    .attr("x", function(d) {
      return xScale(d.values[0]) +65;
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px")
    .attr("fill", function(d, i){
      if (i%2 == 0){
        return "blue"
      } else {
        return "red"
      };
    })
    .attr("class", "labels")


  d3.select("#yield").on("click", function(){
    // resort the graph data as well
    var sortedData = dataset.sort(function(a, b){
      return d3.ascending(a.values[0], b.values[0])
    });

    svg.selectAll("rect.bars")
      .sort(function(a, b){
        return d3.ascending(a.values[0], b.values[0])
      })
      .transition()
      .delay(function(d, i){
        return i *50;
      })
      .duration(1000)
      .attr("y", function(d, i) {
        return yScale(i)
      });

    svg.selectAll(".labels")
      .sort(function(a, b){
          return d3.ascending(a.values[0], b.values[0])
      })
      .transition()
      .delay(function(d, i){
        return i * 50;
      })
      .duration(1000)
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
        return yScale(i) +yScale.rangeBand() /2 +4;
      });

    sortLabelNames(0);

    // changeGraph(sortedData);
    changeYaxis(sortedData, 0);
  });

  d3.select("#richPatch").on("click", function(){
    svg.selectAll("rect.bars")
      .sort(function(a, b){
        return d3.ascending(a.values[1], b.values[1])
      })
      .transition()
      .delay(function(d, i){
        return i *50;
      })
      .duration(1000)
      .attr("y", function(d, i) {
        return yScale(i)
      });

    svg.selectAll(".labels")
      .sort(function(a, b){
        return d3.ascending(a.values[1], b.values[1])
      })
      .transition()
      .delay(function(d, i){
        return i * 50;
      })
      .duration(1000)
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
        return yScale(i) +yScale.rangeBand() /2 +4;
    });

    sortLabelNames(1);

    // resort the graph data
    var sortedData = dataset.sort(function(a, b){
      return d3.ascending(a.values[1], b.values[1])
    });

    changeYaxis(sortedData, 1);
  });

  d3.select("#patchMoves").on("click", function(){     
    svg.selectAll("rect.bars")
      .sort(function(a, b){
        return d3.ascending(a.values[2], b.values[2])
      })
      .transition()
      .delay(function(d, i){
        return i *50;
      })
      .duration(1000)
      .attr("y", function(d, i) {
        return yScale(i)
      });

    svg.selectAll(".labels")
      .sort(function(a, b){
          return d3.ascending(a.values[2], b.values[2])
      })
      .transition()
      .delay(function(d, i){
        return i * 50;
      })
      .duration(1000)
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
        return yScale(i) +yScale.rangeBand() /2 +4;
    });

    sortLabelNames(2);

    // resort the graph data
    var sortedData = dataset.sort(function(a, b){
      return d3.ascending(a.values[2], b.values[2])
    });

    changeYaxis(sortedData, 2); 
  });

  d3.select("#patchCompetition").on("click", function(){
    svg.selectAll("rect.bars")
      .sort(function(a, b){
        return d3.ascending(a.values[4], b.values[4])
      })
      .transition()
      .delay(function(d, i){
        return i *50;
      })
      .duration(1000)
      .attr("y", function(d, i) {
        return yScale(i)
      });

    svg.selectAll(".labels")
      .sort(function(a, b){
       return d3.ascending(a.values[4], b.values[4])
      })
      .transition()
      .delay(function(d, i){
        return i * 50;
      })
      .duration(1000)
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
       return yScale(i) +yScale.rangeBand() /2 +4;
    });

    sortLabelNames(4);

    // svg.select(".y").call(yAxis);
    // resort the graph data
    var sortedData = dataset.sort(function(a, b){
      return d3.ascending(a.values[4], b.values[4])
    });

    changeYaxis(sortedData, 4);
  });

  //Create Y axis
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (h - padding) + ")")
    .call(xAxis);

  //Create X axis
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

  var sortLabelNames = function (dataIndex) {
    svg.selectAll(".name-labels")
      .sort(function(a, b){
          return d3.ascending(a.values[dataIndex], b.values[dataIndex])
      })
      .transition()
      .delay(function(d, i){
        return i * 50;
      })
      .duration(1000)
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
        return yScale(i) +yScale.rangeBand() /2 +4;
      });
  };

  // var changeGraph = function (sortedData) {
  //   svg.selectAll("rect")
  //       .data(sortedData)
  //     .transition()
  //       .duration(1000)
  //       .attr("y", function(d, i) {
  //           return yScale(i)
  //       });

  //     svg.selectAll(".labels")
  //         .data(sortedData)
  //       .transition()
  //         .duration(1000)
  //         .attr("text-anchor", "middle")
  //         .attr("y", function(d, i) {
  //           return yScale(i) +yScale.rangeBand() /2 +4;
  //         });
  // };

  /* This function rearranges the y Axis. If you return d.name in the map function
     it will show the names of each student. However I am showing the data range we
     sorted with. This doesn't work quit yet and I might need some help to figure
     this out */
  var changeYaxis = function (sortedData, dataIndex) {
    var yAxisLabel = d3.scale.ordinal()
      .domain(sortedData.map(function(d){
          return d.values[dataIndex];
      }))
      .rangeRoundBands([padding, h - padding], 0.05);


    var yAxisNew = d3.svg.axis()
      .scale(yAxisLabel)
      .orient("left");

    svg.select(".y.axis")
      .transition()
      .duration(1600)
      .call(yAxisNew);
  };

  Patchgraph.svg = svg;
  return this.Patchgraph = Patchgraph;

}).call(this);