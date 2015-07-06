var COLORS = ["green", "red", "blue", "blueViolet", "coral", "crimson", "brown", "aqua", "cornFlowerBlue", "chartreuse", "chocolate", "darkBlue", "greenYellow", "indigo"];

function createGraph(map, data, type, container) {
    //if no graph get selected or selected table, display table
    if (!map.graph || map.graph == "Table") {
        return new Table(data);
    }
    //if 2 teams are selected
    if (map.team1 && map.team2) {
        var teams = [map.team1, map.team2];
        filteredData = getPerformanceOfTeams(teams, data);
        return new PieChart(filteredData.title, filteredData.data, container);
    }
    //if venue is selected
    if (map.venue) {
        var drawingData = getWinningPercentageByVenue(map.team1, map.venue, data);
        return new PieChart(drawingData.title, drawingData.data, container);
    }
    //if country is selected
    if (map.country) {
        //if a year is passed in along with country, draw pie graph
        if (map.year || map.team1 || (map.season && map.season == "final")) {
            //if the season is final ,draw pie chart, if it is regular, draw line chart
            var drawingData = getWinningPercentageByVenue(map.team1, map.venue, data);
            return new PieChart(drawingData.title, drawingData.data, container);
        }
        filteredData = getCountryTeamsPerformance(map.country, null, null, data);
        return new LineGraph(filteredData.title, filteredData.data, filteredData.minX, filteredData.minY, filteredData.maxX, filteredData.maxY, container);
    }
    //if one team is selected
    if (map.team1) {
        //a year may be passed in, 
        //a season may be passed in
        var filteredData = getTeamScoreOverYears(map.team1, null, null, data);
        return new LineGraph(filteredData.title, filteredData.data, filteredData.minX, filteredData.minY, filteredData.maxX, filteredData.maxY, container);
    }
    //if a year is selected
    if (map.year) {
        var drawingData = getTeamScoreForYear(data);
        return new BarChart(drawingData.title, drawingData.data, container);
    }

    //if didn't meet any of the conditions, display table
    return new Table(data);
}

function removeGraph(graph){
	for(var i = 0; i < graph.elements.length; i++){
		graph.elements[i].remove();
	}
}

function Table(data) {
    var titles = ["Year", "Round", "Home Team", "Score", "Away Team", "Venue"];

    var table = d3.select("body").append("table").classed("table", true);

    this.elements = [];
    this.elements[0] = table;

    table.append("thead")
        .append("tr")
        .selectAll("th")
        .data(titles)
        .enter()
        .append("th")
        .text(function (d) { return d; })

    table.append("tbody")
        .selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .attr("class",function(d,i){if(i%2 == 1){return "alt"}})
        .selectAll("td")
        .data(function (d, i) {
            return [d.year,d.round,d.homeTeam,d.homeTeamScore+"-"+d.awayTeamScore,d.awayTeam,d.venue];
        }).enter()
        .append("td")
        .html(function (d, i) { return d; });
}

function LineGraph(title, data, minX, minY, maxX, maxY, container){
	var graphWidth = width - offsetLeft-offsetRight;
	var graphHeight = 480;
	var marginTop = 40;
	
	var lineColorIdx = 0;
	
	var x = d3.scale.linear().domain([minX,maxX]).range([0, graphWidth]);
	var y = d3.scale.linear().domain([minY,maxY]).range([graphHeight, 0]);
	
	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var yAxis = d3.svg.axis().scale(y).orient("left");
	
	var line = d3.svg.line()
					.x(function(d) { return x(d.x); })
					.y(function(d) { return y(d.y); })
					
	this.elements = [];
	
	this.elements[this.elements.length] = container.append("g")
											.attr("class","axis")
											.attr("transform","translate("+offsetLeft+","+(graphHeight+offsetTop+marginTop)+")")
											.call(xAxis);
	this.elements[this.elements.length] = container.append("g")
											.attr("class","axis")
											.attr("transform","translate("+offsetLeft+","+(offsetTop+marginTop)+")")
											.call(yAxis);
	
	for (var i = 0; i < data.length; i++){
		var path = container.append("path")
					.attr("class","graphLine")
					.attr("d",line(data[i].data))
					.attr("stroke",COLORS[lineColorIdx%COLORS.length])
					.attr("stroke-width",2)
					.attr("fill", "none")
					.attr("transform","translate("+offsetLeft+","+(offsetTop+marginTop)+")")
					.style("stroke", function(d) { return COLORS[i]; });
		
		var totalLength = path.node().getTotalLength();

		path.attr("stroke-dasharray", totalLength + " " + totalLength)
			.attr("stroke-dashoffset", totalLength)
			.transition()
			.duration(1000)
			.ease("linear")
			.attr("stroke-dashoffset", 0);
			
		this.elements[this.elements.length] = path;
			
		var points = container.selectAll(".point")
			.data(data[i].data)
			.enter().append("svg:circle")
				.attr("stroke", "black")
				.attr("fill", COLORS[i])
				.attr("cx", function(d) { return x(d.x); })
				.attr("cy", function(d) { return y(d.y); })
				.attr("r", 3)
				.attr("transform","translate("+offsetLeft+","+(offsetTop+marginTop)+")");
						
		this.elements[this.elements.length] = points;
				
		this.elements[this.elements.length] = container.append("text")
												.attr("transform", "translate(" + (graphWidth-60) + "," + (offsetTop+marginTop+100+30*i) + ")")
												.attr("dy", ".35em")
												.attr("text-anchor", "start")
												.attr("font-size", "80%")
												.style("fill", COLORS[lineColorIdx%COLORS.length])
												.text(data[i].text);
		
		lineColorIdx++;
	}
	
	this.elements[this.elements.length] = container.append("text")
											.attr("text-anchor", "middle")
											.attr("transform", "translate(" + (graphWidth/2) + "," + offsetTop + ")")
											.style("font-size", "150%")
											.text(title);
	
}

function BarChart(title, data, container){
	var graphWidth = width - offsetLeft-offsetRight;
	var graphHeight = 480;
	var marginTop = 40;
	
	var x = d3.scale.ordinal().domain(data.map(function (d) { return d.team })).rangeRoundBands([0, graphWidth],0.1);
	var y = d3.scale.linear().domain([0,d3.max(data,function(d){return d.score;})]).range([graphHeight, 0]);
	
	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var yAxis = d3.svg.axis().scale(y).orient("left");
	
	this.elements = [];
	
	this.elements[this.elements.length] = container.append("g")
											.attr("class", "axis barX")
											.attr("transform","translate("+offsetLeft+","+(graphHeight+offsetTop+marginTop)+")")
											.call(xAxis);
	this.elements[this.elements.length] = container.append("g")
											.attr("class","axis")
											.attr("transform","translate("+offsetLeft+","+(offsetTop+marginTop)+")")
											.call(yAxis);
											
	this.elements[this.elements.length] = container.selectAll(".bar")
		.data(data)
		.enter().append("rect")
					.attr("class", "bar")
					.attr("x", function(d) { return x(d.team); })
					.attr("width", x.rangeBand())
					.attr("y", function(d) { return y(d.score); })
					.attr("height", function (d) { return graphHeight - y(d.score); })
					.attr("fill", COLORS[0])
					.attr("transform","translate("+offsetLeft+","+(offsetTop+marginTop)+")")
			
	this.elements[this.elements.length] = container.append("text")
											.attr("transform", "translate(" + (graphWidth-60) + "," + (offsetTop+marginTop+100+30) + ")")
											.attr("dy", ".35em")
											.attr("text-anchor", "start")
											.attr("font-size", "80%")
											.style("fill", COLORS[0])
											.text(data[0].text);
	
	this.elements[this.elements.length] = container.append("text")
											.attr("text-anchor", "middle")
											.attr("transform", "translate(" + (graphWidth/2) + "," + offsetTop + ")")
											.style("font-size", "150%")
											.text(title);
	
}

function PieChart(title, data, container){
	var graphWidth = width - offsetLeft - offsetRight;
	var graphHeight = 480;
	
	var marginTop = 100;
	
	var radius = Math.min(graphWidth, graphHeight)/2;
	
	var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);
		
	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.data; });
					
	this.elements = [];
	
	var g = container.append("g")
		.attr("transform", "translate(" + graphWidth / 2 + "," + (graphHeight / 2 + marginTop)+ ")");
		
	this.elements[this.elements.length] = g;

	var g2 = g.selectAll(".arc")
		.data(pie(data))
		.enter().append("g")
		.attr("class", "arc");
	
	this.elements[this.elements.length] = g2;
	
	g2.append("path")
		.attr("d", arc)
		.style("fill", function(d, i) { return COLORS[i]; });

	g2.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.style("fill", "white")
		.style("font-size", "70%")
		.text(function(d, i) { return data[i].text+": "+data[i].data; });
		
	this.elements[this.elements.length] = container.append("text")
											.attr("text-anchor", "middle")
											.attr("transform", "translate(" + (graphWidth/2) + "," + offsetTop + ")")
											.style("font-size", "150%")
											.text(title);
}

function checkSeason(season, round){
	if (season == "regular"){
		return (round >= 1 && round <= 14);
	}
	else if (season == "final"){
		minRound = 14;
		return (round >= 15);
	}
	return true;
}

/**
 * format: [{year, [{round, score}]}], x-axis is the week, y-axis is the score, each line is for a season
 */
function getTeamScoreOverYears(teamName, season, year, data){
	var minScore = Infinity;
	var maxScore = 0;
	var minRound = 0;
	var maxRound = 0;
	
	var filteredData = [];
	var currentData = [];
	var currentYear = null;
	
	if (season == "final"){
		minRound = 14;
	}
	
	for (var i = 0; i < data.length; i++){
		// if it either just has started the iteration, set the current year into the year of the data it is reading
		// if it has different year, or it is at the end then put it into the returning data
		if (currentYear == null){
			currentYear = data[i].year;
		}
		else if (currentYear != data[i].year || i == data.length-1){
			filteredData[filteredData.length] = {text:currentYear, data:currentData};
			currentData = [];
			currentYear = data[i].year;
		}
		
		if (checkSeason(season, data[i].round)){
		
			if (year == null || year == currentYear){
				if (data[i].homeTeam == teamName){
					currentData[currentData.length] = {x:+data[i].round, y:data[i].homeTeamScore};
					if (+data[i].round > maxRound){
						maxRound = +data[i].round;
					}
					if (data[i].homeTeamScore > maxScore){
						maxScore = data[i].homeTeamScore;
					}
					if (data[i].homeTeamScore < minScore){
						minScore = data[i].homeTeamScore;
					}
				}
				else if(data[i].awayTeam == teamName){
					currentData[currentData.length] = {x:+data[i].round, y:data[i].awayTeamScore};
					if (+data[i].round > maxRound){
						maxRound = +data[i].round;
					}
					if (data[i].awayTeamScore > maxScore){
						maxScore = data[i].awayTeamScore;
					}
					if (data[i].awayTeamScore < minScore){
						minScore = data[i].awayTeamScore;
					}
				}
			}
		}
	}
	
	return {title:teamName.toUpperCase()+" - THE PERFORMANCE/TOTAL SCORE STATISTICS", data:filteredData, minX:minRound, minY:minScore, maxX:maxRound+2, maxY:maxScore};
}


/**
 * Prerequest: the data passed in should be single year
 * format: {title,data:[{team, score}]}
 */
function getTeamScoreForYear(data) {
    var scores = {};
    var returnData = [];

    for (var i = 0; i < data.length; i++) {
        scores[data[i].homeTeam] = scores[data[i].homeTeam] ? scores[data[i].homeTeam] + data[i].homeTeamScore : data[i].homeTeamScore;
        scores[data[i].awayTeam] = scores[data[i].awayTeam] ? scores[data[i].awayTeam] + data[i].awayTeamScore : data[i].awayTeamScore;
    }

    var keys = Object.keys(scores);
    for(var i=0;i<keys.length;i++){
        returnData[returnData.length] = {team:keys[i],score:scores[keys[i]]};
    }

    return { title: "THE SCORES OF TEAMS IN YEAR: " + data[0].year, data: returnData };
}

/**
 * format: [teamName, [{year, score}]], x-axis is the year, y-axis is the score
 */
function getCountryTeamsPerformance(country, season, year, data){
	var teams = [];
	var years = [];
	var filteredData = [];
	var teamTotalScore = [];
	
	for (var i = 0; i < data.length; i++){
		if (year == null || data[i].year == year){
			if (season == null || checkSeason(season, data[i].round)){
				if (getTeamCountry(data[i].homeTeam) == country){
					// add the team name if it is not in the list
					if (teams.indexOf(data[i].homeTeam) < 0){
						teams[teams.length] = data[i].homeTeam;	
					}
					// add the year when the team plays
					if (years.indexOf(data[i].year) < 0){
						years[years.length] = data[i].year;
					}
					if (typeof teamTotalScore[data[i].homeTeam] === "undefined"){
						teamTotalScore[data[i].homeTeam] = [];
					}
					if (typeof teamTotalScore[data[i].homeTeam][data[i].year] === "undefined"){
						teamTotalScore[data[i].homeTeam][data[i].year] = data[i].homeTeamScore;
					}
					else {
						teamTotalScore[data[i].homeTeam][data[i].year] += data[i].homeTeamScore;
					}
				}
				if (getTeamCountry(data[i].awayTeam) == country){
					// add the team name if it is not in the list
					if (teams.indexOf(data[i].awayTeam) < 0){
						teams[teams.length] = data[i].awayTeam;	
					}
					// add the year when the team plays
					if (years.indexOf(data[i].year) < 0){
						years[years.length] = data[i].year;	
					}
					if (typeof teamTotalScore[data[i].awayTeam] === "undefined"){
						teamTotalScore[data[i].awayTeam] = [];
					}
					if (typeof teamTotalScore[data[i].awayTeam][data[i].year] === "undefined"){
						teamTotalScore[data[i].awayTeam][data[i].year] = data[i].awayTeamScore;
					}
					else {
						teamTotalScore[data[i].awayTeam][data[i].year] += data[i].awayTeamScore;
					}
				}
			}
		}
	}
	
	var maxTotalScore = 0;
	
	for (var i = 0; i < teams.length; i++){
		var totalPointsPerYear = [];
		for (var j = 0; j < years.length; j++){
			var totalScore = teamTotalScore[teams[i]][years[j]];
			if (totalScore > maxTotalScore){
				maxTotalScore = totalScore;
			}
			totalPointsPerYear[totalPointsPerYear.length] = {x:years[j], y:totalScore};
		}
		filteredData[filteredData.length] = {text:teams[i], data:totalPointsPerYear};
	}
	
	return {title:"THE PERFORMANCE/TOTAL SCORE OF EACH TEAM FROM "+country.toUpperCase(), data:filteredData, minX:Math.min.apply(Math, years)-1, minY:0, maxX:Math.max.apply(Math, years)+1, maxY:maxTotalScore};
}

/**
 * format: [{text:team, data:score}]
 */
function getPerformanceOfTeams(teams, data){
	var filteredData = [];
	
	// initialise the score
	for (var i = 0; i < teams.length; i++){
		filteredData[filteredData.length] = {text:teams[i], data:0};
	}
	
	// get the total score of each team
	for (var i = 0; i < data.length; i++){
		for (var j = 0; j < teams.length; j++){
			if (data[i].homeTeam == teams[j]){
				filteredData[j].data += data[i].homeTeamScore; 
			}
			else if (data[i].awayTeam == teams[j]){
				filteredData[j].data += data[i].awayTeamScore;
			}
		}
	}
	return {title:"THE PERFORMANCE/TOTAL SCORE IN ALL SEASONS - "+teams[0].toUpperCase()+" VS "+teams[1].toUpperCase(), data:filteredData};
}

function getWinningPercentageByVenue(team, venue, data) {
	var returnData = [];
	var winCount = {};
	
	for (var i = 0; i < data.length; i++){
	    if (data[i].homeTeamScore > data[i].awayTeamScore) {
	        winCount[data[i].homeTeam] = winCount[data[i].homeTeam] ? winCount[data[i].homeTeam] + 1 : 1;
	    } else if (data[i].awayTeamScore > data[i].homeTeamScore) {
	        winCount[data[i].awayTeam] = winCount[data[i].awayTeam] ? winCount[data[i].awayTeam] + 1 : 1;
	    } else {
            //draw, do nothing
	    }
	}

	if (team) {
	    var win = winCount[team] ? winCount[team] : 0;
	    returnData[returnData.length] = { text: "Win", data: win };
	    returnData[returnData.length] = { text: "Lose", data: (data.length - win) };
	    if (venue) {
	        return { title: "WIN/LOSE PERCENTAGE OF " + team.toUpperCase() + " IN " + venue.toUpperCase(), data: returnData };
	    } else {
	        return { title: "WIN/LOSE PERCENTAGE OF " + team.toUpperCase(), data: returnData };
	    }
	    
	}else{
	    var keys = Object.keys(winCount);
	    for (var i = 0; i < keys.length; i++) {
	        returnData[returnData.length] = { text: keys[i], data: winCount[keys[i]] };
	    }
	    if (venue) {
	        return { title: "WINNING PERCENTAGE OF TEAMS IN " + venue.toUpperCase(), data: returnData };
	    } else {
	        return { title: "WINNING PERCENTAGE OF TEAMS", data: returnData };
	    }
	}
}