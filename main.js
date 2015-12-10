var app = angular.module('codecraft', [
	'ngResource',
	'ngResource',
	'infinite-scroll',
	'angularSpinner',
	'jcs-autoValidate',
	'angular-ladda',
	'mgcrea.ngStrap'
]);

app.config(function($httpProvider, $resourceProvider, laddaProvider, $datepickerProvider) {
	$httpProvider.defaults.headers.common['Authorization'] = 'Token 76e3d573ed011723ab9b9def8656de498a31b365';
	$resourceProvider.defaults.stripTrailingSlashes = false;
	laddaProvider.setOption({
		style: 'expand-right'
	});
	angular.extend($datepickerProvider.defaults, {
		dateFormat: 'd/M/yyyy',
		autoclose: true
	});
});

app.controller('PersonDetailController', function ($scope, ContactService) {
	$scope.contacts = ContactService;

	$scope.save = function() {
		$scope.contacts.updateContact($scope.contacts.selectedPerson);
	};

	$scope.remove = function() {
		$scope.contacts.revomeContact($scope.contacts.selectedPerson);
	};

});

app.factory('Contact', function($resource) {
	return $resource("https://codecraftpro.com/api/samples/v1/contact/:id/", {id:'@id'}, {
		update: {
			method: 'PUT'
		}
	});
});

app.controller('PersonListController', function ($scope, $modal, ContactService) {
	$scope.search = "";
	$scope.order = "email";
	$scope.contacts = ContactService;

	$scope.showCreateModal = function() {
		$scope.contacts.selectedPerson = {};
		$scope.createModal = $modal({
			scope: $scope,
			template: 'templates/modal.create.tpl.html',
			show: true
		});
	};

	$scope.createContact = function() {
		console.log("Contact was created");
		$scope.contacts.createContact($scope.contacts.selectedPerson).then(function() {
			$scope.createModal.hide();
		});
	};

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

app.service('ContactService', function (Contact, $q) {

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
		},
		'revomeContact': function(person) {
			self.isDeleting = true;
			person.$remove().then(function() {
				self.isDeleting = false;
				var index = self.persons.indexOf(person);
				self.persons.splice(index, 1);
				self.selectedPerson = null;
			});
		},
		'createContact': function(person) {
			var d = $q.defer();
			self.isSaving = true;
			Contact.save(person).$promise.then(function() {
				self.isSaving = false;
				self.selectedPerson = null;
				self.hasMore = null;
				self.page = 1;
				self.persons = [];
				self.loadContacts();
				d.resolve();
			});
			return d.promise;
		}

	};

	self.loadContacts();
	return self;

});