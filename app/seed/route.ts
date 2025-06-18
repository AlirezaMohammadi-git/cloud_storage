

import { passwords, users } from '@/constants';
import { Client } from 'pg'

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
        [pass.userId, pass.hash]
      );
    }),
  );

  return insertedPassword;
}

export async function GET() {
  const client = new Client({
    connectionString: 'postgres://joe:helloKitty@localhost:5432/mylocaldatabase'
  });
  client.connect();
  try {

    await seedUsers(client)
    await seedPasswords(client)

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error: error }, { status: 500 });
  } finally {
    client.end()
  }
}