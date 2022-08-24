var functions = require('users/eddy20c/AI_Proyect:Sentinel2/functions_sentinel2');

var year = '2021'; 
// The asset name of classification data
var classificationId = 'users/cxcarvaj/mangrove-gye-classified-S-'+year;

// Load image classification
var classification = ee.Image(classificationId);


// import the mapbiomas palettes module and get the 'classification5' color scheme
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification5');
print(palette);

// Set a visualization parameter
var visClassification = {
        'min': 0,
        'max': 3,
        'palette': ['#ffffff','#00d464','#fff104','#1488ff'],
        'format': 'png'
    };
// Add image to map
Map.addLayer(classification, visClassification, 'Classification'+year);



// Set a list of spatial filter parameters
// classValue is the representative number of a class and maxSize is the maximum
// size of pixels in a group that will be reclassified
var filterParams = [
    {classValue: 3, maxSize: 5},
    {classValue: 15, maxSize: 5}, 
    {classValue: 33, maxSize: 5}, 
    {classValue: 19, maxSize: 5},
];

var pc = new functions.PostClassification(classification);

var filtered = pc.spatialFilter(filterParams);

// Add image to map
Map.addLayer(filtered.reproject('EPSG:4326', null, 30), visClassification, 'Filtered-'+year);


// Export the filtered classification to your asset
Export.image.toAsset({
    image: filtered, 
    description: 'mangrove-spatial-filtered-'+year, 
    assetId: 'mangrove-spatial-filtered-'+year, 
    pyramidingPolicy: {'.default': 'mode'},
    region: classification.geometry(), 
    scale: 30, 
    maxPixels: 1e13
});
