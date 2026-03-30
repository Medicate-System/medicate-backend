const service = require('./pharmacies.service');
const { success, paginated } = require('../../utils/apiResponse');

const getMyProfile    = async (req, res) => success(res, await service.getMyProfile(req.user.id));
const upsertProfile   = async (req, res) => success(res, await service.upsertProfile(req.user.id, req.body), 'Profile updated');
const updateLogo      = async (req, res) => { if (!req.file) throw new Error('No file'); success(res, await service.updateLogo(req.user.id, req.file.buffer), 'Logo updated'); };
const searchPharmacies = async (req, res) => { const { pharmacies, meta } = await service.searchPharmacies(req.query); paginated(res, pharmacies, meta); };
const getPharmacyById = async (req, res) => success(res, await service.getPharmacyById(req.params.pharmacyId));
const verifyPharmacy  = async (req, res) => success(res, await service.verifyPharmacy(req.params.pharmacyId), 'Pharmacy verified');

module.exports = { getMyProfile, upsertProfile, updateLogo, searchPharmacies, getPharmacyById, verifyPharmacy };