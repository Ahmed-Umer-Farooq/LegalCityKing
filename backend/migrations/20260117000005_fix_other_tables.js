exports.up = async function(knex) {
  // Ensure blogs table has all fields
  const blogsColumns = [
    { name: 'title', type: 'string', notNullable: true },
    { name: 'slug', type: 'string', unique: true },
    { name: 'excerpt', type: 'text' },
    { name: 'content', type: 'text' },
    { name: 'featured_image', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'tags', type: 'json' },
    { name: 'views_count', type: 'integer', default: 0 },
    { name: 'author_id', type: 'integer', unsigned: true, references: 'lawyers.id' },
    { name: 'status', type: 'string', default: 'draft' },
    { name: 'published_at', type: 'timestamp' },
    { name: 'author_name', type: 'string' },
    { name: 'meta_title', type: 'string' },
    { name: 'focus_keyword', type: 'string' },
    { name: 'meta_description', type: 'text' },
    { name: 'image_alt_text', type: 'string' },
    { name: 'secure_id', type: 'string', unique: true }
  ];

  for (const col of blogsColumns) {
    const exists = await knex.schema.hasColumn('blogs', col.name);
    if (!exists) {
      await knex.schema.alterTable('blogs', function(t) {
        let column;
        if (col.type === 'string') {
          column = t.string(col.name);
          if (col.unique) column = column.unique();
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'integer') {
          column = t.integer(col.name).defaultTo(col.default || 0);
          if (col.unsigned) column = column.unsigned();
          if (col.references) column = column.references(col.references.split('.')[1]).inTable(col.references.split('.')[0]).onDelete('CASCADE');
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'timestamp') {
          column = t.timestamp(col.name);
          if (col.default) column = column.defaultTo(col.default);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'json') {
          column = t.json(col.name);
        }
      });
    }
  }

  // Ensure cases table has all fields
  const casesColumns = [
    { name: 'lawyer_id', type: 'integer', unsigned: true, references: 'lawyers.id' },
    { name: 'title', type: 'string', notNullable: true },
    { name: 'type', type: 'string' },
    { name: 'status', type: 'string', default: 'active' },
    { name: 'description', type: 'text' },
    { name: 'case_number', type: 'string', unique: true },
    { name: 'filing_date', type: 'date' },
    { name: 'client_id', type: 'integer', unsigned: true, references: 'users.id' },
    { name: 'estimated_value', type: 'decimal', precision: 10, scale: 2 },
    { name: 'actual_value', type: 'decimal', precision: 10, scale: 2 },
    { name: 'next_hearing_date', type: 'timestamp' }
  ];

  for (const col of casesColumns) {
    const exists = await knex.schema.hasColumn('cases', col.name);
    if (!exists) {
      await knex.schema.alterTable('cases', function(t) {
        let column;
        if (col.type === 'string') {
          column = t.string(col.name);
          if (col.unique) column = column.unique();
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'integer') {
          column = t.integer(col.name);
          if (col.unsigned) column = column.unsigned();
          if (col.references) column = column.references(col.references.split('.')[1]).inTable(col.references.split('.')[0]).onDelete('CASCADE');
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'decimal') {
          column = t.decimal(col.name, col.precision, col.scale);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'date') {
          column = t.date(col.name);
        } else if (col.type === 'timestamp') {
          column = t.timestamp(col.name);
          if (col.default) column = column.defaultTo(col.default);
          if (col.notNullable) column = column.notNullable();
        }
      });
    }
  }

  // Ensure chat_messages has all fields
  const chatMessagesColumns = [
    { name: 'sender_id', type: 'integer', notNullable: true },
    { name: 'sender_type', type: 'string', notNullable: true },
    { name: 'receiver_id', type: 'integer', notNullable: true },
    { name: 'receiver_type', type: 'string', notNullable: true },
    { name: 'content', type: 'text' },
    { name: 'read_status', type: 'boolean', default: false },
    { name: 'message_type', type: 'string', default: 'text' },
    { name: 'file_url', type: 'string' },
    { name: 'file_name', type: 'string' },
    { name: 'file_size', type: 'integer' }
  ];

  for (const col of chatMessagesColumns) {
    const exists = await knex.schema.hasColumn('chat_messages', col.name);
    if (!exists) {
      await knex.schema.alterTable('chat_messages', function(t) {
        let column;
        if (col.type === 'integer') {
          column = t.integer(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'string') {
          column = t.string(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'boolean') {
          column = t.boolean(col.name).defaultTo(col.default || false);
        }
      });
    }
  }

  // Ensure qa_questions has is_public
  const hasIsPublic = await knex.schema.hasColumn('qa_questions', 'is_public');
  if (!hasIsPublic) {
    await knex.schema.alterTable('qa_questions', function(t) {
      t.boolean('is_public').defaultTo(false);
    });
  }

  // Ensure platform_reviews has all fields
  const platformReviewsColumns = [
    { name: 'lawyer_id', type: 'integer', unsigned: true, references: 'lawyers.id' },
    { name: 'client_name', type: 'string', notNullable: true },
    { name: 'client_title', type: 'string' },
    { name: 'review_text', type: 'text', notNullable: true },
    { name: 'rating', type: 'integer', notNullable: true },
    { name: 'is_approved', type: 'boolean', default: false },
    { name: 'is_featured', type: 'boolean', default: false }
  ];

  for (const col of platformReviewsColumns) {
    const exists = await knex.schema.hasColumn('platform_reviews', col.name);
    if (!exists) {
      await knex.schema.alterTable('platform_reviews', function(t) {
        let column;
        if (col.type === 'integer') {
          column = t.integer(col.name);
          if (col.unsigned) column = column.unsigned();
          if (col.references) column = column.references(col.references.split('.')[1]).inTable(col.references.split('.')[0]).onDelete('CASCADE');
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'string') {
          column = t.string(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'text') {
          column = t.text(col.name);
          if (col.notNullable) column = column.notNullable();
        } else if (col.type === 'boolean') {
          column = t.boolean(col.name).defaultTo(col.default || false);
        }
      });
    }
  }
};

exports.down = function(knex) {
  // No down migration as this is a fix
  return Promise.resolve();
};
