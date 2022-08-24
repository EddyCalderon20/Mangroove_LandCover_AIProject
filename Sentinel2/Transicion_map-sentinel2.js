var firstYear = '2019';
var secondYear = '2021';
var mapFirstYear = 'users/cxcarvaj/mangrove-spatial-filtered-'+firstYear;
var mapSecondYear = 'users/cxcarvaj/mangrove-spatial-filtered-'+secondYear;
var functions = require('users/eddy20c/AI_Proyect:Sentinel2/functions_sentinel2');

var mosaicFirstYear = ee.Image(mapFirstYear);
var mosaicSecondYear= ee.Image(mapSecondYear);
var transitions = functions.generateTransitions(mosaicFirstYear,mosaicSecondYear);
var palette = ['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641'];
var legend = ui.Panel({style: {position: 'middle-right', padding: '8px 15px'}});

transitions = transitions.rename('transitions_'+firstYear+'_'+secondYear)
                         .selfMask();
                         
var transitions2 = functions.generateTransitions2(mosaicFirstYear,mosaicSecondYear);

transitions2 = transitions2.rename('transitions2_'+firstYear+'_'+secondYear)
                         .selfMask();
                         
// Choose an image asset id
var imageId = "users/eddy20c/mosaicSentinel2-"+firstYear;

// Load as an image
var mosaic1 = ee.Image(imageId);

// Choose an image asset id
var imageId2 = "users/eddy20c/mosaicSentinel2-"+secondYear;

// Load as an image
var mosaic2 = ee.Image(imageId2);

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


var map2 = ui.Map();

Map.setControlVisibility(false);
map2.setControlVisibility(false);
Map.setControlVisibility({zoomControl: false});

var visNdvi = {
    bands: ['ndvi_median'],
    min: 0,
    max: 1,
    palette: 'ff0000,ffff00,00aa00',
    format: 'png'
};



// Add median mosaic to map


// Add transitions to map
//map2.addLayer(mosaicFirstYear, visMosaic, 'Mosaic '+firstYear);
//Map.addLayer(mosaicSecondYear, visMosaic, 'Mosaic '+secondYear);
//Map.addLayer(transitions, visTransition, 'Difference '+firstYear+'-'+secondYear);
// Map.addLayer(transitions2, visTransition, 'Difference 2 '+firstYear+'-'+secondYear);
//map2.addLayer(mosaic1, visNdvi, 'NDVI median mosaic');
//Map.addLayer(mosaic2, visNdvi, 'NDVI median mosaic');

//Make Split https://www.youtube.com/watch?v=C63lbekwLWc
//Cover Cloud 70% Can be less 
//Use summer dates though GEE Filter all the images
//Use Iamges with temporal filter Collect all datasets

// Link the two panels
var linker = ui.Map.Linker([ui.root.widgets().get(0), map2]);

//boton 1
// var widget1 = ui.Button({label: 'Clasificador 1', style: {width: '100px'}});
// var widgetStyle1 = widget1.style();
// widgetStyle1.set({position: 'top-left'});
// Map.add(widget1);

//funcion boton 1
// widget1.onClick(function(){ 
//   print('hello1');
// });
// var namemap1= 'Clasificacion'+secondYear;

var layersMap1 = {
  Clasificacion_2019: [mosaicFirstYear, visMosaic, 'Mosaic Clasified '+firstYear],
  Diference: [transitions, visTransition, 'Difference '+firstYear+'-'+secondYear],
  NDVI: [mosaic2, visNdvi, 'NDVI median mosaic']
};

var layersMap2 = {
  Clasificacion_2021: [mosaicSecondYear, visMosaic,'Mosaic Clasified '+secondYear],
  Diference: [transitions, visTransition, 'Difference '+firstYear+'-'+secondYear],
  NDVI: [mosaic1, visNdvi, 'NDVI median mosaic']
};

var removeLayer = function(name) {
  var layers = Map.layers()
  // list of layers names
  var names = [];
  if(layers.length !== 0){
  layers.forEach(function(lay) {
    var lay_name = lay.getName()
    names.push(lay_name)
  })
  // get index
  var index = names.indexOf(name)
  if (index > -1) {
    // if name in names
    var layer = layers.get(index)
    Map.remove(layer)
  } else {
    print('Layer '+name+' not found')
  }
  }
}

var selectForFirstMap = ui.Select({
  style: {width: '200px'},
  items: Object.keys(layersMap1),
  onChange: function(key, index) {
    removeLayer(layersMap1[key][2]);
  Map.addLayer(layersMap1[key][0], layersMap1[key][1], layersMap1[key][2]);

  }
});
var selectWidget = selectForFirstMap.style();
selectWidget.set({position: 'top-center'})


var selectForSecondMap = ui.Select({
  style: {width: '200px'},
  items: Object.keys(layersMap2),
  onChange: function(key, index) {
    removeLayer(layersMap2[key][2]);
  map2.addLayer(layersMap2[key][0], layersMap2[key][1], layersMap2[key][2]);

  }
});
var selectWidget = selectForSecondMap.style();
selectWidget.set({position: 'top-center'})


// Set a place holder.
selectForFirstMap.setPlaceholder('Choose the layer for the first map:');
selectForSecondMap.setPlaceholder('Choose the layer for the second map:');

// print(select);
// Map.add(select);


//boton 2
// var widget2 = ui.Button({label: 'Clasificador 2', style: {width: '100px'}});
// var widgetStyle2 = widget2.style();
// widgetStyle2.set({position: 'top-right'});
// map2.add(widget2);

// //funcion boton 2
// widget2.onClick(function(){ 
//   print('hello2');
// });


// Create the split panels
var splitPanel = ui.SplitPanel({
  firstPanel: linker.get(0),
  secondPanel: linker.get(1),
  orientation: 'horizontal',
  wipe: true,
  style: {stretch: 'both'}
});
ui.root.clear();
// Set the split panels to ui roots
ui.root.widgets().reset([splitPanel]);
// Set the view center
linker.get(0).setCenter(-80.090935, -2.586809, 9);

// Panels are the main container widgets
var mainPanel = ui.Panel({
  style: {width: '300px'}
});


var supervisedClasificationTitle = ui.Label({
  value: 'Supervised Clasification',
  style: {'fontSize': '24px'}
});

var subtitleForMap1 = ui.Label({
  value: 'Choose the layer for the first map:',
  style: {'fontSize': '15px'}
});

var subtitleForMap2 = ui.Label({
  value: 'Choose the layer for the second map:',
  style: {'fontSize': '15px'}
});
// You can add widgets to the panel
mainPanel.add(supervisedClasificationTitle)


// You can even add panels to other panels


var dropdownPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
});
mainPanel.add(dropdownPanel);



// dropdownPanel.add(widget2)
dropdownPanel.add(selectForFirstMap)

dropdownPanel.add(selectForSecondMap)
function createColorBar(titleText, palette, min, max) {
  // Legend Title
  var title = ui.Label({
    value: titleText, 
    style: {fontWeight: 'bold', textAlign: 'center', stretch: 'horizontal'}});

  // Colorbar
  var legend = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '200x20',
      format: 'png', 
      min: 0, max: 1,
      palette: palette},
    style: {stretch: 'horizontal', margin: '8px 8px', maxHeight: '40px'},
  });
  
  // Legend Labels
  var labels = ui.Panel({
    widgets: [
      ui.Label(min, {margin: '4px 10px',textAlign: 'left', stretch: 'horizontal'}),
      ui.Label((min+max)/2, {margin: '4px 20px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(max, {margin: '4px 10px',textAlign: 'right', stretch: 'horizontal'})],
    layout: ui.Panel.Layout.flow('horizontal')});
  
  // Create a panel with all 3 widgets
  var legendPanel = ui.Panel({
    widgets: [title, legend, labels],
    style: {position: 'bottom-center', padding: '8px 15px'}
  })
  return legendPanel
}
// Call the function to create a colorbar legend  
var colorBar = createColorBar('NDVI Values', palette, 0, 0.5)

dropdownPanel.add(colorBar)

var makeRow = function(color, name) {
  var colorBox = ui.Label({
    style: {color: '#ffffff',
      backgroundColor: color,
      padding: '10px',
      margin: '0 0 4px 0',
    }
  });
  var description = ui.Label({
    value: name,
    style: {
      margin: '0px 0 4px 6px',
    }
  }); 
  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')}
)};

var title = ui.Label({
  value: 'Class Indicators',
  style: {fontWeight: 'bold',
    fontSize: '16px',
    margin: '0px 0 4px 0px'}});
    
legend.add(title);

legend.add(makeRow('yellow','No Vegetation'))
legend.add(makeRow('blue','Water'))
legend.add(makeRow('green','Vegetation'))

dropdownPanel.add(legend);



ui.root.add(mainPanel);
