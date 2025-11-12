import bcrypt from 'bcrypt';
import crypto from 'crypto';
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

    console.log('👤 Seeding management users...');
    const adminPassword = await bcrypt.hash('CustPSW11!!', 10);
    
    // Create Owner
    const ownerResult = await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['owner', adminPassword, 'System Owner', 'Owner']
    );
    const ownerId = ownerResult.insertId;
    console.log('   ✓ Created user: owner (Role: Owner, password: CustPSW11!!)');

    // Generate API key for Owner (for testing/integration)
    console.log('\n🔑 Generating API key for Owner...');
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const apiKeyPlain = `sk_${env}_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKeyPlain).digest('hex');
    
    const scopes = JSON.stringify([
      'read:customers',
      'write:customers',
      'read:branches',
      'write:branches',
      'read:staff',
      'write:staff',
      'read:dashboard',
      'admin:*'
    ]);

    await query(
      'INSERT INTO api_keys (user_id, key_hash, name, scopes) VALUES (?, ?, ?, ?)',
      [ownerId, keyHash, 'Owner Default API Key', scopes]
    );
    
    console.log('\n⚠️  IMPORTANT: Save this API key securely! It will NOT be shown again:');
    console.log(`   ${apiKeyPlain}`);
    console.log('\n   Add this to your .env file:');
    console.log(`   API_KEY=${apiKeyPlain}\n`);

    // Create Manager
    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['manager', adminPassword, 'General Manager', 'Manager']
    );
    console.log('   ✓ Created user: manager (Role: Manager, password: CustPSW11!!)');

    // Create Head Branch Manager
    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['headbranch', adminPassword, 'Head Branch Manager', 'Head Branch Manager']
    );
    console.log('   ✓ Created user: headbranch (Role: Head Branch Manager, password: CustPSW11!!)');

    // Create Management
    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['management', adminPassword, 'Management Staff', 'Management']
    );
    console.log('   ✓ Created user: management (Role: Management, password: CustPSW11!!)');

    // Create Warehouse
    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['warehouse', adminPassword, 'Warehouse Manager', 'Warehouse']
    );
    console.log('   ✓ Created user: warehouse (Role: Warehouse, password: CustPSW11!!)');

    console.log('👥 Seeding staff members...');
    const staffPassword = await bcrypt.hash('Staff@123', 10);
    const staffMembers = [
      { branch_id: branchIds[0], username: 'headbranch_bth', full_name: 'Kepala Cabang BTH', code: 'STF-BTH-001', address: 'Jl. Kemanggisan No. 10, Batanghari', role: 'HeadBranch' },
      { branch_id: branchIds[0], username: 'admin_bth', full_name: 'Admin BTH', code: 'STF-BTH-002', address: 'Jl. Palmerah No. 15, Batanghari', role: 'Admin' },
      { branch_id: branchIds[0], username: 'cashier_bth', full_name: 'Kasir BTH', code: 'STF-BTH-003', address: 'Jl. Cibaduyut No. 20, Batanghari', role: 'Cashier' },
      { branch_id: branchIds[1], username: 'headbranch_sbr', full_name: 'Kepala Cabang SBR', code: 'STF-SBR-001', address: 'Jl. Dago No. 25, Simbaringin', role: 'HeadBranch' },
      { branch_id: branchIds[1], username: 'headcounter_sbr', full_name: 'Kepala Counter SBR', code: 'STF-SBR-002', address: 'Jl. Braga No. 30, Simbaringin', role: 'HeadCounter' },
      { branch_id: branchIds[2], username: 'headbranch_psw', full_name: 'Kepala Cabang PSW', code: 'STF-PSW-001', address: 'Jl. Kemanggisan No. 10, Pringsewu', role: 'HeadBranch' },
      { branch_id: branchIds[2], username: 'staff_psw', full_name: 'Staff PSW', code: 'STF-PSW-001', address: 'Jl. Basuki No. 40, Pringsewu', role: 'Staff' },
    ];

    for (const staff of staffMembers) {
      await query(
        'INSERT INTO staff (branch_id, username, password_hash, full_name, code, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [staff.branch_id, staff.username, staffPassword, staff.full_name, staff.code, staff.address, staff.role]
      );
      console.log(`   ✓ Created staff: ${staff.username} (Role: ${staff.role}, password: Staff@123)`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Management Users:');
    console.log('     - Owner: owner / CustPSW11!!');
    console.log('     - Manager: manager / CustPSW11!!');
    console.log('     - Head Branch Manager: headbranch / CustPSW11!!');
    console.log('     - Management: management / CustPSW11!!');
    console.log('     - Warehouse: warehouse / CustPSW11!!');
    console.log('   Staff (all password: Staff@123):');
    console.log('     - headbranch_bth (HeadBranch - BTH)');
    console.log('     - admin_bth (Admin - BTH)');
    console.log('     - cashier_bth (Cashier - BTH)');
    console.log('     - headbranch_sbr (HeadBranch - SBR)');
    console.log('     - headcounter_sbr (HeadCounter - SBR)');
    console.log('     - staff_psw (Staff - PSW)');
    console.log('\n� Security Reminder:');
    console.log('   - API key shown above is for TESTING only');
    console.log('   - Generate new production API keys after deployment');
    console.log('   - Never commit API keys to version control');
    console.log('\n�🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

seedDatabase();
