'use strict';

angular.module('tfrrsExplorerApp')
  .controller('MainCtrl', function ($http, $scope, MyService) {

    console.log('Promise is now resolved: ' + MyService.doStuff().data);
  	$scope.teams = MyService.doStuff();
  	console.log($scope.teams);
    $scope.athletes = [{test:"testing"}];


  	$scope.getRoster = function(url, index) {
	    $http.get("/teams/roster" + url).success(function (data) {
        $scope.athletes = data;
        $scope.selectedRoster = index;

        console.log($scope.athletes);

      }); 

  	}

    $scope.getStats = function(url, index) {

      var athleteID = url.match(/\d+/g)[0];  
      $http.get("/athlete/" + athleteID).success(function (data) {
        $scope.selectedAthlete = index;
        $scope.athleteData = data;
        console.log(data);

        assembleAthleteEventHistory($scope.athleteData.races);
      }); 
    }

    $scope.charts = [];
    function assembleAthleteEventHistory(races){
      var eventHistory = {};

      //Unique events athlete has run
      var athEvents = _.pluck(_.uniq(races, 'event'), 'event');

      //Compile all data for each event
      _.each(athEvents, function(event){
        eventHistory[event] = _.filter(races, function(race){
          return race.event == event;
        });
      });

      console.log(eventHistory);
      createChartData(eventHistory);
    }

    function createChartData(eventHistory) {
      
      for(event in eventHistory){
        if(eventHistory[event].length <= 1)
          continue;
        var raceHistory = [];
        _.each(eventHistory[event], function(performance){
          var raceTime = moment.duration("00:" + performance.mark)._milliseconds / 1000 / 60 ;
          //var raceTime = performance.mark

          raceHistory.push([performance.date + " - " + performance.meet, raceTime]);
        });

        raceHistory.push(["Race", "Time"]);
        raceHistory = raceHistory.reverse();

        //var formatterRace = new google.visualization.DateFormat({pattern: "mm:ss.SS"});

        $scope.charts.push({
          "type": "LineChart",
          "cssStyle": "height:350px; width:100% margin:auto;",
          "data": raceHistory,
          "options": {
            "lineWidth": 7,
            "title": event,
            "isStacked": "true",
            "fill": 20,
            "displayExactValues": true,
            "vAxis": {
              "title": "Time",
              "gridlines": {
                "count": 6
              }
            },
            "hAxis": {
              "title": "Race"
            }
          },
          "formatters": {
            date: [
              {
                columnNum: 1,
                pattern: "mm:ss.SS"
              }
            ]
          },
          "displayed": true
        });
      }

    }


    




  });
