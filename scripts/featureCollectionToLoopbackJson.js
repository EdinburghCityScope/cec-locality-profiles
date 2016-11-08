// Script which converts a FeatureCollection to an array of Features
var fs = require('fs');
var path = require('path');
var datadir = path.join(__dirname, '..', 'data');
var edinburghcityscopeUtils = require('edinburghcityscope-utils');

// Wards
var featureCollection = fs.readFileSync(path.join(datadir, 'edinburgh-wards.geojson'), 'utf8');
var features = edinburghcityscopeUtils.featureCollectionToFeatureArray(featureCollection);
var loopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson(features);

var outputFile = path.join(datadir, 'edinburgh-wards-loopback.json');
fs.writeFile(outputFile, JSON.stringify(loopbackJson),(err) => {
    if (err) throw err;
    console.log('data/edinburgh-wards.json created');
});

// Indicators
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
converter.fromFile(path.join(datadir, 'indicators.csv'), function(err, result){
    if (err) throw err;
    loopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson(result, 'Indicator')
    outputFile = path.join(datadir, 'indicators-loopback.json');
    fs.writeFileSync(outputFile, JSON.stringify(loopbackJson));
});

// Stats
var converter2 = new Converter({});
converter2.fromFile(path.join(datadir, 'raw-stats.csv'), function(err, result){
    if (err) throw err;
    loopbackJson = edinburghcityscopeUtils.featureArrayToLoopbackJson(result, 'EdinburghStat')
    outputFile = path.join(datadir, 'edinburgh-stats-loopback.json');
    fs.writeFileSync(outputFile, JSON.stringify(loopbackJson));
});
