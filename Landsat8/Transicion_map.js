var map2018 = 'users/cxcarvaj/mangrove-spatial-filtered-2018';
var map2020 = 'users/cxcarvaj/mangrove-spatial-filtered-2020';
var functions = require('users/eddy20c/AI_Proyect:functions_landsat8');

var mosaic2018 = ee.Image(map2018);
var mosaic2020 = ee.Image(map2020);
var transitions = functions.generateTransitions(mosaic2018,mosaic2020);

transitions = transitions.rename('transitions_2018_2020')
                         .selfMask();
                         
var transitions2 = functions.generateTransitions2(mosaic2018,mosaic2020);

transitions2 = transitions2.rename('transitions2_2018_2020')
                         .selfMask();
var visTransition = {
    'min': 303,
    'max': 3333,
    'palette': ['#FF0000'],
    'format': 'png'
};
var visMosaic = {
    'min': 0,
    'max': 3,
    'palette': ['#ffffff','#00d464','#fff104','#1488ff'],
    'format': 'png'
};


// Add transitions to map
Map.addLayer(mosaic2018, visMosaic, 'Mosaic 2018');
Map.addLayer(mosaic2020, visMosaic, 'Mosaic 2020');
Map.addLayer(transitions, visTransition, 'Difference 2018-2020');
Map.addLayer(transitions2, visTransition, 'Difference 2 2018-2020');

//Make Split https://www.youtube.com/watch?v=C63lbekwLWc
//Cover Cloud 70% Can be less 
//Use summer dates though GEE Filter all the images
//Use Iamges with temporal filter Collect all datasets
