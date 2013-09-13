
(function() {
  "use strict";
  var Patchgraph = this.Patchgraph || {};
  var HG = this.HG || {};                     // TODO: refactor this to Hunger? HungerGames?

  var w = 650;
  var h = 600;
  var padding = 50;
  var xScale;
  var yScale;
  var svg;
  var statistics_data = [];
  var yAxisLabelNames;
  var xAxisLabel;
  var xAxis;
  var yAxis;

  //                                    yield, avg? patch ritchness, patch moves?, strategy note, patch competition
  // var dataset = [ {name: "Bob", values: [500, 2.5, 2, "My Strategy was lorum ipsum dolum", 0] },
  //                 {name: "Jim", values: [380, 2.8, 5, "My Strategy was lorum ipsum dolum", 1], "color": {"r": 75, "g": 10, "b": 22} },
  //                 {name: "Becs", values: [425, 1.4, 8, "My Strategy was lorum ipsum dolum", 2], "color": {"r": 75, "g": 70, "b": 1} },
  //                 {name: "Tom", values: [245, 0.8, 4, "My Strategy was lorum ipsum dolum", 3], "color": {"r": 85, "g": 45, "b": 30}},
  //                 {name: "Cres", values: [300, 3.4, 1, "My Strategy was lorum ipsum dolum", 4], "color": {"r": 25, "g": 55, "b": 66}},
  //                 {name: "Gugo", values: [475, 2.8, 0, "My Strategy was lorum ipsum dolum", 5], "color": {"r": 0, "g": 255, "b": 10}},
  //                 {name: "Mike", values: [200, 4.4, 3, "My Strategy was lorum ipsum dolum", 6], "color": {"r": 0, "g": 255, "b": 10}},
  //                 {name: "Joel", values: [500, 2.4, 3, "My Strategy was lorum ipsum dolum", 7], "color": {"r": 88, "g": 10, "b": 75}},
  //                 {name: "Tony", values: [270, 1.8, 2, "My Strategy was lorum ipsum dolum", 8], "color": {"r": 5, "g": 10, "b": 66}},
  //                 {name: "Armin", values: [340, 3.4, 4, "My Strategy was lorum ipsum dolum", 9], "color": {"r": 200, "g": 10, "b": 0}},
  //                 {name: "Colin", values: [375, 5, 2, "My Strategy was lorum ipsum dolum", 10], "color": {"r": 44, "g": 88, "b": 66}},
  //                 {name: "Alisa", values: [285, 2.4, 3, "My Strategy was lorum ipsum dolum", 11], "color": {"r": 7, "g": 10, "b": 11}},
  //                 {name: "Kim", values: [240, 3.2, 3, "My Strategy was lorum ipsum dolum", 12], "color": {"r": 255, "g": 0, "b": 255}},
  //                 {name: "Naxin", values: [270, 4.5, 3, "My Strategy was lorum ipsum dolum", 13], "color": {"r": 40, "g": 75, "b": 33}},
  //                 {name: "Brenda", values: [355, 2.6, 3, "My Strategy was lorum ipsum dolum", 14], "color": {"r": 10, "g": 10, "b": 44}},
  //                 {name: "Ani", values: [390, 3.3, 7, "My Strategy was lorum ipsum dolum", 15], "color": {"r": 11, "g": 75, "b": 55}},
  //                 {name: "Pearl", values: [325, 4.4, 6, "My Strategy was lorum ipsum dolum", 16], "color": {"r": 22, "g": 20, "b": 66}},
  //                 {name: "Paulo", values: [175, 2.5, 7, "My Strategy was lorum ipsum dolum", 17], "color": {"r": 255, "g": 255, "b": 0}},
  //             ];


  Patchgraph.init = function () {
    fetchDataSet().done(function(data){
      console.log('successfully fetched patchgraph data');
      updateBoutPicker(data);

      draw(_.first(data).user_stats);
      statistics_data = data;
    });
  };

  Patchgraph.refresh = function () {
    d3.select(".patchgraph").remove();
    fetchDataSet().done(function(data){
      console.log('successfully fetched patchgraph data');
      updateBoutPicker(data);

      draw(_.first(data).user_stats);
      statistics_data = data;
    });
  };

  Patchgraph.showGraphForBout = function(bout) {
    d3.select(".patchgraph").remove();
    var bout_data = _.find(statistics_data, function (d) {
      return parseInt(d.bout_id, 10) === parseInt(bout, 10);
    });

    draw(bout_data.user_stats);
  };

  /*
  * Replaced static data by loading this data via Ajax from local file system.
  * Once Chicago is ready we pull data from their URL, transform the data so it
  * looks like dataset and then call draw.
  */
  var fetchDataSet = function () { 
    var promise = jQuery.ajax('http://ltg.evl.uic.edu:9292/hunger-games-fall-13/statistics?selector=%7B%22run_id%22%3A%22period-1%22%7D');
    return promise;
    // var jqXHR = jQuery.ajax('http://ltg.evl.uic.edu:9292/hunger-games-fall-13/statistics?selector=%7B%22run_id%22%3A%22period-1%22,%22bout_id%22%3A%222%22%7D')
    // var jqXHR = jQuery.ajax('http://ltg.evl.uic.edu:9292/hunger-games-fall-13/statistics?selector=%7B%22run_id%22%3A%22period-1%22%7D')
    //   .done(function(data){
    //     var bouts = [];
    //     console.log('successfully fetched patchgraph data');

    //     _.each(data, function (d, iterator) {
    //       bouts.push(d.bout_id);
    //     });

    //     updateBoutPicker(bouts);

    //     dataset = _.first(data).user_stats;
    //     draw();
    //   })
    //   .fail(function(error) {
    //     console.error('Ajax request failed with status code: '+jqXHR.status);
    //   });
  };

  var draw = function (dataset) {
    xScale = d3.scale.linear()
                .domain([0, d3.max(dataset, function(d){
                        return d.total_calories; })])
                .range([padding, w - (padding*2)]);

    yScale = d3.scale.ordinal()
                .domain(d3.range(dataset.length))
                .rangeRoundBands([padding, h- padding], 0.1);

    svg = d3.select("#graphs-screen div")
                .append("svg")
                .attr("class", "patchgraph")
                .attr("width", w)
                .attr("height", h);

    // var xAxisLabel = d3.scale.ordinal()
    //                 .domain(["Low", "Middle", "High"])
    //                 .rangeRoundBands([padding, h - padding], 0.05);

    yAxisLabelNames = d3.scale.ordinal()
                    .domain(dataset.map(function(d){
                        return d.name;}))
                    .rangeRoundBands([padding, h - padding], 0.05);

    xAxisLabel = d3.scale.linear()
                    .domain([0, d3.max(dataset, function(d){
                        return d.total_calories; })])
                    .range([padding, w -padding]);

    xAxis = d3.svg.axis()
                    .scale(xAxisLabel)
                    .orient("bottom")
                    ;

    yAxis = d3.svg.axis()
                      .scale(yAxisLabelNames)
                      .orient("left");
                                    
    svg.append("rect")
      .attr("y", padding)
      .attr("x", padding)
      .attr("width", 200)
      .attr("height", h -padding*2)
      .attr("fill", "rgba(255,0,0, 0.3")
      .attr("class", "legendBar");

    svg.append("text")
      .text("Starving")
      .attr("text-anchor", "middle")
      .attr("y", padding -7)
      .attr("x", padding +100)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    svg.append("rect")
      .attr("y", padding)
      .attr("x", padding +200)
      .attr("width", 200)
      .attr("height", h -padding*2)
      .attr("fill", "rgba(0,255,0, 0.3")
      .attr("class", "legendBar");

    svg.append("text")
      .text("Surviving")
      .attr("text-anchor", "middle")
      .attr("y", padding -7)
      .attr("x", padding +300)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    svg.append("rect")
      .attr("y", padding)
      .attr("x", padding +400)
      .attr("width", 200)
      .attr("height", h -padding*2)
      .attr("fill", "rgba(0,0,255, 0.3")
      .attr("class", "legendBar");

    svg.append("text")
      .text("Prospering")
      .attr("text-anchor", "middle")
      .attr("y", padding -7)
      .attr("x", padding +500)
      .attr("font-family", "sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

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
          return xScale(d.total_calories);
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
      .attr("stroke", "rgb(0,0,0)");
      // .on("mouseover", function(d){    
      //   var yPosition = parseFloat(d3.select(this).attr("y")) + yScale.rangeBand() /2;
      //   var xPosition = parseFloat(d3.select(this).attr("x")) /2 + w /2;

      //   d3.select("#tooltip")
      //       .style("left", "660px")
      //       .style("top", "140px")
      //       .select("#strat")
      //       .text(d.avg_richness);
            
      //   // d3.select("#tooltip")
      //   //     .select("#graph")
      //   //     .attr("src", "img/cpg.jpg");
            
      //   d3.select("#tooltip")
      //       .select("#studentName")
      //       .text(d.name);

      //   d3.select("#tooltip").classed("hidden", false);
      // })

      // .on("mouseout", function() {
      //     d3.select("#tooltip").classed("hidden", true);
      // });

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
      .attr("class", "name-labels");

   
    svg.selectAll("text.values")
      .data(dataset)
      .enter()
      .append("text")
      .text(function(d) {
          return d.total_calories;
      })
      .attr("text-anchor", "middle")
      .attr("y", function(d, i) {
        return yScale(i) + yScale.rangeBand() /2 +4;
      })
      .attr("x", function(d) {
        return xScale(d.total_calories) +65;
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", function(d, i){
        if (i%2 === 0){
          return "blue";
        } else {
          return "red";
        }
      })
      .attr("class", "labels");


    d3.select("#yield").on("click", function(){
      // resort the graph data as well
      var sortedData = dataset.sort(function(a, b){
        return d3.ascending(a.total_calories, b.total_calories);
      });

      svg.selectAll("rect.bars")
        .sort(function(a, b){
          return d3.ascending(a.total_calories, b.total_calories);
        })
        .transition()
        .delay(function(d, i){
          return i *50;
        })
        .duration(1000)
        .attr("y", function(d, i) {
          return yScale(i);
        });

      svg.selectAll(".labels")
        .sort(function(a, b){
            return d3.ascending(a.total_calories, b.total_calories);
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

      sortLabelNames('total_calories');

      // changeGraph(sortedData);
      changeYaxis(sortedData, 'total_calories');
    });

    d3.select("#richPatch").on("click", function(){
      svg.selectAll("rect.bars")
        .sort(function(a, b){
          return d3.ascending(a.avg_richness, b.avg_richness);
        })
        .transition()
        .delay(function(d, i){
          return i *50;
        })
        .duration(1000)
        .attr("y", function(d, i) {
          return yScale(i);
        });

      svg.selectAll(".labels")
        .sort(function(a, b){
          return d3.ascending(a.avg_richness, b.avg_richness);
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

      sortLabelNames('avg_richness');

      // resort the graph data
      var sortedData = dataset.sort(function(a, b){
        return d3.ascending(a.avg_richness, b.avg_richness);
      });

      changeYaxis(sortedData, 'avg_richness');
    });

    d3.select("#patchMoves").on("click", function(){     
      svg.selectAll("rect.bars")
        .sort(function(a, b){
          return d3.ascending(a.total_moves, b.total_moves);
        })
        .transition()
        .delay(function(d, i){
          return i *50;
        })
        .duration(1000)
        .attr("y", function(d, i) {
          return yScale(i);
        });

      svg.selectAll(".labels")
        .sort(function(a, b){
            return d3.ascending(a.total_moves, b.total_moves);
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

      sortLabelNames('total_moves');

      // resort the graph data
      var sortedData = dataset.sort(function(a, b){
        return d3.ascending(a.total_moves, b.total_moves);
      });

      changeYaxis(sortedData, 'total_moves'); 
    });

    d3.select("#patchCompetition").on("click", function(){
      svg.selectAll("rect.bars")
        .sort(function(a, b){
          return d3.ascending(a.avg_competition, b.avg_competition);
        })
        .transition()
        .delay(function(d, i){
          return i *50;
        })
        .duration(1000)
        .attr("y", function(d, i) {
          return yScale(i);
        });

      svg.selectAll(".labels")
        .sort(function(a, b){
         return d3.ascending(a.avg_competition, b.avg_competition);
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

      sortLabelNames('avg_competition');

      // svg.select(".y").call(yAxis);
      // resort the graph data
      var sortedData = dataset.sort(function(a, b){
        return d3.ascending(a.avg_competition, b.avg_competition);
      });

      changeYaxis(sortedData, 'avg_competition');
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

  };

  var sortLabelNames = function (dataField) {
    svg.selectAll(".name-labels")
      .sort(function(a, b){
          return d3.ascending(a[dataField], b[dataField]);
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
  var changeYaxis = function (sortedData, dataField) {
    var yAxisLabel = d3.scale.ordinal()
      .domain(sortedData.map(function(d){
          return d[dataField];
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

  var updateBoutPicker = function(data) {
    jQuery('#bout-picker').html('');
    _.each(data, function (d, iterator) {
      //<li><a tabindex="-1" href="#" data-bout="3">Something else here</a></li>
      var listItem = jQuery('<li>');
      listItem.append('<a tabindex="-1" href="#" data-bout='+d.bout_id+'>'+d.bout_id+'</a>');
      jQuery('#bout-picker').append(listItem);
    });
  };

  Patchgraph.svg = svg;

  HG.Patchgraph = Patchgraph;

}).call(this);