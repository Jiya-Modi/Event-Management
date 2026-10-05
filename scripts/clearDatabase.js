require('dotenv').config();

const sequelize = require('../config/db');

const clearDatabase = async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query(`
      DO $$
      DECLARE
        table_record RECORD;
        enum_record RECORD;
      BEGIN
        FOR table_record IN
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
        LOOP
          EXECUTE format(
            'DROP TABLE IF EXISTS public.%I CASCADE',
            table_record.tablename
          );
        END LOOP;

        FOR enum_record IN
          SELECT
            n.nspname AS schema_name,
            t.typname AS type_name
          FROM pg_type t
          JOIN pg_namespace n
            ON n.oid = t.typnamespace
          WHERE n.nspname = 'public'
            AND t.typtype = 'e'
        LOOP
          EXECUTE format(
            'DROP TYPE IF EXISTS %I.%I CASCADE',
            enum_record.schema_name,
            enum_record.type_name
          );
        END LOOP;
      END
      $$;
    `);

    console.log(
      'Database tables, SequelizeMeta, and enum types cleared successfully.',
    );
  } catch (error) {
    console.error('Failed to clear database:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

clearDatabase();
