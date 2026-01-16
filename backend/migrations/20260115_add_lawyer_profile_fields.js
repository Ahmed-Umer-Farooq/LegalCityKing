exports.up = async function(knex) {
  const hasEducation = await knex.schema.hasColumn('lawyers', 'education');
  const hasExperience = await knex.schema.hasColumn('lawyers', 'experience');
  const hasCertifications = await knex.schema.hasColumn('lawyers', 'certifications');
  const hasLanguages = await knex.schema.hasColumn('lawyers', 'languages');
  const hasPracticeAreas = await knex.schema.hasColumn('lawyers', 'practice_areas');
  const hasAssociations = await knex.schema.hasColumn('lawyers', 'associations');
  const hasPublications = await knex.schema.hasColumn('lawyers', 'publications');
  const hasSpeaking = await knex.schema.hasColumn('lawyers', 'speaking');
  const hasOfficeHours = await knex.schema.hasColumn('lawyers', 'office_hours');
  const hasPaymentOptions = await knex.schema.hasColumn('lawyers', 'payment_options');
  const hasYearsLicensed = await knex.schema.hasColumn('lawyers', 'years_licensed');
  const hasHourlyRate = await knex.schema.hasColumn('lawyers', 'hourly_rate');

  return knex.schema.table('lawyers', function(table) {
    if (!hasEducation) table.text('education').nullable();
    if (!hasExperience) table.text('experience').nullable();
    if (!hasCertifications) table.text('certifications').nullable();
    if (!hasLanguages) table.text('languages').nullable();
    if (!hasPracticeAreas) table.text('practice_areas').nullable();
    if (!hasAssociations) table.text('associations').nullable();
    if (!hasPublications) table.text('publications').nullable();
    if (!hasSpeaking) table.text('speaking').nullable();
    if (!hasOfficeHours) table.text('office_hours').nullable();
    if (!hasPaymentOptions) table.text('payment_options').nullable();
    if (!hasYearsLicensed) table.string('years_licensed').nullable();
    if (!hasHourlyRate) table.string('hourly_rate').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('lawyers', function(table) {
    table.dropColumn('education');
    table.dropColumn('experience');
    table.dropColumn('certifications');
    table.dropColumn('languages');
    table.dropColumn('practice_areas');
    table.dropColumn('associations');
    table.dropColumn('publications');
    table.dropColumn('speaking');
    table.dropColumn('office_hours');
    table.dropColumn('payment_options');
    table.dropColumn('years_licensed');
    table.dropColumn('hourly_rate');
  });
};
