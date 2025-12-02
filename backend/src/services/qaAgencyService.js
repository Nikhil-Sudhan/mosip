const { pool } = require('../db');
const { v4: uuid } = require('uuid');

/**
 * QA Agency Service - Handles QA agency matching and assignment
 * 
 * This service:
 * - Matches batches to suitable QA agencies
 * - Manages QA agency profiles and specialties
 * - Handles inspection request assignments
 */

/**
 * Get all active QA agencies
 */
async function getActiveQAAgencies() {
  const result = await pool.query(`
    SELECT 
      qa.*,
      u.id as user_id,
      u.email,
      u.organization,
      u.role
    FROM qa_agencies qa
    JOIN users u ON qa.user_id = u.id
    WHERE qa.is_active = TRUE
    ORDER BY qa.created_at ASC
  `);
  return result.rows;
}

/**
 * Get QA agency by user ID
 */
async function getQAAgencyByUserId(userId) {
  const result = await pool.query(`
    SELECT 
      qa.*,
      u.id as user_id,
      u.email,
      u.organization,
      u.role
    FROM qa_agencies qa
    JOIN users u ON qa.user_id = u.id
    WHERE qa.user_id = $1 AND qa.is_active = TRUE
  `, [userId]);
  return result.rows[0] || null;
}

/**
 * Create or update QA agency profile
 */
async function createOrUpdateQAAgency(userId, data) {
  const existing = await pool.query(
    'SELECT id FROM qa_agencies WHERE user_id = $1',
    [userId]
  );

  if (existing.rows.length > 0) {
    // Update existing
    const result = await pool.query(`
      UPDATE qa_agencies
      SET 
        certification_number = COALESCE($1, certification_number),
        specialties = COALESCE($2, specialties),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE user_id = $4
      RETURNING *
    `, [
      data.certificationNumber || null,
      data.specialties || null,
      data.isActive !== undefined ? data.isActive : true,
      userId,
    ]);
    return result.rows[0];
  } else {
    // Create new
    const result = await pool.query(`
      INSERT INTO qa_agencies (user_id, certification_number, specialties, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      userId,
      data.certificationNumber || null,
      data.specialties || [],
      data.isActive !== undefined ? data.isActive : true,
    ]);
    return result.rows[0];
  }
}

/**
 * Match a batch to a suitable QA agency
 * Rules:
 * - Agency must be active
 * - Agency specialties should match product type (if specified)
 * - Round-robin assignment (least recent assignment)
 */
async function matchBatchToQA(batch) {
  const agencies = await getActiveQAAgencies();
  
  if (agencies.length === 0) {
    return null;
  }

  // Filter by specialty if product type matches
  let candidates = agencies;
  if (batch.productType) {
    const productTypeLower = batch.productType.toLowerCase();
    const specialtyMatches = agencies.filter(agency => {
      if (!agency.specialties || agency.specialties.length === 0) {
        return true; // No specialties means can handle all
      }
      return agency.specialties.some(spec => 
        spec.toLowerCase().includes(productTypeLower) ||
        productTypeLower.includes(spec.toLowerCase())
      );
    });
    
    if (specialtyMatches.length > 0) {
      candidates = specialtyMatches;
    }
  }

  // Get pending inspection count for each agency
  const agencyLoads = await Promise.all(
    candidates.map(async (agency) => {
      const loadResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM batches
        WHERE qa_agency_id = $1 
          AND status IN ('QA_ASSIGNED', 'INSPECTION_SCHEDULED')
      `, [agency.user_id]);
      
      return {
        agency,
        load: parseInt(loadResult.rows[0].count, 10),
      };
    })
  );

  // Sort by load (ascending) and pick the one with least load
  agencyLoads.sort((a, b) => a.load - b.load);
  
  return agencyLoads[0]?.agency || null;
}

/**
 * Assign batch to QA agency
 */
async function assignBatchToQA(batchId, qaAgencyId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update batch
    const batchResult = await client.query(`
      UPDATE batches
      SET 
        qa_agency_id = $1,
        inspection_requested_at = NOW(),
        status = 'QA_ASSIGNED',
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [qaAgencyId, batchId]);

    if (batchResult.rows.length === 0) {
      throw new Error('Batch not found');
    }

    // Add history entry
    await client.query(`
      INSERT INTO batch_history (batch_id, status, message)
      VALUES ($1, 'QA_ASSIGNED', $2)
    `, [
      batchId,
      `Batch assigned to QA agency for inspection`,
    ]);

    await client.query('COMMIT');
    return batchResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get pending inspections for a QA agency
 */
async function getPendingInspections(qaAgencyId) {
  const result = await pool.query(`
    SELECT 
      b.*,
      u.email as exporter_email,
      u.organization as exporter_organization
    FROM batches b
    JOIN users u ON b.exporter_id = u.id
    WHERE b.qa_agency_id = $1
      AND b.status IN ('QA_ASSIGNED', 'INSPECTION_SCHEDULED')
    ORDER BY b.inspection_requested_at ASC
  `, [qaAgencyId]);
  
  return result.rows;
}

/**
 * Schedule inspection for a batch
 */
async function scheduleInspection(batchId, qaAgencyId, scheduleData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE batches
      SET 
        inspection_scheduled_at = $1,
        inspection_type = $2,
        inspection_location = $3,
        status = 'INSPECTION_SCHEDULED',
        updated_at = NOW()
      WHERE id = $4 AND qa_agency_id = $5
      RETURNING *
    `, [
      scheduleData.scheduledAt,
      scheduleData.type || 'PHYSICAL',
      scheduleData.location || null,
      batchId,
      qaAgencyId,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Batch not found or not assigned to this QA agency');
    }

    // Add history entry
    await client.query(`
      INSERT INTO batch_history (batch_id, status, message)
      VALUES ($1, 'INSPECTION_SCHEDULED', $2)
    `, [
      batchId,
      `Inspection scheduled for ${new Date(scheduleData.scheduledAt).toLocaleString()}`,
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getActiveQAAgencies,
  getQAAgencyByUserId,
  createOrUpdateQAAgency,
  matchBatchToQA,
  assignBatchToQA,
  getPendingInspections,
  scheduleInspection,
};

