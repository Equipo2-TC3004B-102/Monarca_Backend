/**
 * FileName: import-destinations.ts
 * Description: Imports cleaned airport destination data from airports_clean.csv
 *              into the destinations table. Converts ISO country codes to
 *              country names and updates or inserts destinations by IATA code.
 * Authors: Jin Sik Yoon
 * Last Modification made:
 * 16/04/2026 [Jin Sik Yoon] Added country conversion with i18n-iso-countries for multidestination import.
 */

import * as fs from 'fs';
import * as path from 'path';
const csv = require('csv-parser');
import { config } from 'dotenv';

import AppDataSource from 'src/data-source';
import { Destination } from 'src/destinations/entities/destination.entity';

const countries = require('i18n-iso-countries');
const enLocale = require('i18n-iso-countries/langs/en.json');

config();
countries.registerLocale(enLocale);

type CsvRow = {
  airport_name: string;
  iata_code: string;
  country_code: string;
  city: string;
  airport_type: string;
  latitude: string;
  longitude: string;
};

async function importDestinations() {
  await AppDataSource.initialize();
  const destinationRepo = AppDataSource.getRepository(Destination);

  const rows: CsvRow[] = [];
  const csvPath = path.resolve('data/ourairports/airports_clean.csv');

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data: CsvRow) => {
      rows.push(data);
    })
    .on('end', async () => {
      try {
        for (const row of rows) {
          const iataCode = row.iata_code?.trim();
          const airportName = row.airport_name
            ?.trim()
            .replace(/^\(Duplicate\)/i, '')
            .trim();
          const city = row.city?.trim();

          const countryCode = row.country_code?.trim();
          const country = countryCode
            ? countries.getName(countryCode, 'en') || countryCode
            : '';

          if (!iataCode || !airportName || !city || !country) {
            continue;
          }

          const existing = await destinationRepo.findOne({
            where: { iata_code: iataCode },
          });

          if (existing) {
            existing.airport_name = airportName;
            existing.city = city;
            existing.country = country;
            await destinationRepo.save(existing);
            continue;
          }

          const destination = destinationRepo.create({
            iata_code: iataCode,
            airport_name: airportName,
            city,
            country,
          });

          await destinationRepo.save(destination);
        }

        console.log('Importación de destinos completada.');
      } catch (error) {
        console.error('Error al importar destinos:', error);
      } finally {
        await AppDataSource.destroy();
      }
    });
}

importDestinations().catch((error) => {
  console.error('Error inicializando importación:', error);
});