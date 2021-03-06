(function () {
    "use strict";

    angular
        .module('Natao')
        .directive('tabs', function() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {},
                controller: function($scope, $element) {
                    var panes = $scope.panes = [];

                    $scope.select = function(pane) {
                        angular.forEach(panes, function(pane) {
                            pane.selected = false;
                        });
                        pane.selected = true;
                    };

                    this.addPane = function(pane) {
                        if (panes.length == 0) $scope.select(pane);
                        panes.push(pane);
                    };
                },
                template:
                '<div class="tabbable" flex layout="row" layout-align="start stretch">' +
                '<ul class="nav nav-tabs" layout="column" layout-align="start stretch">' +
                '<li ng-repeat="pane in panes" ng-class="{active:pane.selected}" ng-click="select(pane)">'+
                '<p><span class="typcn {{pane.icon}}"></span> {{pane.title}}</p>' +
                '</li>' +
                '</ul>' +
                '<div class="tab-content" flex layout="column" layout-align="start stretch" ng-transclude></div>' +
                '</div>',
                replace: true
            };
        })

        .directive('pane', function() {
            return {
                require: '^tabs',
                restrict: 'E',
                transclude: true,
                scope: { title: '@',icon: '@' },
                link: function(scope, element, attrs, tabsController) {
                    tabsController.addPane(scope);
                },
                template:
                '<div class="tab-pane" flex flex layout="column" layout-align="start stretch" ng-class="{active: selected}" ng-transclude>' +
                '</div>',
                replace: true
            };
        })

}());