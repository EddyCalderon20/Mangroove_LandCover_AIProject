/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-79.93102864356628, -2.2903583721569585]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var dataset = ee.ImageCollection('LANDSAT/LM04/C02/T2')
                  .filterDate('1984-01-01', '1984-12-31');
var nearInfrared321 = dataset.select(['B3', 'B2', 'B1']);
var nearInfrared321Vis = {};
Map.setCenter(-79.93102864356628,-2.2903583721569585,5);
Map.addLayer(nearInfrared321, nearInfrared321Vis, 'Near Infrared (321)');
