const db = require('./db');

async function seedDashboardData() {
  try {
    console.log('Seeding dashboard data...');
    
    // Get a lawyer ID (assuming lawyer with ID 1 exists)
    const lawyer = await db('lawyers').where('id', 1).first();
    if (!lawyer) {
      console.log('No lawyer found with ID 1. Please create a lawyer first.');
      return;
    }
    
    const lawyerId = lawyer.id;
    console.log(`Seeding data for lawyer: ${lawyer.name || 'Unknown'}`);
    
    // Seed some cases
    const cases = [
      {
        lawyer_id: lawyerId,
        title: 'Personal Injury Case - Smith vs. ABC Corp',
        client_id: null, // We'll need to create users first or leave null
        type: 'personal_injury',
        status: 'active',
        description: 'Car accident case involving negligence',
        filing_date: '2024-11-20'
      },
      {
        lawyer_id: lawyerId,
        title: 'Divorce Proceedings - Johnson',
        client_id: null,
        type: 'family',
        status: 'active',
        description: 'Contested divorce with child custody issues',
        filing_date: '2024-12-05'
      },
      {
        lawyer_id: lawyerId,
        title: 'Contract Dispute - Tech Solutions Inc',
        client_id: null,
        type: 'corporate',
        status: 'active',
        description: 'Breach of contract dispute',
        filing_date: '2024-12-12'
      },
      {
        lawyer_id: lawyerId,
        title: 'Criminal Defense - State vs. Brown',
        client_id: null,
        type: 'criminal',
        status: 'active',
        description: 'DUI defense case',
        filing_date: '2024-12-01'
      },
      {
        lawyer_id: lawyerId,
        title: 'Civil Rights Case - Davis',
        client_id: null,
        type: 'civil',
        status: 'active',
        description: 'Employment discrimination case',
        filing_date: '2024-12-08'
      }
    ];
    
    // Insert cases
    for (const caseData of cases) {
      const existingCase = await db('cases')
        .where({ lawyer_id: lawyerId, title: caseData.title })
        .first();
      
      if (!existingCase) {
        await db('cases').insert(caseData);
        console.log(`Inserted case: ${caseData.title}`);
      }
    }
    
    // Seed some invoices
    const invoices = [
      {
        lawyer_id: lawyerId,
        client_id: null,
        invoice_number: 'INV-2024-001',
        amount: 2500.00,
        status: 'paid',
        issue_date: '2024-11-20',
        due_date: '2024-12-20'
      },
      {
        lawyer_id: lawyerId,
        client_id: null,
        invoice_number: 'INV-2024-002',
        amount: 3200.00,
        status: 'paid',
        issue_date: '2024-12-01',
        due_date: '2024-12-31'
      },
      {
        lawyer_id: lawyerId,
        client_id: null,
        invoice_number: 'INV-2024-003',
        amount: 5500.00,
        status: 'pending',
        issue_date: '2024-12-10',
        due_date: '2025-01-10'
      },
      {
        lawyer_id: lawyerId,
        client_id: null,
        invoice_number: 'INV-2024-004',
        amount: 1800.00,
        status: 'paid',
        issue_date: '2024-12-05',
        due_date: '2025-01-05'
      }
    ];
    
    // Insert invoices
    for (const invoice of invoices) {
      const existingInvoice = await db('invoices')
        .where({ lawyer_id: lawyerId, invoice_number: invoice.invoice_number })
        .first();
      
      if (!existingInvoice) {
        await db('invoices').insert(invoice);
        console.log(`Inserted invoice: ${invoice.invoice_number}`);
      }
    }
    
    // Seed some events
    const events = [
      {
        lawyer_id: lawyerId,
        title: 'Client Meeting - John Smith',
        description: 'Discuss case progress and next steps',
        event_type: 'meeting',
        start_date_time: new Date('2024-12-18T14:00:00'),
        end_date_time: new Date('2024-12-18T15:00:00'),
        location: 'Office Conference Room',
        status: 'scheduled'
      },
      {
        lawyer_id: lawyerId,
        title: 'Court Hearing - Johnson Divorce',
        description: 'Preliminary hearing for divorce proceedings',
        event_type: 'hearing',
        start_date_time: new Date('2024-12-20T10:00:00'),
        end_date_time: new Date('2024-12-20T11:30:00'),
        location: 'Family Court Room 3',
        status: 'scheduled'
      },
      {
        lawyer_id: lawyerId,
        title: 'Document Review - Tech Solutions',
        description: 'Review contract documents and evidence',
        event_type: 'other',
        start_date_time: new Date('2024-12-22T09:00:00'),
        end_date_time: new Date('2024-12-22T12:00:00'),
        location: 'Office',
        status: 'scheduled'
      },
      {
        lawyer_id: lawyerId,
        title: 'Deposition - Brown Case',
        description: 'Client deposition for DUI case',
        event_type: 'other',
        start_date_time: new Date('2024-12-19T13:00:00'),
        end_date_time: new Date('2024-12-19T15:00:00'),
        location: 'Law Office',
        status: 'scheduled'
      }
    ];
    
    // Insert events
    for (const event of events) {
      const existingEvent = await db('events')
        .where({ lawyer_id: lawyerId, title: event.title })
        .first();
      
      if (!existingEvent) {
        await db('events').insert(event);
        console.log(`Inserted event: ${event.title}`);
      }
    }
    
    console.log('Dashboard data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding dashboard data:', error);
  } finally {
    process.exit(0);
  }
}

seedDashboardData();