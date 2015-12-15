var express = require('express');
var app = express();
var DB_URL = process.env.DATABASE_URL || "postgres://bsooqzlgrnlzpw:_OeBjMpdVS7A-u6vDmBNpDhgEl@ec2-54-83-59-203.compute-1.amazonaws.com:5432/dab3gubtq4co9o?ssl=true"
var pg = require('pg');

app.use(express.static(__dirname + '/public'));


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getReturnJSON(sqlResults){
	return sqlResults;
}


app.get('/hello',function(req,res) {
	var searchTerm = req.query.search.toLowerCase()



	var selectQuery = "SELECT * FROM poke_dex"

	pg.connect(DB_URL, function(err, client, done) {
		if (isNumeric(searchTerm)){
			var idQuery = selectQuery  + " WHERE id = " + searchTerm 
			client.query(idQuery, function(err, result) {
				res.send(getReturnJSON(result));
			})
 
		} else {
			var typeQuery = " WHERE type1 = \'" + searchTerm + "\' OR type2 = \'"+ searchTerm + "\' ORDER BY id ASC" 
			var nameQuery = " WHERE name like \'" + capitalizeFirstLetter(searchTerm) + "\'%' ORDER BY name ASC"

			var countQuery = "SELECT count(*) FROM poke_dex"
			client.query(countQuery + typeQuery, function(err, result) {
				var typeCount = result.rows[0].count
				client.query(countQuery + nameQuery, function(err, result) {
					var nameCount = result.rows[0].count
					var finalQuery = selectQuery
					if (nameCount >= typeCount){
					    finalQuery += nameQuery
					} else {
						finalQuery += typeQuery
					}		

					client.query(finalQuery, function(err, result) {
						res.send(getReturnJSON(result));
					})

				})
			})
 

		}
	
    })
})


var server = app.listen(process.env.PORT || 5000, function() {

    var host = server.address().address
    var port = server.address().port

    console.log('App listening at http://%s:%s', host, port)
})
