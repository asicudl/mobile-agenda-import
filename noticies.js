var rest = require('restler'),
    util = require('util'),
    config = require ('./config');

var cookie = '';

function removeOld (success) {
	rest.get(config.BASEURL+'/agendaevents',{
		headers: {
			Cookie: cookie,
			Accept: 'Application/json'
		}
	}
	).on('complete', function(result) {
	  if (result instanceof Error) {
	    console.log('Error:', result.message);
	  } else {
		var llista = result;

		for (elem in llista) {
			rest.del (config.BASEURL+ '/agendaevents/' + llista[elem]._id, {
         		     headers: {
				Cookie: cookie,
	                        Accept: 'Application/json'
        		     }
			 }).on ('complete',function (result,response) {
				if (response.statusCode == 201 || response.statusCode == 200) {
				 	console.log ('removed ' + result._id);
				} else {
					console.log ('error removing' +  result._id);
				}
			});
			
		}
		//Once list is empty
		success();
	  }
	});

}

function getAgenda (success) {
	rest.get (config.AGENDAURL, {
		parser: rest.parsers.xml
		}).on('complete', function (result){
		success (result.rss.channel[0].item);
	});
}

function createNewElement (title,description,date,url) {
	rest.post (config.BASEURL+'/agendaevents', {
		data: {
			title: title,
			eventDate: date,
			content: description + '<br /><a href="'+url+'">Més info</a>'
		},
		headers: {
			Cookie: cookie,
			Accept: 'Application/json'
		}
	}).on ('complete', function  (data,response) {
		if (response.statusCode == 201 || response.statusCode == 200) {
		      console.log ('OK Added' + title);
		} else {
		      console.log ('Error adding' + title);
		}
	});

}

rest.post(config.BASEURL+ '/auth/basic', {
  username: config.username,
  password: config.password,
  data: {}
}).on('complete', function(data, response) {

  // Un cop autenticats 
  if (response.statusCode == 201 || response.statusCode == 200) {
    // you can get at the raw response like this...

	console.log ('OK ', response.headers['set-cookie']);
	cookie = response.headers['set-cookie']
	
	removeOld (function () {
		getAgenda (function (items) {
			for (itemN in items) {
				var listItem = items[itemN];
				var date = new Date (listItem['dc:date'][0]);
				var now = new Date ();

				if (date.getTime () > now.getTime()) {
					console.log ("Afegim " + listItem.title[0]);
					createNewElement (
						listItem.title[0],
						listItem.description[0],
						date,
						listItem.link[0]);



				} else {
					console.log ("Descartem " + listItem.title[0]);
				}
			}
		});
	});
   }
});




