exports.up = function(knex) {
  return Promise.all([
    // Insert sample cases
    knex('cases').insert([
      {
        id: 1,
        lawyer_id: 1,
        title: 'Smith vs. Johnson',
        client_name: 'John Smith',
        type: 'Personal Injury',
        status: 'active',
        description: 'Personal injury case involving car accident',
        created_date: '2024-01-15'
      },
      {
        id: 2,
        lawyer_id: 1,
        title: 'Business Contract Dispute',
        client_name: 'Sarah Wilson',
        type: 'Business',
        status: 'pending',
        description: 'Contract dispute between business partners',
        created_date: '2024-01-20'
      },
      {
        id: 3,
        lawyer_id: 1,
        title: 'Property Settlement',
        client_name: 'Mike Davis',
        type: 'Real Estate',
        status: 'closed',
        description: 'Property settlement and transfer',
        created_date: '2024-01-10'
      }
    ]),
    
    // Insert sample appointments
    knex('appointments').insert([
      {
        id: 1,
        lawyer_id: 1,
        title: 'Court Hearing',
        date: '2024-01-25',
        type: 'hearing',
        client_name: 'John Smith'
      },
      {
        id: 2,
        lawyer_id: 1,
        title: 'Client Meeting',
        date: '2024-01-26',
        type: 'meeting',
        client_name: 'Sarah Wilson'
      },
      {
        id: 3,
        lawyer_id: 1,
        title: 'Deposition',
        date: '2024-01-28',
        type: 'deposition',
        client_name: 'Mike Davis'
      }
    ]),
    
    // Insert sample documents
    knex('documents').insert([
      {
        id: 1,
        lawyer_id: 1,
        case_id: 1,
        filename: 'Contract_Smith.pdf',
        file_path: '/uploads/documents/contract_smith.pdf',
        upload_date: '2024-01-15'
      },
      {
        id: 2,
        lawyer_id: 1,
        case_id: 2,
        filename: 'Evidence_Wilson.pdf',
        file_path: '/uploads/documents/evidence_wilson.pdf',
        upload_date: '2024-01-20'
      }
    ]),
    
    // Insert sample invoices
    knex('invoices').insert([
      {
        id: 1,
        lawyer_id: 1,
        invoice_number: 'INV-001',
        client_name: 'John Smith',
        amount: 2500.00,
        status: 'paid',
        created_date: '2024-01-15'
      },
      {
        id: 2,
        lawyer_id: 1,
        invoice_number: 'INV-002',
        client_name: 'Sarah Wilson',
        amount: 3200.00,
        status: 'pending',
        created_date: '2024-01-20'
      },
      {
        id: 3,
        lawyer_id: 1,
        invoice_number: 'INV-003',
        client_name: 'Mike Davis',
        amount: 1800.00,
        status: 'overdue',
        created_date: '2024-01-10'
      }
    ])
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex('invoices').del(),
    knex('documents').del(),
    knex('appointments').del(),
    knex('cases').del()
  ]);
};