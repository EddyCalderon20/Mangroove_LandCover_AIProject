/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi = ee.FeatureCollection("users/eddrcald/Canton_Guayaquil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var functions = require('users/eddy20c/AI_Proyect:Landsat8/functions_landsat8');
/**
 * Create a Landsat 8 surface reflectance collection, filter by location and date
 */

// Landsat 8 SR collection id
var collectionId = "LANDSAT/LC08/C02/T1_L2";
var year = '2019';

// Create a collection filtering by ROI and date
var collection = ee.ImageCollection(collectionId)
    .filterBounds(roi)
    .filterDate(year+'-01-01', year+'-12-31');

// prints the collection structure
print('Initial collection:', collection);

// Filter images with less than 50% of cloud cover
collection = collection
    .filterMetadata('CLOUD_COVER', 'less_than', 70);

// prints the collection structure
print('Images with less than 75% of cloud cover:', collection);


collection = collection.map(functions.applyScaleFactors);

print('Images reescaled:', collection);

var bandNames = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7','QA_PIXEL'];

// Select bands of interest
collection = collection.select(bandNames);

// prints the collection structure
print('Images with selected bands:', collection);

// Set a visualization parameters object
var visParams = {
    bands: ['SR_B6', 'SR_B5', 'SR_B4'],
    gain: [0.08,0.06,0.2]
};

// Add collection to map
Map.addLayer(collection, visParams, 'collection');



var collectionWithoutClouds = collection.map(functions.cloudMasking);

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


// Generate median, minimum and maximum mosaics.
var median = collectionWithIndexes.reduce(ee.Reducer.median());
var minimum = collectionWithIndexes.reduce(ee.Reducer.min());
var maximum = collectionWithIndexes.reduce(ee.Reducer.max());


// Merges the median, minimum and maximum mosaics
var mosaic = median.addBands(minimum).addBands(maximum);

// Sets a visualization parameter object to NDVI median
var visNdvi = {
    bands: ['ndvi_median'],
    min: 0,
    max: 1,
    palette: 'ff0000,ffff00,00aa00',
    format: 'png'
};

// Sets false color visualization parameter object
var visFalseColor = {
    bands: ['SR_B6_median', 'SR_B5_median', 'SR_B4_median'],
    gain: [0.08, 0.06, 0.2],
    gamma: 0.85
};

// Add median mosaic to map
Map.addLayer(mosaic, visFalseColor, 'False color');
Map.addLayer(mosaic, visNdvi, 'NDVI median mosaic');

print('final mosaic:', mosaic);

// Export the mosaic to your asset
Export.image.toAsset({
    image: mosaic, 
    description: 'mosaic-'+year, 
    assetId: 'mosaic-'+year, 
    pyramidingPolicy: {'.default': 'mean'}, 
    region: roi, 
    scale: 30, 
    maxPixels: 1e13
});