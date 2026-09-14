import { DataSource } from 'typeorm';

import { Isotope } from '../src/isotopes/entities/isotope.entity.js';
import { Like } from '../src/isotopes/entities/like.entity.js';
import { User } from '../src/isotopes/entities/user.entity.js';

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Isotope, Like, User],
    synchronize: true,
})

async function run() {
   await dataSource.initialize();

   console.log('Миграции завершены');

   await dataSource.destroy();

   process.exit(0);
}

run().catch(err => {
    console.error('Ошибка миграций:', err);
    process.exit(1);
});
