/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi = ee.FeatureCollection("users/eddrcald/Canton_Guayaquil");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


// Applies scaling factors.
exports.applyScaleFactors = function (image){
    // Select every optical bands and applies scaling factor
    var opticalBands = image.select('B.')
        .multiply(0.0000275)
        .add(-0.2)
        .multiply(10000);
    
    // // Select every thermal bands and applies scaling factor
    // var thermalBands = image.select('B.*')
    //     .multiply(0.00341802)
    //     .add(149.0);
    
    return image.addBands(opticalBands, null, true)
                .addBands(thermalBands, null, true)
                .clip(roi);
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

    var qaBand = image.select(['pixel_qa']);

    var cloud = qaBand.bitwiseAnd(Math.pow(2, 3)).not(); 
    var cloudEdge = qaBand.bitwiseAnd(Math.pow(2, 1)).not(); 
    var shadow = qaBand.bitwiseAnd(Math.pow(2, 4)).not(); 
    
    image = image.updateMask(cloud);
    image = image.updateMask(cloudEdge);
    image = image.updateMask(shadow);
    
    return image;
};

exports.cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)
                  .and(qa.bitwiseAnd(1 << 7))
                  .or(qa.bitwiseAnd(1 << 3));
  
    // Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};


/**
 * @name
 *      computeNDVI
 * @description
 *      Calculates NDVI index
 */
exports.computeNDVI = function(image) {

	var exp = '( b("B4") - b("B3") ) / ( b("B4") + b("B3") )';

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

	var exp = 'float(b("B4") - b("B5"))/(b("B4") + b("B5"))';

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

	var exp = '2.5 * ((b("B4") - b("B3")) / (b("B4") + 6 * b("B3") - 7.5 * b("B1") + 1))';

	var evi = image.expression(exp).rename("evi");

	return image.addBands(evi);

};