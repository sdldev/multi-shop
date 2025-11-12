import { query, getConnection } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedCustomersOnly() {
  let conn;
  try {
    console.log('🌱 Starting customer seeding (100,000 records for testing)...');

    conn = await getConnection();

    // Get existing branch IDs
    const branches = await query('SELECT branch_id FROM branches ORDER BY branch_id');
    if (branches.length === 0) {
      throw new Error('No branches found. Please run main seeder first: npm run seed');
    }
    
    const branchIds = branches.map(b => b.branch_id);
    console.log(`📦 Found ${branchIds.length} branches`);

    // Clear existing customers
    console.log('🗑️  Clearing existing customers...');
    await query('DELETE FROM customers');
    console.log('   ✓ Cleared existing customers');

    console.log('👨‍👩‍👧‍👦 Generating 100,000 customers...');
    
    const today = new Date();
    const formatDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    // Name pools for variety
    const firstNames = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kartika', 'Lina', 'Made', 'Novi', 'Omar', 'Putri', 'Qori', 'Rina', 'Sari', 'Tono', 'Usman', 'Vina', 'Wati', 'Yanto', 'Zahra'];
    const lastNames = ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Saputra', 'Utama', 'Firmansyah', 'Hidayat', 'Nugroho', 'Permana', 'Setiawan', 'Wibowo', 'Putra', 'Cahaya', 'Rahman', 'Hakim', 'Mulia', 'Jaya', 'Purnama', 'Riyadi'];
    const streets = ['Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Kuningan', 'Jl. Senopati', 'Jl. Menteng', 'Jl. Kemang', 'Jl. Blok M', 'Jl. Kebayoran', 'Jl. Tebet', 'Jl. Kebon Jeruk', 'Jl. Palmerah', 'Jl. Cikini', 'Jl. Salemba'];
    const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta', 'Medan', 'Makassar', 'Palembang', 'Batam', 'Bogor'];
    const statuses = ['Active', 'Active', 'Active', 'Inactive']; // 75% Active, 25% Inactive

    const TOTAL_CUSTOMERS = 100000;
    const BATCH_SIZE = 1000; // Larger batch for 100k records
    
    for (let i = 0; i < TOTAL_CUSTOMERS; i += BATCH_SIZE) {
      const batch = [];
      const batchEnd = Math.min(i + BATCH_SIZE, TOTAL_CUSTOMERS);
      
      for (let j = i; j < batchEnd; j++) {
        const firstName = firstNames[j % firstNames.length];
        const lastName = lastNames[Math.floor(j / firstNames.length) % lastNames.length];
        const branchIndex = j % branchIds.length;
        const street = streets[j % streets.length];
        const city = cities[j % cities.length];
        const status = statuses[j % statuses.length];
        
        batch.push([
          branchIds[branchIndex],
          `${firstName} ${lastName}`,
          `customer${j + 1}@example.com`,
          `+62 8${String(j).padStart(10, '0')}`,
          `CUST-${String(j + 1).padStart(5, '0')}`,
          `${street} No. ${(j % 100) + 1}, ${city}`,
          formatDate(Math.floor(Math.random() * 365)), // Random date within last year
          status
        ]);
      }
      
      // Batch insert
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flat();
      
      await query(
        `INSERT INTO customers (branch_id, full_name, email, phone_number, code, address, registration_date, status) VALUES ${placeholders}`,
        values
      );
      
      console.log(`   ✓ Created ${batchEnd} / ${TOTAL_CUSTOMERS} customers...`);
    }
    
    console.log(`\n✅ Successfully created ${TOTAL_CUSTOMERS} customers!`);
    
    // Show distribution
    const distribution = await query(`
      SELECT b.branch_name, COUNT(*) as customer_count
      FROM customers c
      JOIN branches b ON c.branch_id = b.branch_id
      GROUP BY b.branch_id, b.branch_name
    `);
    
    console.log('\n📊 Customer distribution by branch:');
    distribution.forEach(d => {
      console.log(`   ${d.branch_name}: ${d.customer_count} customers`);
    });
    
    const statusCount = await query(`
      SELECT status, COUNT(*) as count
      FROM customers
      GROUP BY status
    `);
    
    console.log('\n📈 Customer by status:');
    statusCount.forEach(s => {
      console.log(`   ${s.status}: ${s.count} customers`);
    });

    console.log('\n🚀 Ready to test pagination! Start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

seedCustomersOnly();
