var express = require('express');
var app = express();
var DB_URL = process.env.DATABASE_URL || "postgres://bsooqzlgrnlzpw:_OeBjMpdVS7A-u6vDmBNpDhgEl@ec2-54-83-59-203.compute-1.amazonaws.com:5432/dab3gubtq4co9o?ssl=true"
var pg = require('pg');
var TOTAL_POKEMON_PER_PAGE = 20

app.use(express.static(__dirname + '/public'));


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getResultJSON(sqlResult, pageNum){
	var retJson = {}
	retJson.numberOfPages = Math.floor(sqlResult.rowCount/TOTAL_POKEMON_PER_PAGE) + 1
	if(pageNum == null)
		retJson.data = sqlResult.rows.slice(0, TOTAL_POKEMON_PER_PAGE)
	else 
		retJson.data = sqlResult.rows.slice((pageNum-1) * TOTAL_POKEMON_PER_PAGE, (pageNum) * TOTAL_POKEMON_PER_PAGE)

	return retJson
}


app.get('/search',function(req,res) {
	var searchTerm = req.query.searchTerm
	var pageNum = req.query.pageNum

	pg.connect(DB_URL, function(err, client, done) {
		//No search return all pokemon
		if (searchTerm == null){
			var query = "SELECT * FROM poke_dex ORDER BY id ASC"
			client.query(query, function(err, result) {
				res.send(getResultJSON(result,pageNum));
			})
		//Search by id 
		} else if (isNumeric(searchTerm)){
			var idQuery = "SELECT * FROM poke_dex WHERE id = " + searchTerm 
			client.query(idQuery, function(err, result) {
				res.send(getResultJSON(result,pageNum));
			})
 
		} else {

			//Seach by type
		    searchTerm = searchTerm.toLowerCase()
			var typeQuery = "SELECT * FROM poke_dex WHERE type1 = \'" + searchTerm + "\' OR type2 = \'"+ searchTerm + "\' ORDER BY id ASC" 
			client.query(typeQuery, function(err, result) {
				if (result.rowCount > 0){
					res.send(getResultJSON(result,pageNum));
					return 
				} else {
					//Seach by name
				    var nameQuery = "SELECT * FROM poke_dex WHERE name like \'" + capitalizeFirstLetter(searchTerm) + "%\' ORDER BY name ASC"
					client.query(nameQuery, function(err, result) {
						var nameCount = result.rows[0].count
						res.send(getResultJSON(result,pageNum))
					})
			 	}
			})
	
    	}
	})
})


var server = app.listen(process.env.PORT || 5000, function() {

    var host = server.address().address
    var port = server.address().port

    console.log('App listening at http://%s:%s', host, port)
})
