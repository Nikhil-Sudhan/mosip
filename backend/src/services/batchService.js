const { pool } = require('../db');
const { v4: uuid } = require('uuid');
const auditService = require('./auditService');
const qaAgencyService = require('./qaAgencyService');

/**
 * Batch Service - Handles batch management with PostgreSQL
 */

function organizeDocumentsByCategory(files, fileCategories) {
  const organized = {
    productDocuments: [],
    labReports: [],
    certifications: [],
    complianceDocs: [],
    packagingPhotos: [],
    general: [],
  };

  files.forEach((file, index) => {
    const category = fileCategories[index] || 'general';
    const doc = {
      id: uuid(),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.filename,
      url: `/uploads/${file.filename}`,
      category: category,
      uploadedAt: new Date().toISOString(),
    };

    if (category.startsWith('product')) {
      organized.productDocuments.push(doc);
    } else if (category.startsWith('lab')) {
      organized.labReports.push(doc);
    } else if (category.startsWith('certification')) {
      organized.certifications.push(doc);
    } else if (category.startsWith('compliance')) {
      organized.complianceDocs.push(doc);
    } else if (category.startsWith('packaging')) {
      organized.packagingPhotos.push(doc);
    } else {
      organized.general.push(doc);
    }
  });

  return organized;
}

async function saveBatchDocuments(batchId, organizedDocs, client = null) {
  const useTransaction = client !== null;
  if (!client) {
    client = await pool.connect();
    try {
      await client.query('BEGIN');
    } catch (error) {
      client.release();
      throw error;
    }
  }

  try {
    const allDocs = [
      ...organizedDocs.productDocuments,
      ...organizedDocs.labReports,
      ...organizedDocs.certifications,
      ...organizedDocs.complianceDocs,
      ...organizedDocs.packagingPhotos,
      ...organizedDocs.general,
    ];

    for (const doc of allDocs) {
      await client.query(`
        INSERT INTO batch_documents (batch_id, original_name, mime_type, size, path, url, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        batchId,
        doc.originalName,
        doc.mimeType,
        doc.size,
        doc.path,
        doc.url,
        doc.category,
      ]);
    }

    if (!useTransaction) {
      await client.query('COMMIT');
    }
  } catch (error) {
    if (!useTransaction) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (!useTransaction) {
      client.release();
    }
  }
}

async function getBatchDocuments(batchId) {
  const result = await pool.query(
    'SELECT * FROM batch_documents WHERE batch_id = $1 ORDER BY uploaded_at ASC',
    [batchId]
  );
  return result.rows;
}

async function getBatchHistory(batchId) {
  const result = await pool.query(
    'SELECT * FROM batch_history WHERE batch_id = $1 ORDER BY created_at ASC',
    [batchId]
  );
  return result.rows;
}

async function addBatchHistory(batchId, status, message, client = null) {
  const query = client || pool;
  await query.query(`
    INSERT INTO batch_history (batch_id, status, message)
    VALUES ($1, $2, $3)
  `, [batchId, status, message]);
}

function canViewBatch(user, batch) {
  if (!batch) return false;
  return (
    user.role === 'ADMIN' ||
    user.role === 'QA' ||
    batch.exporter_id === user.id ||
    batch.qa_agency_id === user.id
  );
}

async function listBatchesForUser(user) {
  let query = `
    SELECT 
      b.*,
      e.email as exporter_email,
      e.organization as exporter_organization,
      qa.email as qa_email,
      qa.organization as qa_organization
    FROM batches b
    LEFT JOIN users e ON b.exporter_id = e.id
    LEFT JOIN users qa ON b.qa_agency_id = qa.id
  `;
  const params = [];

  if (user.role === 'EXPORTER') {
    query += ' WHERE b.exporter_id = $1';
    params.push(user.id);
  } else if (user.role === 'QA') {
    query += ' WHERE b.qa_agency_id = $1';
    params.push(user.id);
  }
  // ADMIN and others see all

  query += ' ORDER BY b.created_at DESC';

  const result = await pool.query(query, params);
  
  // Enrich with documents and history
  const batches = await Promise.all(
    result.rows.map(async (batch) => {
      const [documents, history, inspection] = await Promise.all([
        getBatchDocuments(batch.id),
        getBatchHistory(batch.id),
        getBatchInspection(batch.id),
      ]);

      // Organize documents by category
      const organizedDocs = {
        productDocuments: documents.filter(d => d.category.startsWith('product')),
        labReports: documents.filter(d => d.category.startsWith('lab')),
        certifications: documents.filter(d => d.category.startsWith('certification')),
        complianceDocs: documents.filter(d => d.category.startsWith('compliance')),
        packagingPhotos: documents.filter(d => d.category.startsWith('packaging')),
        general: documents.filter(d => d.category === 'general'),
      };

      return {
        ...batch,
        exporterId: batch.exporter_id,
        qaAgencyId: batch.qa_agency_id,
        documents: organizedDocs,
        docs: documents, // Backward compatibility
        history: history,
        inspection: inspection,
      };
    })
  );

  return batches;
}

async function getBatchById(user, batchId) {
  const result = await pool.query(`
    SELECT 
      b.*,
      e.email as exporter_email,
      e.organization as exporter_organization,
      qa.email as qa_email,
      qa.organization as qa_organization
    FROM batches b
    LEFT JOIN users e ON b.exporter_id = e.id
    LEFT JOIN users qa ON b.qa_agency_id = qa.id
    WHERE b.id = $1
  `, [batchId]);

  if (result.rows.length === 0) {
    return null;
  }

  const batch = result.rows[0];
  if (!canViewBatch(user, batch)) {
    return null;
  }

  const [documents, history, inspection] = await Promise.all([
    getBatchDocuments(batch.id),
    getBatchHistory(batch.id),
    getBatchInspection(batch.id),
  ]);

  const organizedDocs = {
    productDocuments: documents.filter(d => d.category.startsWith('product')),
    labReports: documents.filter(d => d.category.startsWith('lab')),
    certifications: documents.filter(d => d.category.startsWith('certification')),
    complianceDocs: documents.filter(d => d.category.startsWith('compliance')),
    packagingPhotos: documents.filter(d => d.category.startsWith('packaging')),
    general: documents.filter(d => d.category === 'general'),
  };

  return {
    ...batch,
    exporterId: batch.exporter_id,
    qaAgencyId: batch.qa_agency_id,
    documents: organizedDocs,
    docs: documents,
    history: history,
    inspection: inspection,
  };
}

async function getBatchInspection(batchId) {
  const result = await pool.query(
    `SELECT 
      i.*,
      u.email as inspector_email,
      u.organization as inspector_organization
    FROM inspections i
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE i.batch_id = $1
    ORDER BY i.recorded_at DESC
    LIMIT 1`,
    [batchId]
  );
  return result.rows[0] || null;
}

async function createBatch(user, payload, files, fileCategories = []) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Organize documents
    const organizedDocs = organizeDocumentsByCategory(files, fileCategories);

    // Create batch
    const batchResult = await client.query(`
      INSERT INTO batches (
        exporter_id, product_type, grade, variety, batch_number,
        quantity, unit, weight, weight_unit, farm_address, farmer_details,
        harvest_date, organic_status, container_details,
        origin_country, destination_country, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'SUBMITTED')
      RETURNING *
    `, [
      user.id,
      payload.productType,
      payload.grade || null,
      payload.variety || null,
      payload.batchNumber,
      payload.quantity,
      payload.unit,
      payload.weight || null,
      payload.weightUnit || null,
      payload.farmAddress || null,
      payload.farmerDetails || null,
      payload.harvestDate,
      payload.organicStatus || 'NON_ORGANIC',
      payload.containerDetails || null,
      payload.originCountry,
      payload.destinationCountry,
      payload.notes || null,
    ]);

    const batch = batchResult.rows[0];

    // Save documents
    if (files.length > 0) {
      await saveBatchDocuments(batch.id, organizedDocs, client);
    }

    // Add history
    await addBatchHistory(batch.id, 'SUBMITTED', 'Batch submitted by exporter', client);

    // Match to QA agency
    try {
      const matchedQA = await qaAgencyService.matchBatchToQA({
        productType: payload.productType,
        id: batch.id,
      });

      if (matchedQA) {
        // Update batch within the same transaction
        await client.query(`
          UPDATE batches
          SET qa_agency_id = $1, inspection_requested_at = NOW(), status = 'QA_ASSIGNED'
          WHERE id = $2
        `, [matchedQA.user_id, batch.id]);
        await addBatchHistory(batch.id, 'QA_ASSIGNED', 'Batch assigned to QA agency for inspection', client);
      }
    } catch (error) {
      console.warn('QA matching failed:', error.message);
      // Continue without QA assignment - don't rollback the entire transaction
    }

    await client.query('COMMIT');

    // Audit log
    await auditService.logAction('batch.submitted', {
      userId: user.id,
      role: user.role,
      entityType: 'BATCH',
      entityId: batch.id,
      metadata: { productType: batch.product_type, batchNumber: batch.batch_number },
    });

    // Return enriched batch
    return getBatchById(user, batch.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function appendDocuments(user, batchId, files, fileCategories = []) {
  const batch = await getBatchById(user, batchId);
  if (!batch) {
    return null;
  }

  if (batch.exporterId !== user.id && user.role !== 'ADMIN') {
    return null;
  }

  const organizedDocs = organizeDocumentsByCategory(files, fileCategories);
  await saveBatchDocuments(batchId, organizedDocs);
  await addBatchHistory(batchId, batch.status, 'New supporting documents uploaded');

  return getBatchById(user, batchId);
}

async function recordInspection(user, batchId, payload) {
  const batch = await getBatchById(user, batchId);
  if (!batch) {
    return null;
  }

  if (user.role !== 'QA' && user.role !== 'ADMIN') {
    return null;
  }

  // Check if QA agency matches
  if (user.role === 'QA' && batch.qaAgencyId !== user.id) {
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create inspection record
    await client.query(`
      INSERT INTO inspections (
        batch_id, inspector_id, moisture_percent, pesticide_ppm,
        organic_status, iso_code, result, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      batchId,
      user.id,
      payload.moisturePercent,
      payload.pesticidePPM,
      payload.organicStatus,
      payload.isoCode,
      payload.result,
      payload.notes || null,
    ]);

    // Update batch status
    const newStatus = payload.result === 'PASS' ? 'INSPECTED' : 'REJECTED';
    await client.query(`
      UPDATE batches
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, [newStatus, batchId]);

    await addBatchHistory(batchId, newStatus, `Inspection recorded (${payload.result})`, client);

    await client.query('COMMIT');

    await auditService.logAction('inspection.recorded', {
      userId: user.id,
      role: user.role,
      entityType: 'BATCH',
      entityId: batchId,
      metadata: { result: payload.result },
    });

    return getBatchById(user, batchId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function markBatchCertified(batchId, actor = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE batches
      SET status = 'CERTIFIED', updated_at = NOW()
      WHERE id = $1
    `, [batchId]);

    await addBatchHistory(
      batchId,
      'CERTIFIED',
      `Credential issued by ${actor.organization || 'QA Team'}`,
      client
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listBatchesForUser,
  getBatchById,
  createBatch,
  appendDocuments,
  recordInspection,
  markBatchCertified,
};
