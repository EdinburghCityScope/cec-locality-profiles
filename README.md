# cec-locality-profiles
Facts and statistics covering the City of Edinburgh Council's 17 wards.

Statistics sourced from the City of Edinburgh Council: http://data.edinburghopendata.info/dataset/locality-profiles
Ward boundary data sourced from MapIt: https://mapit.mysociety.org
This repository contains Ordnance Survey open data © Crown copyright and database right 2010: https://www.ordnancesurvey.co.uk/business-and-government/licensing/using-creating-data-with-os-products/os-opendata.html

## License

Data is licensed under the Open Government License: http://www.nationalarchives.gov.uk/doc/open-government-licence/version/2/

## Requirements

- NodeJS
- npm

## Installation

Clone the repository

```
git clone https://github.com/EdinburghCityScope/cec-locality-profiles.git
```

Install npm dependencies

```
cd cec-locality-profiles
npm install
```

Run the API (from the cec-locality-profiles directory)

```
node .
```

Converting the csv into loopback data.

```
node scripts/featureCollectionToLoopbackJson.js
```

Re-build data files from cleaned-up base data CSV

```
node scripts/build-data.js
```
