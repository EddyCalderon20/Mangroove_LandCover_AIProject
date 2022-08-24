var roi = ee.FeatureCollection("users/eddy20c/Area_Manglares_Gye_Diss");
var roi2 = ee.FeatureCollection("users/eddrcald/Canton_Guayaquil");
var functions = require('users/eddy20c/AI_Proyect:Sentinel2/functions_sentinel2');

/**
 * Create a Sentinel 2 surface reflectance collection, filter by location and date
 */

// Sentinel2 SR collection id
var collectionId = "COPERNICUS/S2_SR";
var year = '2021';

// Create a collection filtering by ROI and date
var collection = ee.ImageCollection(collectionId)
    .filterBounds(roi)
    .filterDate(year+'-01-01', year+'-12-31')
    .map(function(image){return image.clip(roi)});
    

// prints the collection structure
print('Initial collection:', collection);

var s2_nube = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');
// Create a collection filtering by ROI and date
var s2_nube= s2_nube
    .filterBounds(roi)
    .filterDate(year+'-01-01', year+'-12-31')
    .map(function(image){return image.clip(roi)});

collection = collection.map(functions.maskEdges);

// Join S2 SR with cloud probability dataset to add cloud mask.
var s2Sr_cloudmask = ee.Join.saveFirst('cloud_mask').apply({
  primary: collection,
  secondary: s2_nube,
  condition:
      ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
});

var rgbVis = {min: 0, max: 3000, bands: ['B2', 'B3', 'B4']};


//Sentinel-2 MSI: MultiSpectral Instrument, Level-2A Harmonized
var s2srCl = ee.ImageCollection(s2Sr_cloudmask)
                             .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',90))
                             .filter(ee.Filter.calendarRange(1, 12, 'month'))
                             .map(functions.maskClouds);



// Filter images with less than 50% of cloud cover
collection = collection
    .filterMetadata('CLOUD_COVERAGE_ASSESSMENT', 'less_than', 50)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',50));

// prints the collection structure
print('Images with less than 50% of cloud cover:', collection);


//collection = collection.map(functions.applyScaleFactors);

print('Images reescaled:', s2srCl );

var bandNames = ['B2','B3','B4','B8A','B11','B12','QA60'];

// Select bands of interest
collection = s2srCl.select(bandNames);

// prints the collection structure
print('Images with selected bands:', collection);

// Set a visualization parameters object
var visParams = {
    bands: ['B11', 'B8A', 'B4'],
    gain: [0.08,0.06,0.2]
};

// Add collection to map
//Map.addLayer(collection, visParams, 'collection');


var rgbVis = {
  min: 0.0,
  max: 3000,
  bands: ['B11', 'B8A', 'B4'],
};

var collectionWithoutClouds = collection.map(functions.cloudMasking);

Map.addLayer(collectionWithoutClouds, rgbVis , 'collection without clouds');

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
    bands: ['B11_median', 'B8A_median', 'B4_median'],
    gain: [0.08, 0.06, 0.2],
    gamma: 0.85
};

// Sets false color visualization parameter object
var visFalseColor2 = {
    bands: ['B11', 'B8A', 'B4'],
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
    description: 'mosaicSentinel2-'+year, 
    assetId: 'mosaicSentinel2-'+year, 
    pyramidingPolicy: {'.default': 'mean'}, 
    region: roi, 
    scale: 30, 
    maxPixels: 1e13
});

