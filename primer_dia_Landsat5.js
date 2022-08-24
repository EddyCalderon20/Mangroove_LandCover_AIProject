/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi = ee.FeatureCollection("users/eddrcald/Canton_Guayaquil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var roi2 = ee.FeatureCollection("users/eddrcald/Canton_Guayaquil");

var functions = require('users/eddy20c/AI_Proyect:functions_landsat5');
/**
 * Create a Landsat 5 surface reflectance collection, filter by location and date
 */

// Landsat 8 SR collection id
var collectionId = "LANDSAT/LT05/C01/T1_SR";

// Create a collection filtering by ROI and date
var collection = ee.ImageCollection(collectionId)
    .filterBounds(roi2)
    .filterDate('1985-01-01', '1986-12-31')
    .map(function(image){return image.clip(roi)});

// prints the collection structure
print('Initial collection:', collection);

// Filter images with less than 60% of cloud cover
collection = collection
    .filterMetadata('CLOUD_COVER', 'less_than', 60);

// prints the collection structure
print('Images with less than 60% of cloud cover:', collection);

// collection = collection.map(functions.applyScaleFactors);

// print('Images reescaled:', collection);

var bandNames = ['B1','B2','B3','B4','B5','B7','pixel_qa'];

// Select bands of interest
collection = collection.select(bandNames);

// prints the collection structure
print('Images with selected bands:', collection);

// Set a visualization parameters object
var visParams = {
    bands: ['B5', 'B4', 'B3'],
    gain: [0.08,0.06,0.2]
};

// Add collection to map
Map.addLayer(collection, visParams, 'collection');



var collectionWithoutClouds = collection.map(functions.cloudMaskL457);

Map.addLayer(collectionWithoutClouds, visParams, 'collection without clouds');

print('Collection without clouds:', collectionWithoutClouds);



// For each image, apply the functions computeNDVI, computeNDWI and computeEVI.
var collectionWithIndexes = collectionWithoutClouds
    .map(functions.computeNDVI)
    .map(functions.computeNDWI)
    .map(functions.computeEVI);

// Sets a visualization parameter object to NDVI data
var visNdvi = {
    bands: ['ndvi'],
    min: 0,
    max: 1,
    palette: 'ff0000,ffff00,00aa00',
    format: 'png'
};

Map.addLayer(collectionWithIndexes, visNdvi, 'collection with indexes');

print('collection with indexes:', collectionWithIndexes);