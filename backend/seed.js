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
      { name: 'Jakarta Pusat Branch', address: 'Jl. Sudirman No. 123, Jakarta Pusat', phone: '+62 21 1234567', manager: 'Budi Santoso' },
      { name: 'Bandung Branch', address: 'Jl. Dago No. 45, Bandung', phone: '+62 22 7654321', manager: 'Siti Nurhaliza' },
      { name: 'Surabaya Branch', address: 'Jl. Basuki Rahmat No. 78, Surabaya', phone: '+62 31 9876543', manager: 'Ahmad Wijaya' },
      { name: 'Medan Branch', address: 'Jl. Gatot Subroto No. 99, Medan', phone: '+62 61 5551234', manager: 'Rini Kusuma' },
      { name: 'Yogyakarta Branch', address: 'Jl. Malioboro No. 12, Yogyakarta', phone: '+62 274 123456', manager: 'Dewi Lestari' }
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
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['admin', adminPassword, 'Super Admin', 'admin']
    );
    console.log('   ✓ Created admin user: admin (password: Admin@123)');

    await query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      ['admin2', adminPassword, 'Admin Secondary', 'admin']
    );
    console.log('   ✓ Created admin user: admin2 (password: Admin@123)');

    console.log('👥 Seeding staff members...');
    const staffPassword = await bcrypt.hash('Staff@123', 10);
    const staffMembers = [
      { branch_id: branchIds[0], username: 'staff_jakarta', full_name: 'Andi Prasetyo' },
      { branch_id: branchIds[0], username: 'staff_jakarta2', full_name: 'Lisa Permata' },
      { branch_id: branchIds[1], username: 'staff_bandung', full_name: 'Rina Susanti' },
      { branch_id: branchIds[1], username: 'staff_bandung2', full_name: 'Doni Kurniawan' },
      { branch_id: branchIds[2], username: 'staff_surabaya', full_name: 'Hendra Gunawan' },
      { branch_id: branchIds[2], username: 'staff_surabaya2', full_name: 'Maya Indah' },
      { branch_id: branchIds[3], username: 'staff_medan', full_name: 'Rudi Hermawan' },
      { branch_id: branchIds[4], username: 'staff_yogya', full_name: 'Putri Ayu' }
    ];

    for (const staff of staffMembers) {
      await query(
        'INSERT INTO staff (branch_id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
        [staff.branch_id, staff.username, staffPassword, staff.full_name, 'staff']
      );
      console.log(`   ✓ Created staff: ${staff.username} (password: Staff@123)`);
    }

    console.log('👨‍👩‍👧‍👦 Seeding customers...');
    
    const today = new Date();
    const formatDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    const customers = [
      { branch_id: branchIds[0], name: 'John Doe', email: 'john.doe@example.com', phone: '+62 812 3456789', address: 'Jl. Kebon Jeruk No. 1', daysAgo: 90, status: 'Active' },
      { branch_id: branchIds[0], name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+62 813 9876543', address: 'Jl. Meruya No. 23', daysAgo: 85, status: 'Active' },
      { branch_id: branchIds[0], name: 'Robert Johnson', email: 'robert.j@example.com', phone: '+62 821 5551234', address: 'Jl. Tanjung Duren No. 45', daysAgo: 60, status: 'Inactive' },
      { branch_id: branchIds[0], name: 'Emily Davis', email: 'emily.davis@example.com', phone: '+62 822 7778888', address: 'Jl. Grogol No. 67', daysAgo: 55, status: 'Active' },
      { branch_id: branchIds[0], name: 'Michael Wilson', email: 'michael.w@example.com', phone: '+62 823 4445555', address: 'Jl. Slipi No. 89', daysAgo: 30, status: 'Active' },
      
      { branch_id: branchIds[1], name: 'Sarah Anderson', email: 'sarah.a@example.com', phone: '+62 856 1112222', address: 'Jl. Cihampelas No. 12', daysAgo: 87, status: 'Active' },
      { branch_id: branchIds[1], name: 'David Martinez', email: 'david.m@example.com', phone: '+62 857 3334444', address: 'Jl. Pasteur No. 34', daysAgo: 65, status: 'Active' },
      { branch_id: branchIds[1], name: 'Jessica Taylor', email: 'jessica.t@example.com', phone: '+62 858 5556666', address: 'Jl. Buah Batu No. 56', daysAgo: 50, status: 'Inactive' },
      { branch_id: branchIds[1], name: 'James Brown', email: 'james.b@example.com', phone: '+62 859 7778888', address: 'Jl. Soekarno Hatta No. 78', daysAgo: 25, status: 'Active' },
      
      { branch_id: branchIds[2], name: 'Linda Garcia', email: 'linda.g@example.com', phone: '+62 877 1112222', address: 'Jl. Darmo No. 90', daysAgo: 83, status: 'Active' },
      { branch_id: branchIds[2], name: 'William Rodriguez', email: 'william.r@example.com', phone: '+62 878 3334444', address: 'Jl. Raya Gubeng No. 11', daysAgo: 58, status: 'Active' },
      { branch_id: branchIds[2], name: 'Patricia Lee', email: 'patricia.l@example.com', phone: '+62 879 5556666', address: 'Jl. Pemuda No. 22', daysAgo: 45, status: 'Active' },
      { branch_id: branchIds[2], name: 'Thomas White', email: 'thomas.w@example.com', phone: '+62 881 7778888', address: 'Jl. Diponegoro No. 33', daysAgo: 28, status: 'Inactive' },
      
      { branch_id: branchIds[3], name: 'Barbara Hall', email: 'barbara.h@example.com', phone: '+62 852 1112222', address: 'Jl. Imam Bonjol No. 44', daysAgo: 80, status: 'Active' },
      { branch_id: branchIds[3], name: 'Charles Young', email: 'charles.y@example.com', phone: '+62 853 3334444', address: 'Jl. Sisingamangaraja No. 55', daysAgo: 52, status: 'Active' },
      { branch_id: branchIds[3], name: 'Nancy King', email: 'nancy.k@example.com', phone: '+62 854 5556666', address: 'Jl. Asia No. 66', daysAgo: 26, status: 'Active' },
      
      { branch_id: branchIds[4], name: 'Christopher Wright', email: 'chris.w@example.com', phone: '+62 895 1112222', address: 'Jl. Kaliurang No. 77', daysAgo: 77, status: 'Active' },
      { branch_id: branchIds[4], name: 'Susan Scott', email: 'susan.s@example.com', phone: '+62 896 3334444', address: 'Jl. Godean No. 88', daysAgo: 48, status: 'Active' },
      { branch_id: branchIds[4], name: 'Daniel Green', email: 'daniel.g@example.com', phone: '+62 897 5556666', address: 'Jl. Solo No. 99', daysAgo: 22, status: 'Inactive' },
      { branch_id: branchIds[4], name: 'Karen Adams', email: 'karen.a@example.com', phone: '+62 898 7778888', address: 'Jl. Wates No. 101', daysAgo: 19, status: 'Active' }
    ];

    for (const customer of customers) {
      await query(
        'INSERT INTO customers (branch_id, full_name, email, phone_number, address, registration_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customer.branch_id, customer.name, customer.email, customer.phone, customer.address, formatDate(customer.daysAgo), customer.status]
      );
    }
    console.log(`   ✓ Created ${customers.length} customers across all branches`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin / Admin@123');
    console.log('   Admin2: admin2 / Admin@123');
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
