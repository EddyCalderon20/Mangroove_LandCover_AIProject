/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi = ee.FeatureCollection("users/eddrcald/Canton_Guayaquil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


// Applies scaling factors.
exports.applyScaleFactors = function (image){
    // Select every optical bands and applies scaling factor
    var opticalBands = image.select('SR_B.')
        .multiply(0.0000275)
        .add(-0.2)
        .multiply(10000);
    
    // Select every thermal bands and applies scaling factor
    var thermalBands = image.select('ST_B.*')
        .multiply(0.00341802)
        .add(149.0);
    
    return image.addBands(opticalBands, null, true)
                .addBands(thermalBands, null, true);
};


/**
 * @name
 *      cloudMasking
 * @description
 *      Removes clouds and shadows using the pixel_qa band
 * @argument
 *      ee.Image with QA_PIXEL band
 * @returns
 *      ee.Image without clouds
 */
exports.cloudMasking = function(image) {

    var qaBand = image.select(['QA_PIXEL']);

    var cloud = qaBand.bitwiseAnd(Math.pow(2, 3)).not(); 
    var cloudEdge = qaBand.bitwiseAnd(Math.pow(2, 1)).not(); 
    var shadow = qaBand.bitwiseAnd(Math.pow(2, 4)).not(); 
    
    image = image.updateMask(cloud);
    image = image.updateMask(cloudEdge);
    image = image.updateMask(shadow);
    
    return image;
};


/**
 * @name
 *      computeNDVI
 * @description
 *      Calculates NDVI index
 */
exports.computeNDVI = function(image) {

	var exp = '( b("SR_B5") - b("SR_B4") ) / ( b("SR_B5") + b("SR_B4") )';

	var ndvi = image.expression(exp).rename("ndvi");

	return image.addBands(ndvi);
};

/**
 * @name
 *      computeNDWI
 * @description
 *      Calculates NDWI index
 */
exports.computeNDWI = function (image) {

	var exp = 'float(b("SR_B5") - b("SR_B6"))/(b("SR_B5") + b("SR_B6"))';

	var ndwi = image.expression(exp).rename("ndwi");

	return image.addBands(ndwi);
};

/**
 * @name
 *      computeEVI
 * @description
 *      Calculates EVI index
 */
exports.computeEVI = function(image){

	var exp = '2.5 * ((b("SR_B5") - b("SR_B4")) / (b("SR_B5") + 6 * b("SR_B4") - 7.5 * b("SR_B2") + 1))';

	var evi = image.expression(exp).rename("evi");

	return image.addBands(evi);

};

// Create a function to collect random point inside the polygons
exports.generatePoints = function(polygons, nPoints){
    
    // Generate N random points inside the polygons
    var points = ee.FeatureCollection.randomPoints(polygons, nPoints);
    
    // Get the class value propertie
    var classValue = polygons.first().get('class');
    
    // Iterate over points and assign the class value
    points = points.map(
        function(point){
            return point.set('class', classValue);
        }
    );
    
    return points;
};


/**
 * Post-classification spatial filter struct
 * 
 * @param {ee.Image} image [eeObject classification image]
 *
 * @example
 * var image = ee.Image("your image path goes here");
 * var filterParams = [
 *     {classValue: 1, maxSize: 3},
 *     {classValue: 2, maxSize: 5}, // Mapbiomas maximum Size
 *     {classValue: 3, maxSize: 5}, 
 *     {classValue: 4, maxSize: 3},
 *     ];
 * var pc = new PostClassification(image);
 * var filtered = pc.spatialFilter(filterParams);
 */
exports.PostClassification = function (image) {

    this.init = function (image) {

        this.image = image;

    };

    var majorityFilter = function (image, params) {

        params = ee.Dictionary(params);
        var maxSize = ee.Number(params.get('maxSize'));
        var classValue = ee.Number(params.get('classValue'));

        // Generate a mask from the class value
        var classMask = image.eq(classValue);

        // Labeling the group of pixels until 100 pixels connected
        var labeled = classMask.mask(classMask).connectedPixelCount(maxSize, true);

        // Select some groups of connected pixels
        var region = labeled.lt(maxSize);

        // Squared kernel with size shift 1
        // [[p(x-1,y+1), p(x,y+1), p(x+1,y+1)]
        // [ p(x-1,  y), p( x,y ), p(x+1,  y)]
        // [ p(x-1,y-1), p(x,y-1), p(x+1,y-1)]
        var kernel = ee.Kernel.square(1);

        // Find neighborhood
        var neighs = image.neighborhoodToBands(kernel).mask(region);

        // Reduce to majority pixel in neighborhood
        var majority = neighs.reduce(ee.Reducer.mode());

        // Replace original values for new values
        var filtered = image.where(region, majority);

        return filtered.byte();

    };

    /**
     * Reclassify small blobs of pixels  
     * @param  {list<dictionary>} filterParams [{classValue: 1, maxSize: 3},{classValue: 2, maxSize: 5}]
     * @return {ee.Image}  Filtered Classification Image
     */
    this.spatialFilter = function (filterParams) {

        var image = ee.List(filterParams)
            .iterate(
                function (params, image) {
                    return majorityFilter(ee.Image(image), params);
                },
                this.image
            );

        this.image = ee.Image(image);


        return this.image;

    };

    this.init(image);

};


/**
 * Calculate the class area
 * @param {ee.Image} img, {number} classID
 * @return {ee.Feature} feature with indentified metadata
*/
exports.areaPerClass =  function(img, classID){
    var area = img
        .rename('area')
        .eq(classID)
        .multiply(ee.Image.pixelArea())
        .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: img.geometry(),
            scale: 30,
            maxPixels: 1e13
        });

    return ee.Feature(null, {
        'classId': classID,
        'area_m2': area.get('area')
    });
};

/**
 * Generate transitions map
 * 
 * @param {ee.Image} imageT0
 * @param {ee.Image} imageT1
 *
 * @return {ee.Image} transitions
 */
 exports.generateTransitions = function(imageT0, imageT1){

    // Algebraic solution to generate transitions map
    var transitions = imageT0.bitwiseXor(imageT1).multiply(10);

    return transitions;
};

/**
 * Generate transitions map
 * 
 * @param {ee.Image} imageT0
 * @param {ee.Image} imageT1
 *
 * @return {ee.Image} transitions
 */
 exports.generateTransitions2 = function(imageT0, imageT1){

    // Algebraic solution to generate transitions map
    var transitions = imageT0.add(imageT1).multiply(0.1);

    return transitions;
};