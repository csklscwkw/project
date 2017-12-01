var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();

var mongourl = 'mongodb://oliver:oliver@ds121716.mlab.com:21716/project';
var http = require('http');
var url  = require('url');
var MongoClient = require('mongodb').MongoClient; 
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var fileUpload = require('express-fileupload');
var fs = require('fs');
var ExifImage = require('exif').ExifImage;
var formidable = require('formidable');
var base64 = require('node-base64-image');

var userid ;
var c = false;
var account = {};
var checkERR ;
var tempValue ;
var tempCriteria ;


app.set('view engine','ejs');
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

var users = new Array(
	{name: 'developer', password: 'developer'},
	{name: 'guest', password: 'guest'}
);

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));

app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/public/login.html');
});

app.post('/login',function(req,res) {
	var u = req.body.name;
	var p = req.body.password;
	var temp = {"user":u, "password":p};
	console.log("temp: "+ temp);
	// connect server & check user password
	MongoClient.connect(mongourl, function(err,db){
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('user').findOne(temp, function(err,result){
			assert.equal(err,null);
			if(result!=null){
				console.log("true");
				req.session.authenticated = true;
				req.session.username = u;
			}else{
				console.log("false!!!!!!");
			}
			console.log("result :"+JSON.stringify(result));
			res.redirect('/');
			
		});
		db.close();
	});
});
app.get('/create', function(req,res){
	res.sendFile(__dirname + '/public/create.html');
});
app.post('/create', function(req,res){
	var u = req.body.name;
	var p = req.body.password;
	var temp = {"user":u, "password":p};
	account = temp;
	var check = {"user":u};
	console.log("temp: "+ JSON.stringify(temp));
	// connect server & check user password
	console.log("go to create");

	
	MongoClient.connect(mongourl, function(err,db){
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('user').findOne(check,function(err,result){
			assert.equal(err,null);
			if(result!=null){
				console.log("same user ");
				res.redirect('/create');
			}else{
				c = true;
				console.log('access');
				req.session.authenticated = true;
				req.session.username = u;
				res.redirect('/go');
			}
			
		});
		db.close();

	});
	// insert db
	/*
	MongoClient.connect(mongourl, function(err,db){
		console.log("checking");
		if(c){
			db.collection('user').insert(temp, function(err,result){
				assert.equal(err,null);
				if(result!=null){
					console.log("success");
					req.session.authenticated = true;
					req.session.username = u;
					res.redirect('/');
				}else{
					console.log("error");
				}
				console.log("result :"+JSON.stringify(result));
				
			});
			db.close();
		}
		res.redirect('/');
	});
	*/
});

app.get('/go',function(req,res) {
	if(c){
		console.log("result :"+JSON.stringify(account));
		MongoClient.connect(mongourl, function(err,db){
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			db.collection('user').insert(account, function(err,result){
				assert.equal(err,null);
				if(result!=null){
					console.log("success");
					
				}else{
					console.log("error");
				}
				console.log("result :"+JSON.stringify(result));
				res.redirect('/');
				
			});
			db.close();
		});
	}else{
		res.redirect('/create');
	}
});




app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});

app.get('/new', function(req,res){
	if(!req.session.authenticated){
		console.log("session null");
		res.redirect('/login');
	}else {
		console.log("session inside");
		res.status(200);
		res.render("restaurantForm");
		//res.sendFile(__dirname + '/public/add.html');
	}
});

app.post('/uploadRestaurant', function(req,res){
	var check = true;

	try{
		var filename = req.files.filetoupload.name;
		var mimetype = req.files.filetoupload.mimetype;
		
	}catch(err){
		check  = false;
	}
	var name = req.body.name;
	var borough = req.body.borough;
	var cuisine = req.body.cuisine;

	var street = req.body.street;
	var building = req.body.building;
	var zipcode = req.body.zipcode;
	
	var lon = req.body.lon;
	var lat = req.body.lat;
	var coord = [lon, lat];
	//var gradedUser;
	//var score;
	//var grade = [score, gradedUser];
	var owner = req.session.username;

	var new_r = {};
	var gradeArray = [];
	if(check){
		fs.readFile(filename, function(err,data) {
			
			new_r['image'] = new Buffer(data).toString('base64');
			new_r['mimetype'] = mimetype;
		});
	}
	MongoClient.connect(mongourl,function(err,db) {
		

		var address = {};
		address['street'] = street;
		address['building'] = building;
		address['zipcode'] = zipcode;
		address['coord'] = coord;
		console.log(address);


		var grade = {};
		//grade['user'] = "";
		//grade['score'] = 0;
		gradeArray[0]= grade;
		console.log("~~~~~~~~~~~~~~", gradeArray);

		new_r['name'] = name;
		new_r['borough'] = borough;
		new_r['cuisine'] = cuisine;
		new_r['address'] = address;
		//console.log("address    :" + JSON.stringify(new_r['address']));
		
		new_r['grade'] = gradeArray;
		
		new_r['owner'] = owner;
		
		db.collection('restaurant').insert(new_r, function(err,result){
			assert.equal(err,null);
			if(result!=null){
				console.log("success of new restaurant");
			}else{
				console.log("error");
			}
			db.close();
			res.status(200);
			res.end('You have added a new restaurant information');
		});
	});
});


app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(err, null);
			console.log('Connected to MongoDB');

			var criteria = {};
			findRestaurant(db,criteria,{},function(restaurantList) {
			  db.close();
			  console.log('Disconnected MongoDB');
			//   console.log('Photo returned = ' + photo.length);
			//   console.log('GPS = ' + JSON.stringify(photo[0].exif.gps));
			//   var lat = -1;
			//   var lon = -1;
			//   if (photo[0].exif.gps &&
			// 	  Object.keys(photo[0].exif.gps).length !== 0) {
			// 	var lat = gpsDecimal(
			// 	  photo[0].exif.gps.GPSLatitudeRef,  // direction
			// 	  photo[0].exif.gps.GPSLatitude[0],  // degrees
			// 	  photo[0].exif.gps.GPSLatitude[1],  // minutes
			// 	  photo[0].exif.gps.GPSLatitude[2]  // seconds
			// 	);
			// 	var lon = gpsDecimal(
			// 	  photo[0].exif.gps.GPSLongitudeRef,
			// 	  photo[0].exif.gps.GPSLongitude[0],
			// 	  photo[0].exif.gps.GPSLongitude[1],
			// 	  photo[0].exif.gps.GPSLongitude[2]
			// 	);
			//   }
			//   console.log(lat,lon);      
			  res.status(200);
			  res.render("homepage",{restaurants:restaurantList, user: req.session.username});
			});
		});
		
	}
});

app.get("/display", function(req, res){
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(err, null);
			console.log('Connected to MongoDB');

			var criteria = {};
			criteria['_id'] = ObjectId(req.query._id);			
			findRestaurant(db,criteria,{},function(restaurantList) {
			  db.close();
			  console.log('Disconnected MongoDB');   
			  res.status(200);
			  res.render("details",{grade:restaurantList[0].grade, restaurant:restaurantList[0], sessionUser:req.session.username});			  
			//   var temp = [];
			//   for(var i in restaurantList[0].grade){
			// 	temp.push(JSON.stringify(restaurantList[0].grade[i].user));
			// 	temp.push(JSON.stringify(restaurantList[0].grade[i].score));
				
			//   }
			//   console.log(temp);
			//   res.render("details",{grade:temp,restaurant:restaurantList[0], sessionUser:req.session.username});
			});
		});
		
	}
});

function findRestaurant(db,criteria,fields,callback) {
	var cursor = db.collection("restaurant").find(criteria);
	var restaurantList = [];
	cursor.each(function(err,doc) {
	  assert.equal(err,null);
	  if (doc != null) {
		restaurantList.push(doc);
	  } else {
		callback(restaurantList);
		console.log("return  restaurantList");
	  }
	});
}
app.get("/delete", function(req, res){
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(err, null);
			console.log('Connected to MongoDB');

			var criteria = {};
			criteria['_id'] = ObjectId(req.query._id);
			deleteRestaurant(db,criteria,function(result) {
				db.close();
				console.log('Disconnected MongoDB');   
				res.status(200);
				res.end("You have deleted a information");
			  });			

		});
		
	}
});

function deleteRestaurant(db,criteria,callback) {
	db.collection('restaurant').deleteMany(criteria,function(err,result) {
	  assert.equal(err,null);
	  console.log("delete was successful!");
	  console.log(JSON.stringify(result));
	  callback(result);
	});
  }

  app.get("/edit", function(req,res){
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(err, null);
			console.log('Connected to MongoDB');
			var criteria = {};
			criteria['_id'] = ObjectId(req.query._id);
			console.log('inside edit... display id: '+ criteria['_id']);	
			findRestaurant(db,criteria,{},function(restaurantList) {
				db.close();
				console.log('Disconnected MongoDB');   
			res.status(200);
			res.render("edit",{restaurant:restaurantList[0]});
			});
		});
	}
});

app.post("/edit",function(req,res){
	var criteria={};
	criteria['_id'] = ObjectId(req.body.id);
	console.log("---------------");
	console.log(criteria);
	var vaildFile = false;
	if(req.files.filetoupload)
	{ 	
		vaildFile = true;
		var mimetype = req.files.filetoupload.mimetype;
		var filename = req.files.filetoupload.name;
	}

	var name = req.body.name;
	var borough = req.body.borough;
	var cuisine = req.body.cuisine;

	var street = req.body.street;
	var building = req.body.building;
	var zipcode = req.body.zipcode;
	
	var lon = req.body.lon;
	var lat = req.body.lat;
	var coord = [lon, lat];
	var owner = req.session.username;

	var newValues = {};
	
		if(vaildFile){
			fs.readFile(filename, function(err,data) {
				newValues['image'] = new Buffer(data).toString('base64');
			});
			newValues['mimetype'] = mimetype;
		}
			
			MongoClient.connect(mongourl,function(err,db) {

			var address = {};
			address['street'] = street;
			address['building'] = building;
			address['zipcode'] = zipcode;
			address['coord'] = coord;
			console.log(address);

			newValues['name'] = name;
			newValues['borough'] = borough;
			newValues['cuisine'] = cuisine;

			newValues['address'] = address;
			//console.log("address    :" + JSON.stringify(new_r['address']));

			newValues['owner'] = owner;
			//console.log("newValues:", newValues);
			console.log("DB", db);
			console.log("Crit", criteria);
			console.log("newValues", newValues);
					updateRestaurant(db,criteria,newValues,function(result) {
						db.close();
						res.redirect('/');	
						//res.end("update was successful!");		
					});
				});
});

function updateRestaurant(db,criteria,newValues,callback) {
	db.collection('restaurant').updateOne(
		criteria,{$set: newValues},function(err,result) {
			assert.equal(err,null);
			console.log("update was successfully");
			callback(result);
	});
}

app.get('/rate', function(req,res){
	if(!req.session.authenticated){
		console.log("session null");
		res.redirect('/login');
	}else {
		console.log("session inside");
		var criteria = [];
		res.status(200);
		res.render("rate", {id:req.query._id});
	}
});

app.post('/rate', function(req,res){
	var score = req.body.score;
	var name = req.session.username;
	var criteria = {};
	criteria['_id'] = ObjectId(req.body.id);
	

	var grade ={};
	grade['user'] = name;
	grade['score'] = score;
	
	
	var newValues= {};
	newValues['grade'] = grade;



	console.log(score+ name);
	console.log("Crit", criteria);
	console.log("grade", grade);
	console.log("newValues", newValues);

	
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		
		findRestaurant(db,criteria,{},function(restaurantList) {
			
			
			var temp = {};
			temp['user'] = name;
			checkERR = true;
			for(var i in restaurantList[0].grade){
			  if(temp['user'] == restaurantList[0].grade[i].user){
				console.log("user already give the mark!!");
				checkERR = false;
			  }
			  //console.log(JSON.stringify(restaurantList[0].grade[i].user));
			}
			if(checkERR){
				tempCriteria = criteria;
				tempValue = newValues;
				res.redirect('/goToRate');
			}else{
				res.redirect('/');
			}
			
		});
		
		
	});
});

app.get('/goToRate', function(req,res){
	if(checkERR){
		MongoClient.connect(mongourl,function(err,db) {
			rating(db,tempCriteria,tempValue,function(result) {
				db.close();
			});
			res.end("rate success");
		});
	}
});
function rating(db,criteria,newValues,callback) {
	db.collection('restaurant').updateOne(
		criteria,{$push: newValues},function(err,result) {
			assert.equal(err,null);
			console.log("rating was successfully");
			callback(result);
	});
}

app.post("/searchRestaurant", function(req, res){
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		var criteria = {};
		console.log("Req option:", req.body.searchCriteria);
		console.log("Req field:", req.body.searchWord);
		if(req.body.searchCriteria == "name"){
			console.log("searchbyname");
			criteria['name'] = req.body.searchWord;
		}else if(req.body.searchCriteria == "borough"){
			console.log("searchbyborough");
			criteria['borough'] = req.body.searchWord;			
		}else if(req.body.searchCriteria == "cuisine"){
			console.log("searchbycuisine");
			criteria['cuisine'] = req.body.searchWord;			
		}
		console.log("searchCriteria", criteria);
		MongoClient.connect(mongourl, function(err, db){
			assert.equal(err, null);
			console.log('Connected to MongoDB');
		
			findRestaurant(db,criteria,{},function(restaurantList) {
				db.close();
				console.log('Disconnected MongoDB'); 
				res.status(200);
				res.render("homepage",{restaurants:restaurantList, user: req.session.username});
			});
		});
	}
});

app.get('/map', function(req,res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	console.log("Cri", criteria);

	
	MongoClient.connect(mongourl,function(err,db) {
		findRestaurant(db,criteria,{},function(restaurantList) {
			db.close();
			res.render('gmap.ejs',
			{lat:restaurantList[0].address.coord[0], 
			 lon:restaurantList[0].address.coord[1], 
			 title:restaurantList[0].name});		
		});
	});
	
	
});



app.listen(process.env.PORT || 8099);