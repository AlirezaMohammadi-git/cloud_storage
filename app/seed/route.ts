

import { exampleFileMetadata, passwords, users } from '@/constants';
import { Client } from 'pg'


// ##################### Auth related stuff
async function seedUsers(client: Client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL UNIQUE,
      log_in_method TEXT NOT NULL
    );
  `);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      return client.query(`
        INSERT INTO users (id, full_name, email, avatar,log_in_method)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (id) DO NOTHING;
      `, [user.id, user.fullname, user.email, user.avatar, user.logInMethod]);
    }),
  );

  return insertedUsers;
}
async function seedPasswords(client: Client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await client.query(
    `
    CREATE TABLE IF NOT EXISTS user_passwords (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      hash TEXT NOT NULL
    );
  `
  );

  const insertedPassword = await Promise.all(
    passwords.map(async (pass) => {
      return client.query(
        `
        INSERT INTO user_passwords (id, hash)
        VALUES ($1,$2)
        ON CONFLICT (id) DO NOTHING;
      `,
        [pass.id, pass.hash]
      );
    }),
  );

  return insertedPassword;
}
// ##################### files related stuff
async function seedFilesMetadata(client: Client) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // First check if the enum type exists
  try {
    await client.query(`CREATE TYPE fileType AS ENUM ('image','video','audio','document','other');`);
  } catch (error) {
    // Type guard for PostgreSQL errors
    if (error instanceof Error && 'code' in error) {
      const pgError = error as PostgresError;

      // Error code 42710 means the type already exists
      if (pgError.code !== "42710") {
        throw error; // Re-throw if it's not a "type already exists" error
      }

      console.log('fileType enum already exists, skipping creation');
    }
  }
  await client.query(
    `
    CREATE TABLE IF NOT EXISTS files_metadata (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      fType fileType NOT NULL,
      url TEXT NOT NULL,
      size BIGINT NOT NULL DEFAULT 0,
      lastEdit TIMESTAMP WITH TIME ZONE NOT NULL,
      owner TEXT NOT NULL,
      shareWith TEXT[] NOT NULL
    );
  `
  );

  // Prepare and validate data
  const insertResults = await Promise.all(
    exampleFileMetadata.map(async (meta) => {
      // Convert date to proper timestamp format
      let dateAdded;
      if (meta.lastEdited instanceof Date) {
        dateAdded = meta.lastEdited;
      } else if (typeof meta.lastEdited === 'number') {
        dateAdded = new Date(meta.lastEdited * 1000); // Convert UNIX timestamp to Date
      } else {
        dateAdded = new Date(); // Fallback to current time
      }

      return client.query(
        `INSERT INTO files_metadata (id, name, fType, url, size, lastEdit,owner,shareWith)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
        [
          meta.id,
          meta.name,
          meta.type,
          meta.url,
          meta.size || 0, // Default to 0 if size not provided
          dateAdded,
          meta.owner,
          meta.shareWith
        ]
      );
    })
  );


  return insertResults;
}
export async function GET() {
  const client = new Client({
    connectionString: 'postgres://joe:helloKitty@localhost:5432/mylocaldatabase'
  });
  client.connect();
  try {

    await seedUsers(client)
    await seedPasswords(client)
    await seedFilesMetadata(client)

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error: error }, { status: 500 });
  } finally {
    client.end()
  }
}