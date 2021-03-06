(function () {
    "use strict";

    var fs = require('fs'),
         _ = require('lodash');

    angular
        .module('Natao')
        .service('OnBoardingService', OnBoardingService)
        .run(run);

    //Start of the service
    function run() {
    }



    function OnBoardingService($translate,$q,PreferencesService) {

        var self = this;
        self.$translate = $translate;
        self.PreferencesService = PreferencesService;

        self.init = function() {

            return $q(function(resolve,reject) {


                // And the we load the tours and steps for onBoarding
                var onBoardingFile = fs.readFileSync('./languages/onBoarding-' + self.$translate.use() + '.json','utf8');

                self.tours = [];

                if (onBoardingFile) {
                    try {
                        var onBoarding = JSON.parse(onBoardingFile);

                        self.tours = onBoarding.tours;

                        self.customOptions = {
                            nextButtonText: onBoarding.texts.nextButtonText,
                            previousButtonText: onBoarding.texts.previousButtonText,
                            doneButtonText: onBoarding.texts.doneButtonText,
                            actualStepText: onBoarding.texts.actualStepText,
                            totalStepText: onBoarding.texts.totalStepText
                        };

                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }
                }

            });
        };
        
        self.showTourButton = function() {
            return self.PreferencesService.preferences.showTours;
        };
        
        self.startFirstTour = function(tourName) {
            return !_.includes(self.PreferencesService.preferences.toursSeen,tourName);
        };
        
        self.finishTour = function(tourName) {
            if (!_.includes(self.PreferencesService.preferences.toursSeen,tourName)) {
                self.PreferencesService.preferences.toursSeen.push(tourName);
                self.PreferencesService.savePreferences();
            }
        };

        
        self.getSteps = function(tourName) {
            return self.tours.find(function(item) {
                return item.tour === tourName;
            });
        };

        return self;


    }

}());