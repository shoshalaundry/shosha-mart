import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('DB URL Check:', process.env.TURSO_DATABASE_URL ? 'FOUND' : 'NOT FOUND');

import { db } from './index';
import { users, tiers } from './schema';
import { hash } from 'bcryptjs';

async function main() {
    console.log('Seeding database...');

    // Optional: Clean up existing data for clean re-seeding
    await db.delete(users);
    await db.delete(tiers);

    // Create Tiers
    const [l24jTier, shoshaTier] = await db.insert(tiers).values([
        { name: 'L24J' },
        { name: 'SHOSHA' },
    ]).returning();

    console.log('Created tiers:', l24jTier.name, shoshaTier.name);

    // Default password for all seed users
    const defaultPassword = await hash('password123', 10);

    // Create Users
    await db.insert(users).values([
        {
            username: 'superadmin',
            phone: '08111111111',
            password: defaultPassword,
            role: 'SUPERADMIN',
        },
        {
            username: 'admin_l24j',
            phone: '08222222222',
            password: defaultPassword,
            role: 'ADMIN_TIER',
            tierId: l24jTier.id,
        },
        {
            username: 'admin_shosha',
            phone: '08333333333',
            password: defaultPassword,
            role: 'ADMIN_TIER',
            tierId: shoshaTier.id,
        },
        {
            username: 'buyer_l24j',
            phone: '08444444444',
            password: defaultPassword,
            role: 'BUYER',
            tierId: l24jTier.id,
            branchName: 'L24J Branch 1',
        },
        {
            username: 'buyer_shosha',
            phone: '08555555555',
            password: defaultPassword,
            role: 'BUYER',
            tierId: shoshaTier.id,
            branchName: 'SHOSHA Branch 1',
        },
    ]);

    console.log('Database seeded successfully!');
}

main().catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
});
