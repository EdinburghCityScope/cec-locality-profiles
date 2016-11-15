// MapIt importer script and GeoJson builder.
var edinburghcityscopeUtils = require('edinburghcityscope-utils');
var fs = require('fs');
var path = require('path');
const datadir = path.join(__dirname, '..', 'data');
const wardsGeoJsonFile = 'edinburgh-wards.geojson';
const statsJsonFile = 'edinburgh-stats.json';

const utw_refs = {
    "Almond": "20718",
    "Pentland Hills": "20719",
    "Drum Brae Gyle": "20720",
    "Forth": "20721",
    "Inverleith": "20722",
    "Corstorphine Murrayfield": "20723",
    "Sighthill Gorgie": "20724",
    "Colinton Fairmilehead": "20725",
    "Fountainbridge Craiglockhart": "20726",
    "Meadows Morningside": "20727",
    "City Centre": "20728",
    "Leith Walk": "20729",
    "Leith": "20730",
    "Craigentinny Duddingston": "20731",
    "Southside Newington": "20732",
    "Liberton Gilmerton": "20733",
    "Portobello Craigmillar": "20734",
}
const area_ids = Object.keys(utw_refs).map(key => utw_refs[key]);
const area_labels = Object.keys(utw_refs)

edinburghcityscopeUtils.fetchMapItAreas(area_ids, (err, geoJsonData) => {
    if (err) throw err

    fs.writeFile(path.join(datadir, wardsGeoJsonFile), JSON.stringify(geoJsonData), 'utf8', (err) => {
        if (err) throw err;
        console.log('Wards GeoJSON file saved to ' + wardsGeoJsonFile);
    });
});

// Transform the source CSV to create a keyed collection of objects based on columns, with properties from row values.
// The CSV is generated from Excel on Windows and so has ANSI encoding (win1252)
// If the CSV has been saved as MS-DOS from Excel, it's OEM-US character encoding (cp437).
var Converter = require("csvtojson").Converter;
var json2csv = require('json2csv')
var slug = require('slug')
var iconv = require('iconv-lite');
var rs = fs.createReadStream(path.join(datadir, 'source', 'cec-source.csv')).pipe(iconv.decodeStream('win1252'));
var data = {}
var indicators = []
var stats = []
var csvData = {}
var csv
var filename
var dataFiles = []
var sources = {}
var dates = {}

var csvConverter = new Converter();
csvConverter.on("end_parsed", function(jsonObj) {
    fs.writeFile(path.join(datadir, statsJsonFile), JSON.stringify(jsonObj), 'utf8', (err) => {
        if (err) throw err;
        console.log('CEC data JSON file saved to ' + statsJsonFile);
    });
    dataFiles.push({
        "title": "Edinburgh locality profile base data JSON file",
        "description": "Data sourced from http://www.edinburghopendata.info/dataset/locality-profiles",
        "mediaType": "application/json",
        "downloadURL": "https://raw.githubusercontent.com/EdinburghCityScope/cec-locality-profiles/master/data/" + statsJsonFile,
        "license": "http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2/"
    });
    dataFiles.push({
        "title": "Edinburgh Wards GeoJSON file",
        "description": "Ward boundary data sourced from MapIt: https://mapit.mysociety.org This repository contains Ordnance Survey open data © Crown copyright and database right 2010",
        "mediaType": "application/vnd.geo+json",
        "downloadURL": "https://raw.githubusercontent.com/EdinburghCityScope/cec-locality-profiles/master/data/" + wardsGeoJsonFile,
        "license": "https://www.ordnancesurvey.co.uk/business-and-government/licensing/using-creating-data-with-os-products/os-opendata.html"
    });

    for (var group in csvData) {
        filename = slug(group).toLowerCase() + ".csv"
        csv = json2csv({data: csvData[group], fields: Object.keys(csvData[group][0]), newLine: "\n"})
        fs.writeFileSync(path.join(datadir, filename), csv)

        dataFiles.push({
            "title": "Edinburgh locality profile " + group + " data",
            "description": "Source: " + sources[group] + ". Date: " + dates[group] + ". Data taken from http://www.edinburghopendata.info/dataset/locality-profiles",
            "mediaType": "text/csv",
            "downloadURL": "https://raw.githubusercontent.com/EdinburghCityScope/cec-locality-profiles/master/data/" + filename,
            "license": "http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2/"
        });
    }

    csv = json2csv({data: indicators, fields: Object.keys(indicators[0]), newLine: "\n"})
    fs.writeFileSync(path.join(datadir, "indicators.csv"), csv)

    csv = json2csv({data: stats, fields: Object.keys(stats[0]), newLine: "\n"})
    fs.writeFileSync(path.join(datadir, "raw-stats.csv"), csv)


    // Update data.json file
    var file = path.join(__dirname, '..', 'data.json');
    var data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.distribution = dataFiles;

    console.log("Updating data.json file")
    fs.writeFileSync(file, JSON.stringify(data, null, 4), 'utf8');
});
csvConverter.on("record_parsed", function(resultRow, rawRow, rowIndex) {
    if (resultRow.indicator) {
        indicators.push({
            id: resultRow.no,
            group: resultRow.group,
            indicator: resultRow.indicator
        });
        sources[resultRow.group] = resultRow.source
        dates[resultRow.group] = resultRow.date

        for (var label in resultRow) {
            if (area_labels.indexOf(label) >= 0) {
                key = utw_refs[label]
                if (!data[key] || typeof data[key] !== 'object') {
                    data[key] = {};
                }
                if (!data[key][resultRow.group] || typeof data[key][resultRow.group] !== 'object') {
                    data[key][resultRow.group] = {}
                }
                data[key][resultRow.group][resultRow.indicator] = resultRow[label];

                if (!csvData[resultRow.group] || !Array.isArray(csvData[resultRow.group])) {
                    csvData[resultRow.group] = []
                }
                if (csvData[resultRow.group][area_labels.indexOf(label)] === undefined) {
                    csvData[resultRow.group][area_labels.indexOf(label)] = {
                        ref: key,
                        area: label,
                    }
                }
                csvData[resultRow.group][area_labels.indexOf(label)][resultRow.indicator] = resultRow[label]

                stats.push({
                    indicatorId: resultRow.no,
                    source:resultRow.source,
                    date:resultRow.date,
                    wardId: key,
                    value: resultRow[label]
                });
            }
        }
    }
});

rs.pipe(csvConverter);


edinburghcityscopeUtils.updateDataModificationDate(path.join(__dirname, '..'));
