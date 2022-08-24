var functions = require('users/eddy20c/AI_Proyect:functions_landsat8');

// List of years used in mapbiomas collection 5
var years = [ '2018', '2019', '2020' ];

// The classification name prefix in my asset structure
var classificationPrefix = 'users/cxcarvaj/mangrove-spatial-filtered-';

// Iterate over years list, concatenate de prefix to year and load as an ee.Image
var classificationList = years.map(
    function(year){
        return ee.Image(classificationPrefix + year).rename('classification_'+ year);
    }
);

// Now see the result
print(classificationList);

// Create a image collection from the classification list
var classificationCollection = ee.ImageCollection.fromImages(classificationList);

// Prints a image collection
print('classificationCollection:', classificationCollection);

// Convert the classification collection to an image where each year is a band
var classificationMultiBand = classificationCollection.toBands();

print('classificationMultiBand:', classificationMultiBand);

// Select the data from 2018, 2019 and 2020.
var class2018 = classificationMultiBand.select(['0_classification_2018']);
var class2019 = classificationMultiBand.select(['1_classification_2019']);
var class2020 = classificationMultiBand.select(['2_classification_2020']);

// Forest: 1 
// Non vegetated area: 2
// Agriculture: 3

// Forest formation: 3
// Pasture: 15
// Agriculture: 19

// Find pixels where is forest in 2018 and pasture in 2019 and forest in 2020
var rule1 = class2018.eq(1).and(class2019.eq(2)).and(class2020.eq(1));

// Find pixels where is pasture in 2018 and agriculture in 2019 and pasture in 2020
var rule2 = class2018.eq(2).and(class2019.eq(3)).and(class2020.eq(2));

// Reclassify 2019 noise using rule 1 and 2
var filtered2019 = class2019
    .where(rule1, 1)
    .where(rule2, 2);


var visClassification = {
        'min': 0,
        'max': 3,
        'palette': ['#ffffff','#00d464','#fff104','#1488ff'],
        'format': 'png'
    };
    
Map.addLayer(class2019, visClassification, 'Classification 2019');
Map.addLayer(filtered2019, visClassification, 'Filtered 2019');


var area_1 = functions.areaPerClass(filtered2019, 1);
var area_2 = functions.areaPerClass(filtered2019, 2);
var area_3 = functions.areaPerClass(filtered2019, 3);

// This cast is important to export as a table
var areaCollection = ee.FeatureCollection([
    area_1,
    area_2,
    area_3
]);

print(areaCollection);

//Exporting...
Export.table.toDrive({
    collection:areaCollection,
    description:'area_per_class_2019',
    fileNamePrefix:'area_per_class_2019',
    folder:'map_stats',
    fileFormat:'csv',
});