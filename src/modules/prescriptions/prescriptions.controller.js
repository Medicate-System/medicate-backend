const service = require('./prescriptions.service');
const { success, created, paginated } = require('../../utils/apiResponse');

const uploadPrescription = async (req, res) => {
  if (!req.file) throw new Error('No file uploaded');
  const data = await service.uploadPrescription(req.user.id, req.file.buffer, req.file.mimetype, req.body.notes);
  created(res, data, 'Prescription uploaded');
};

const issuePrescription  = async (req, res) => created(res, await service.issuePrescription(req.user.id, req.body), 'Prescription issued');
const getMyPrescriptions = async (req, res) => { const { prescriptions, meta } = await service.getMyPrescriptions(req.user.id, req.query); paginated(res, prescriptions, meta); };
const getPrescriptionById = async (req, res) => success(res, await service.getPrescriptionById(req.params.prescriptionId, req.user.id));
const dispensePrescription = async (req, res) => success(res, await service.dispensePrescription(req.user.id, req.params.prescriptionId, req.body.notes), 'Prescription dispensed');

module.exports = { uploadPrescription, issuePrescription, getMyPrescriptions, getPrescriptionById, dispensePrescription };