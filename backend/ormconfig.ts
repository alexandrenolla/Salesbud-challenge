import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const ormconfig: PostgresConnectionOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
  logging: process.env.TYPEORM_LOGGING === "true" ? "all" : false,
  ssl:
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
      ? { rejectUnauthorized: false }
      : false,
  entities: ["dist/src/**/*.entity.js"],
  migrations: ["dist/src/migrations/*{.ts,.js}"],
  migrationsTableName: process.env.TYPEORM_MIGRATION_TABLE,
  migrationsRun: process.env.TYPEORM_MIGRATION === "true",
};

export default ormconfig;
