const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const { createUser } = require('../services/userService');

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['EXPORTER', 'QA', 'CUSTOMS', 'IMPORTER', 'ADMIN']),
  organization: z.string().min(1).optional(),
});

const create = asyncHandler(async (req, res) => {
  const payload = userSchema.parse(req.body);
  const newUser = await createUser(payload);
  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
      },
    },
  });
});

module.exports = {
  create,
};

