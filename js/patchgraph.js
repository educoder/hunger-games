
(function() {
  "use strict";
  var Patchgraph = this.Patchgraph || {};
  var HG = this.HG || {};                     // TODO: refactor this to Hunger? HungerGames?

  // Information for REST calls to dataset
  var baseUrl = null;
  var DATABASE = null;
  var runId = null;


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


  Patchgraph.init = function (drowsyUrl, database, run) {
    baseUrl = drowsyUrl;
    DATABASE = database;
    runId = run;

    fetchDataSetAndRedraw();
  };

  Patchgraph.refresh = function () {
    d3.select(".patchgraph").remove();

    fetchDataSetAndRedraw();
  };

  Patchgraph.showGraphForBout = function(bout) {
    d3.select(".patchgraph").remove();

    // retrieve data for selected bout
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
  var fetchDataSetAndRedraw = function () { 
    var jqXHR = jQuery.ajax(baseUrl+'/'+DATABASE+'/statistics?selector=%7B%22run_id%22%3A%22'+runId+'%22%7D')
      .done (function (data) {
        console.log('successfully fetched patchgraph data');
        updateBoutPicker(data);

        draw(_.first(data).user_stats);
        statistics_data = data;
      })
      .fail(function(error) {
        console.error('Ajax request failed with status code: '+jqXHR.status);
      });
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
      // .attr("fill", "rgba(255,0,0, 0.3")
      .attr("class", "legendBar legendBar1");

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
      // .attr("fill", "rgba(0,255,0, 0.3")
      .attr("class", "legendBar legendBar2");

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
      // .attr("fill", "rgba(0,0,255, 0.3")
      .attr("class", "legendBar legendBar3");

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