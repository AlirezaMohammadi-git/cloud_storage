

import { passwords, users } from '@/constants';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      fullname VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar TEXT NOT NULL UNIQUE,
      logInMehtod TEXT NOT NULL
    );
  `;

    const insertedUsers = await Promise.all(
        users.map(async (user) => {
            return sql`
        INSERT INTO users (id, fullname, email, avatar,logInMethod)
        VALUES (${user.id}, ${user.fullname}, ${user.email}, ${user.avatar}, ${user.logInMethod})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    return insertedUsers;
}


async function seedPasswords() {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await sql`
    CREATE TABLE IF NOT EXISTS passwords (
      userId UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      hash TEXT NOT NULL
    );
  `;

    const insertedPassword = await Promise.all(
        passwords.map(async (pass) => {
            return sql`
        INSERT INTO passwords (userId, hash)
        VALUES (${pass.userId},${pass.hash})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    return insertedPassword;
}

export async function GET() {
    try {
        const result = await sql.begin(() => [
            seedUsers(),
            seedPasswords(),
        ]);

        return Response.json({ message: 'Database seeded successfully', data: result });
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}