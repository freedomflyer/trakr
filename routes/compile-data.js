var http = require('http'),
    cheerio = require('cheerio'),
    redis   = require('redis'),
    request = require('request'),
    url     = require('url'),
    fs = require('fs')
    ;

if(process.env.REDISCLOUD_URL) {
    var redisURL = url.parse(process.env.REDISCLOUD_URL);
    var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
    client.auth("G4mOHQyUPcdQ2PLS");
}
else {
    var client = redis.createClient();
}



exports.compileAthletes = function(req, res){
	
	var athletes = [];
    var obj;
    fs.readFile('teams.js', 'utf8', function (err, data) {
      if (err) throw err;
      eval(data);
      //res.json(autocomplete_teams);

		for (var i in autocomplete_teams) {
			if(i < 500)
			{
			var team = autocomplete_teams[i];
			console.log("Getting roster for " + team.url);
			request("http://www.tfrrs.org" + team.url, function(error, res, content) {
		        var $ = cheerio.load(content);

		        $('td.name a').each(function(i, elem) {
		        	var athleteTfrrsURL = $(this).attr('href');
		        	var athleteName = $(this).text();
		        	
								


								// START RUNNER INFO
								if(athleteTfrrsURL != "#")
								{
								console.log("getting " + athleteTfrrsURL);		            
								request(athleteTfrrsURL, function(error, res, athContent) {
									console.log(athleteTfrrsURL);
									if(error) {
										console.log(error);
									}
									var localAthURL = athleteTfrrsURL;
							        var cheerioPage = cheerio.load(athContent);
							        
							        var athlete = {};

							        cheerioPage('#athlete').find(".title").find("h2").each(function() {
							            athlete.name = cheerioPage(this).text().trim();
							        });


							        athlete.tfrrs_id = req.params.id;
							        athlete.tfrrs_url = athleteTfrrsURL;
							        athlete.bests = [];
							        athlete.races = [];

							        // Bests Logic
							        var headings = cheerioPage(".topperformances > :first-child > :first-child > :first-child").children().toArray();
							        cheerioPage(".marked").each(function(){
							            var numBefore = cheerioPage(this).parent().prevAll().length;
							            var eventName = headings[numBefore].children[0].children[0].data.replace(/\s+/g, '');
							            athlete.bests.push({event : eventName, time : cheerioPage(this).text()});       
							        });

							        //Loop through data for each table entry for the athlete.
							        cheerioPage('#results_data').find(".even").each(function() {
							            
							            athlete.races.push({
							                "date"  : cheerioPage(this).find(".date").text().trim(),
							                "meet"  : cheerioPage(this).find(".meet").text().trim(),
							                "event" : cheerioPage(this).find(".event").text().trim(),
							                "mark"  : cheerioPage(this).find(".mark").text().trim(),
							                "place" : cheerioPage(this).find(".place").text().trim()
							            });
							        });

							        client.set(athleteTfrrsURL, JSON.stringify(athlete));
							       	
							    });
								}
								// END RUNNER INFO

		        });
			

		    });
}
		}
      
    });



}



function getRoster(teamURL){

    request("http://www.tfrrs.org" + teamURL, function(error, res, content) {
        var $ = cheerio.load(content);

        var athletes = [];
        $('td.name a').each(function(i, elem) {
            athletes.push({url: $(this).attr('href'), name: $(this).text()});
        });

        // Delete first entry, it's wrong
        athletes.splice(0, 1);

        return athletes;
    });
	
}