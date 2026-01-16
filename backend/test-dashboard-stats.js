require('dotenv').config();
const db = require('./db');

async function testDashboardStats() {
  try {
    console.log('=== Testing Dashboard Stats API ===\n');

    const lawyerId = 44;
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    console.log('Lawyer ID:', lawyerId);
    console.log('Current Date:', currentDate.toISOString());
    console.log('This Month Start:', thisMonth.toISOString());
    console.log('Last Month Start:', lastMonth.toISOString());
    console.log('');

    // Test revenue queries
    const [monthlyRevenue, totalRevenue, lastMonthRevenue] = await Promise.all([
      db('transactions')
        .where('lawyer_id', lawyerId)
        .where('status', 'completed')
        .whereBetween('created_at', [thisMonth, currentDate])
        .sum('lawyer_earnings as total').first(),
      db('transactions')
        .where('lawyer_id', lawyerId)
        .where('status', 'completed')
        .sum('lawyer_earnings as total').first(),
      db('transactions')
        .where('lawyer_id', lawyerId)
        .where('status', 'completed')
        .whereBetween('created_at', [lastMonth, thisMonth])
        .sum('lawyer_earnings as total').first()
    ]);

    console.log('Revenue Data:');
    console.log('  This Month:', `$${parseFloat(monthlyRevenue.total || 0).toFixed(2)}`);
    console.log('  Total All Time:', `$${parseFloat(totalRevenue.total || 0).toFixed(2)}`);
    console.log('  Last Month:', `$${parseFloat(lastMonthRevenue.total || 0).toFixed(2)}`);
    console.log('');

    // Calculate growth
    const currentMonthlyRevenue = parseFloat(monthlyRevenue.total) || 0;
    const lastMonthlyRevenue = parseFloat(lastMonthRevenue.total) || 0;
    const growth = lastMonthlyRevenue > 0 
      ? Math.round(((currentMonthlyRevenue - lastMonthlyRevenue) / lastMonthlyRevenue) * 100)
      : currentMonthlyRevenue > 0 ? 100 : 0;

    console.log('Growth Calculation:');
    console.log('  Current:', currentMonthlyRevenue);
    console.log('  Previous:', lastMonthlyRevenue);
    console.log('  Growth:', `${growth}%`);
    console.log('');

    // Test monthly revenue data for chart
    console.log('Monthly Revenue Data (Last 12 Months):');
    const monthlyRevenueData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthRevenue = await db('transactions')
        .where('lawyer_id', lawyerId)
        .where('status', 'completed')
        .whereBetween('created_at', [monthStart, monthEnd])
        .sum('lawyer_earnings as total').first();
      
      const amount = parseFloat(monthRevenue.total) || 0;
      const monthName = monthStart.toLocaleString('default', { month: 'short' });
      
      monthlyRevenueData.push({ month: monthName, amount });
      console.log(`  ${monthName}: $${amount.toFixed(2)}`);
    }
    console.log('');

    // Test transaction count
    const transactionCount = await db('transactions')
      .where('lawyer_id', lawyerId)
      .where('status', 'completed')
      .count('id as count').first();

    console.log('Transaction Count:', transactionCount.count);
    console.log('');

    console.log('✅ All queries successful!');
    console.log('');
    console.log('Expected Dashboard Display:');
    console.log(`  Total Earnings: $${parseFloat(totalRevenue.total || 0).toFixed(2)}`);
    console.log(`  This Month: $${parseFloat(monthlyRevenue.total || 0).toFixed(2)}`);
    console.log(`  Growth: ${growth > 0 ? '+' : ''}${growth}%`);
    console.log('');
    console.log('🎉 Dashboard should now show correct earnings!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.destroy();
  }
}

testDashboardStats();
