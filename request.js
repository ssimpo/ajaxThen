(function(global){
	"use strict";

	var defaultOptions = {
		"src":"",
		"method":"get",
		"data":null,
		"parseAs":"text"
	};

	var typeTest = {
		isProperty: function(propName, value){
			return ((Object.prototype.hasOwnProperty.call(value, propName)) || (propName in value));
		},
		isEqualStrings: function(value1, value2){
			return (value1.toString().toLowerCase() === value2.toString().toLowerCase());
		},

		isPrototypeType: function(value, type){
			return typeTest.isEqualStrings(Object.prototype.toString.call(value), "[object "+type+"]");
		},

		isObject: function (value){
			if((value !== undefined) && (value !== null)){
				return typeTest.isPrototypeType(value, "object");
			}

			return false;
		}
	};

	var Q = (typeTest.isProperty("Q", global)?global.Q:{});
	if(typeTest.isPrototypeType(global.Promise, "function")){
		var Q = {};
		var promise = new Promise(function(resolve, reject) {
			Q.defer = function(){
				return {
					"resolve":resolve,
					"reject":reject,
					"notify":function(){},
					"promise": promise
				};
			};
		});
	}

	var sanitizeOptions = function(options){
		var sanitizers = [
			function(options){
				if(typeTest.isObject(options.data)){
					options.data = JSON.stringify(options.data);
				}
			}
		];

		options = ((!options)?{}:options);

		for(var option in defaultOptions){
			if (defaultOptions.hasOwnProperty(option)){
				options[option] = (typeTest.isProperty(option, options)?options[option]:defaultOptions[option]);
			}
		}

		sanitizers.forEach(function(sanitizer){
			sanitizer(options);
		});

		return options;
	};

	var parsers = {
		json: function(response){
			return response.response;
		},
		text: function(response){
			return response.response;
		},
		xml: function(response){
			return response.responseXML;
		},
		'binary': function(response){
			return response.response;
		}
	}

	global.request = function(options){
		function setResponseType(type){
			if((type !== "arraybuffer")&&(type !== "blob")&&(type !== "document")&&(type !== "json")&&(type !== "text")){
				if(type === "binary"){
					type = "arraybuffer";
				}else{
					type = "text";
				}
			}

			return type;
		}

		options = sanitizeOptions(options);

		var deferred = Q.defer();
		var request = new XMLHttpRequest();

		request.addEventListener("progress", function(progress){
			deferred.notify(progress);
		}, false);

		request.addEventListener("load", function(){
			var data = parsers[options.parseAs](this);
			deferred.resolve(data);
		}, false);

		request.addEventListener("error", function(error){
			deferred.reject(error);
		}, false);

		request.addEventListener("abort", function(fail){
			deferred.reject(fail);
		}, false);

		request.responseType = setResponseType(options.parseAs);
		request.open(options.method, options.src, true);
		request.send(options.data);

		return deferred.promise;
	};
})(this);