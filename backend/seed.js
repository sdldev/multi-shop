import bcrypt from 'bcrypt';
import { query, getConnection } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  let conn;
  try {
    console.log('🌱 Starting database seeding...');

    conn = await getConnection();

    console.log('📦 Seeding branches...');
    const branches = [
      { name: 'BTH', address: 'Jl. Sudirman No. 123, Batanghari', phone: '+62211234567', manager: 'Budi Santoso' },
      { name: 'SBR', address: 'Jl. Dago No. 45, Simbaringin', phone: '+62227654321', manager: 'Siti Nurhaliza' },
      { name: 'PSW', address: 'Jl. Basuki Rahmat No. 78, Pringsewu', phone: '+62319876543', manager: 'Ahmad Wijaya' },
   ];

    const branchIds = [];
    for (const branch of branches) {
      const result = await query(
        'INSERT INTO branches (branch_name, address, phone_number, manager_name) VALUES (?, ?, ?, ?)',
        [branch.name, branch.address, branch.phone, branch.manager]
      );
      branchIds.push(result.insertId);
      console.log(`   ✓ Created branch: ${branch.name}`);
    }

    console.log('👤 Seeding admin users...');
    const adminPassword = await bcrypt.hash('CustPSW11!!', 10);
    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['superadmin', adminPassword, 'Super Admin', 'admin']
    );
    console.log('   ✓ Created admin user: admin (password: CustPSW11!!)');

    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['admin', adminPassword, 'Admin', 'admin']
    );
    console.log('   ✓ Created admin user: admin2 (password: CustPSW11!!)');

    console.log('👥 Seeding staff members...');
    const staffPassword = await bcrypt.hash('Staff@123', 10);
    const staffMembers = [
      { branch_id: branchIds[0], username: 'katokopws', full_name: 'Ari retno', code: 'STF-JKT-001', address: 'Jl. Kemanggisan No. 10, Jakarta' },
      { branch_id: branchIds[0], username: 'adminpsw', full_name: 'Lisa Siapa', code: 'STF-JKT-002', address: 'Jl. Palmerah No. 15, Jakarta' },
      { branch_id: branchIds[0], username: 'kasirpsw', full_name: 'Rina Siapa', code: 'STF-BDG-001', address: 'Jl. Cibaduyut No. 20, Bandung' },
    ];

    for (const staff of staffMembers) {
      await query(
        'INSERT INTO staff (branch_id, username, password_hash, full_name, code, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [staff.branch_id, staff.username, staffPassword, staff.full_name, staff.code, staff.address, 'staff']
      );
      console.log(`   ✓ Created staff: ${staff.username} (password: Staff@123)`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Super Admin: superadmin / CustPSW11!!');
    console.log('   Admin: admin / CustPSW11!!');
    console.log('   Staff: staff_jakarta / Staff@123 (and other staff accounts)');
    console.log('\n🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

seedDatabase();
