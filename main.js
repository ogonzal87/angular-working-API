var app = angular.module('codecraft', [
	'ngResource',
	'ngResource',
	'infinite-scroll',
	'angularSpinner',
	'jcs-autoValidate',
	'angular-ladda'
]);

app.config(function($httpProvider, $resourceProvider, laddaProvider) {
	$httpProvider.defaults.headers.common['Authorization'] = 'Token 76e3d573ed011723ab9b9def8656de498a31b365';
	$resourceProvider.defaults.stripTrailingSlashes = false;
	laddaProvider.setOption({
		style: 'expand-right'
	});
});

app.controller('PersonDetailController', function ($scope, ContactService) {
	$scope.contacts = ContactService;

	$scope.save = function() {
		$scope.contacts.updateContact($scope.contacts.selectedPerson);
	};
});

app.factory('Contact', function($resource) {
	return $resource("https://codecraftpro.com/api/samples/v1/contact/:id/", {id:'@id'}, {
		update: {
			method: 'PUT'
		}
	});
});

app.controller('PersonListController', function ($scope, ContactService) {
	$scope.search = "";
	$scope.order = "email";
	$scope.contacts = ContactService;



	$scope.loadMore = function() {
		console.log('Loading....');
		$scope.contacts.loadMore();
	};

	$scope.$watch('search', function(newVal, oldVal) {
		if(angular.isDefined(newVal)) {
			$scope.contacts.doSearch(newVal);
		}
	});

	$scope.$watch('order', function(newVal, oldVal) {
		if(angular.isDefined(newVal)) {
			$scope.contacts.doOrder(newVal);
		}
	});

});

app.service('ContactService', function (Contact) {

	var self = {
		'page': 1,
		'hasMore': true,
		'isLoading': false,
		'isSaving': false,
		'addPerson': function (person) {
			this.persons.push(person);
		},
		'selectedPerson': null,
		'persons': [],
		'search': null,
		'doSearch': function(search) {
			self.page = 1;
			self.hasMore = true;
			self.persons = [];
			self.search = search;
			self.loadContacts();
		},
		'doOrder': function(order) {
			self.page = 1;
			self.hasMore = true;
			self.persons = [];
			self.ordering = order;
			self.loadContacts();
		},
		'loadContacts': function() {
			if (self.hasMore && !self.isLoading) {
				self.isLoading = true;

				var params = {
					'page': self.page,
					'search': self.search,
					'ordering': self.ordering
				};

				Contact.get(params, function(data) {
					console.log(data);
					angular.forEach(data.results, function(person){
						self.persons.push(new Contact(person));
					});

					if (!data.next) {
						self.hasMore = false;
					}
					self.isLoading = false;
				});
			}
		},
		'loadMore': function() {
			if(self.hasMore && !self.isLoading) {
				self.page += 1;
				self.loadContacts();
			}
		},
		'updateContact': function(person) {
			console.log("Service Updated");
			self.isSaving = true;
			person.$update().then(function() {
				self.isSaving = false;
			});
		}

	};

	self.loadContacts();
	return self;

});